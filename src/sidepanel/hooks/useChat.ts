import { useState, useEffect, useRef, useCallback } from 'react'
import type { AgentSettings, AgentEvent, ChatMessage } from '../../shared/types'
import { PORT_NAME } from '../../shared/constants'
import { StreamDebouncer } from '../utils/stream-debouncer'

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface UIThinkingBlock {
  id: string
  text: string
  isOpen: boolean
  sequence: number
}

export interface UIToolCall {
  id: string
  name: string
  input?: Record<string, unknown>
  result?: { success: boolean; output?: unknown; error?: string; screenshot?: string }
  status: 'pending' | 'running' | 'done' | 'error'
  sequence: number
}

export interface UIPlanCreation {
  id: string
  content: string  // Raw plan markdown being accumulated
  isComplete: boolean
  sequence: number
}

export interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  toolCalls: UIToolCall[]
  thinkingBlocks: UIThinkingBlock[]
  planCreation?: UIPlanCreation  // Plan being created
  isStreaming: boolean
  error?: string
  timestamp: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 11)
}

// Extract inline thinking blocks from text and return cleaned text + blocks (all collapsed).
// Handles: <think>...</think>, <thinking>...</thinking>, and Poe's *Thinking...*\n> format.
function extractThinkingBlocks(
  text: string,
  existing: UIThinkingBlock[],
): { text: string; thinkingBlocks: UIThinkingBlock[] } {
  const blocks: UIThinkingBlock[] = [...existing]
  let cleaned = text

  // <think>...</think> or <thinking>...</thinking>
  cleaned = cleaned.replace(/<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/gi, (_, inner) => {
    if (inner.trim()) blocks.push({ id: uid(), text: inner.trim(), isOpen: false, sequence: 0 })
    return ''
  })

  // Poe format: *Thinking...*\n\n> line1\n> line2\n\n
  cleaned = cleaned.replace(/\*Thinking\.\.\.\*\n+((?:>[^\n]*(?:\n|$))+)/gi, (_, blockquote) => {
    const thinkText = blockquote
      .split('\n')
      .filter((l: string) => l.startsWith('>'))
      .map((l: string) => l.replace(/^>\s?/, ''))
      .join('\n')
      .trim()
    if (thinkText) blocks.push({ id: uid(), text: thinkText, isOpen: false, sequence: 0 })
    return ''
  })

  return { text: cleaned.trim(), thinkingBlocks: blocks }
}

// Extract plan from text (between <plan>...</plan> tags) and return cleaned text + plan.
function extractPlan(text: string): { text: string; plan: string | null } {
  // Try to match plan tags - prefer strict closing tag on its own line
  const planMatch = text.match(/<plan>([\s\S]*?)<\/plan>\s*$/im)
    || text.match(/<plan>([\s\S]*?)<\/plan>/i)

  if (planMatch && planMatch[1]) {
    const plan = planMatch[1].trim()
    // Remove the plan section from text, keeping text before <plan> and after </plan>
    const cleaned = text.replace(/<plan>[\s\S]*?<\/plan>\s*/i, '').trim()
    return { text: cleaned, plan }
  }
  return { text, plan: null }
}

function convertStoredMessages(messages: ChatMessage[]): UIMessage[] {
  const result: UIMessage[] = []

  for (const msg of messages) {
    if (msg.role !== 'user' && msg.role !== 'assistant') continue

    const textPart = msg.content.find((c) => c.type === 'text')
    const text = textPart?.type === 'text' ? textPart.text : ''

    const toolCalls: UIToolCall[] = msg.content
      .filter((c) => c.type === 'tool_call')
      .map((c) => {
        if (c.type !== 'tool_call') return null
        return { id: c.id, name: c.name, input: c.input, status: 'done' as const, sequence: 0 }
      })
      .filter(Boolean) as UIToolCall[]

    // Extract thinking blocks from message content
    const thinkingBlocks: UIThinkingBlock[] = msg.content
      .filter((c) => c.type === 'thinking')
      .map((c, idx) => {
        if (c.type !== 'thinking') return null
        return { id: uid(), text: c.thinkingText || '', isOpen: false, sequence: idx }
      })
      .filter(Boolean) as UIThinkingBlock[]

    if (text || toolCalls.length || thinkingBlocks.length) {
      result.push({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        text,
        toolCalls,
        thinkingBlocks,
        isStreaming: false,
        timestamp: msg.timestamp,
      })
    }
  }

  return result
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat(settings: AgentSettings, loadSessionId?: string | null) {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [sessionId] = useState(() => loadSessionId ?? uid())
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingPlan, setPendingPlan] = useState<{ messageId: string; plan: string } | null>(null)
  const eventSequenceRef = useRef(0)
  const debouncerRef = useRef<StreamDebouncer | null>(null)

  // Load session when sessionId changes
  useEffect(() => {
    setMessages([])
    setIsRunning(false)
    setError(null)

    if (loadSessionId) {
      chrome.runtime.sendMessage({ type: 'get_session', sessionId: loadSessionId }, (res) => {
        if (res?.success && res.data?.messages) {
          setMessages(convertStoredMessages(res.data.messages))
        }
      })
    }
  }, [loadSessionId])

  const portRef = useRef<chrome.runtime.Port | null>(null)
  const currentMsgId = useRef<string | null>(null)
  // Holds the reconnect function so sendMessage can call it
  const connectPortRef = useRef<(() => void) | null>(null)
  // Track plan creation state across deltas AND across multiple messages
  const planAccumulatorRef = useRef<{ content: string; isComplete: boolean } | null>(null)

  useEffect(() => {
    try {
      // Initialize debouncer if not already created
      if (!debouncerRef.current) {
        debouncerRef.current = new StreamDebouncer((debouncedDelta) => {
          try {
            const { text, messageId } = debouncedDelta

            // Handle plan content streaming
            let regularText = text
            let planContent = ''

            // Check if we're currently accumulating a plan (from previous messages)
            if (planAccumulatorRef.current && !planAccumulatorRef.current.isComplete) {
              // Continue accumulating plan from previous message
              planAccumulatorRef.current.content += text
              regularText = ''
              planContent = planAccumulatorRef.current.content

              // Check if plan is now complete
              if (planAccumulatorRef.current.content.includes('</plan>')) {
                planAccumulatorRef.current.isComplete = true
              }
            } else if (text.includes('<plan>')) {
              // Starting a new plan
              const planStart = text.indexOf('<plan>')
              regularText = text.substring(0, planStart)
              planContent = text.substring(planStart)

              const isComplete = text.includes('</plan>')
              // Start accumulating plan (may span across multiple messages)
              planAccumulatorRef.current = { content: planContent, isComplete }
            }

            setMessages((prev) => {
              const last = prev[prev.length - 1]
              if (last?.id === messageId && last.role === 'assistant') {
                const updated = { ...last, isStreaming: true }

                // Add regular text
                if (regularText) {
                  updated.text = last.text + regularText
                }

                // Handle plan creation
                if (planContent) {
                  const isComplete = planContent.includes('</plan>')
                  const seq = ++eventSequenceRef.current

                  if (!updated.planCreation) {
                    updated.planCreation = { id: uid(), content: planContent, isComplete: false, sequence: seq }
                  } else {
                    updated.planCreation = { ...updated.planCreation, content: planContent, isComplete }
                  }
                }

                return [...prev.slice(0, -1), updated]
              }

              // Create new message
              const newMsg: UIMessage = {
                id: messageId, role: 'assistant', text: regularText, toolCalls: [],
                thinkingBlocks: [], isStreaming: true, timestamp: Date.now(),
              }

              if (planContent) {
                const isComplete = planContent.includes('</plan>')
                newMsg.planCreation = {
                  id: uid(),
                  content: planContent,
                  isComplete,
                  sequence: ++eventSequenceRef.current,
                }
              }

              return [...prev, newMsg]
            })
          } catch (err) {
            // Error handling in debouncer
          }
        }, 50) // 50ms debounce interval
      }
    } catch (err) {
      // Debouncer setup error - will handle gracefully
    }

    // Event handler defined once; state setters are stable refs so no deps needed
    function handleEvent(event: AgentEvent) {
      switch (event.type) {
        // ── Streaming text (debounced) ──────────────────────────────────────
        case 'text_delta': {
          const { text, messageId } = event
          currentMsgId.current = messageId
          // Buffer the delta instead of immediately updating
          if (debouncerRef.current) {
            debouncerRef.current.addDelta({ type: 'text_delta', text, messageId })
          }
          break
        }

        // ── Thinking blocks ─────────────────────────────────────────────────
        case 'thinking': {
          const { text, messageId } = event as { text: string; messageId: string }
          currentMsgId.current = messageId
          const seq = ++eventSequenceRef.current

          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === messageId && m.role === 'assistant')

            if (idx === -1) {
              return [...prev, {
                id: messageId, role: 'assistant', text: '', toolCalls: [],
                thinkingBlocks: [{ id: uid(), text, isOpen: true, sequence: seq }],
                isStreaming: true, timestamp: Date.now(),
              }]
            }

            const updated = [...prev]
            const msg = { ...updated[idx] }
            const lastBlock = msg.thinkingBlocks[msg.thinkingBlocks.length - 1]

            if (lastBlock?.isOpen) {
              msg.thinkingBlocks = [
                ...msg.thinkingBlocks.slice(0, -1),
                { ...lastBlock, text: lastBlock.text + text },
              ]
            } else {
              msg.thinkingBlocks = [...msg.thinkingBlocks, { id: uid(), text, isOpen: true, sequence: seq }]
            }

            updated[idx] = msg
            return updated
          })
          break
        }

        // ── Tool call start ─────────────────────────────────────────────────
        case 'tool_call_start': {
          const { messageId, toolCallId, toolName } = event
          currentMsgId.current = messageId
          const seq = ++eventSequenceRef.current

          setMessages((prev) => {
            const last = prev[prev.length - 1]
            const newTool: UIToolCall = { id: toolCallId, name: toolName, status: 'running', sequence: seq }

            if (last?.id === messageId && last.role === 'assistant') {
              return [...prev.slice(0, -1), {
                ...last,
                thinkingBlocks: last.thinkingBlocks.map((b) => ({ ...b, isOpen: false })),
                toolCalls: [...last.toolCalls, newTool],
                isStreaming: true,
              }]
            }
            return [...prev, {
              id: messageId, role: 'assistant', text: '', toolCalls: [newTool],
              thinkingBlocks: [], isStreaming: true, timestamp: Date.now(),
            }]
          })
          break
        }

        // ── Tool call result ────────────────────────────────────────────────
        case 'tool_call_result': {
          const { toolCallId, result } = event
          setMessages((prev) =>
            prev.map((msg) => {
              const i = msg.toolCalls.findIndex((t) => t.id === toolCallId)
              if (i === -1) return msg
              const calls = [...msg.toolCalls]
              calls[i] = { ...calls[i], result, status: result.success ? 'done' : 'error' }
              return { ...msg, toolCalls: calls }
            }),
          )
          break
        }

        // ── Message complete (one provider turn done, agent may still be running) ──
        case 'message_complete': {
          const { messageId, stopReason } = event
          // Flush any remaining buffered text
          if (debouncerRef.current) {
            debouncerRef.current.flush(messageId)
          }

          // Extract plan ONLY if it's complete
          let extractedPlan: string | null = null
          if (planAccumulatorRef.current?.isComplete && planAccumulatorRef.current?.content) {
            console.log('[PLAN] Complete plan found:', planAccumulatorRef.current.content.substring(0, 100))
            const { plan } = extractPlan(planAccumulatorRef.current.content)
            console.log('[PLAN] Extracted plan:', plan ? 'YES' : 'NO', plan?.substring(0, 50))
            extractedPlan = plan
            // Clear accumulator only after successful extraction
            planAccumulatorRef.current = null
          } else if (planAccumulatorRef.current?.content) {
            console.log('[PLAN] Plan incomplete, waiting for more:', planAccumulatorRef.current.content.substring(0, 100))
          }

          // Update messages (collapse thinking blocks, mark plan as complete)
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m
              // Extract inline thinking blocks, collapse all thinking after streaming stops
              const { text: textAfterThinking, thinkingBlocks } = extractThinkingBlocks(m.text, m.thinkingBlocks)

              return {
                ...m,
                text: textAfterThinking,
                thinkingBlocks: thinkingBlocks.map((b) => ({ ...b, isOpen: false })),
                planCreation: m.planCreation ? { ...m.planCreation, isComplete: true } : undefined,
                isStreaming: false,
              }
            }),
          )

          // If a plan was extracted OR backend says stopReason is 'plan_pending', show approval dialog
          console.log('[PLAN] message_complete handler:', {
            extractedPlan: !!extractedPlan,
            stopReason,
            hasAccumulator: !!planAccumulatorRef.current?.content,
            accumulatorContent: planAccumulatorRef.current?.content?.substring(0, 100),
          })

          if (extractedPlan) {
            console.log('[PLAN] ✓ Showing plan approval dialog (extracted)')
            setPendingPlan({ messageId, plan: extractedPlan })
            setIsRunning(false)
          } else if (stopReason === 'plan_pending') {
            // Backend detected plan_pending, try to use accumulated content
            console.log('[PLAN] ✓ Backend says plan_pending, stopReason detected')
            if (planAccumulatorRef.current?.content) {
              const { plan } = extractPlan(planAccumulatorRef.current.content)
              console.log('[PLAN] Extracted from accumulator:', !!plan)
              if (plan) {
                setPendingPlan({ messageId, plan })
                setIsRunning(false)
                planAccumulatorRef.current = null
              }
            } else {
              console.log('[PLAN] ⚠ plan_pending but no accumulator content!')
            }
          } else {
            console.log('[PLAN] No plan detected, no stopReason')
          }

          currentMsgId.current = null
          break
        }

        // ── Agent complete (entire loop done) ───────────────────────────────
        case 'agent_complete': {
          setIsRunning(false)
          currentMsgId.current = null
          // Ensure all thinking blocks are collapsed
          setMessages((prev) =>
            prev.map((m) => ({
              ...m,
              thinkingBlocks: m.thinkingBlocks.map((b) => ({ ...b, isOpen: false })),
            })),
          )
          break
        }

        // ── Rate limited ────────────────────────────────────────────────────
        case 'rate_limited': {
          const { waitTimeMs, attemptCount } = event
          const waitSecs = Math.ceil(waitTimeMs / 1000)
          setError(`Rate limited (attempt ${attemptCount}). Retrying in ${waitSecs}s...`)
          break
        }

        // ── Error ───────────────────────────────────────────────────────────
        case 'error': {
          const { error: err } = event
          setError(err)
          setIsRunning(false)
          const mid = currentMsgId.current
          if (mid) {
            setMessages((prev) =>
              prev.map((m) => (m.id === mid ? { ...m, isStreaming: false, error: err } : m)),
            )
          }
          currentMsgId.current = null
          break
        }
      }
    }

    function connectPort() {
      try {
        const port = chrome.runtime.connect({ name: PORT_NAME })
        portRef.current = port
        port.onMessage.addListener(handleEvent)
        port.onDisconnect.addListener(() => {
          portRef.current = null
        })
      } catch (err) {
        // Port connection error - will retry on next message
      }
    }

    connectPortRef.current = connectPort
    connectPort()

    return () => {
      connectPortRef.current = null
      portRef.current?.disconnect()
      portRef.current = null
    }
  }, [])

  // ─── Actions ───────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (text: string, attachedTabId?: number, options?: { enablePlanning?: boolean; chatModeOnly?: boolean }) => {
      try {
        if (isRunning) {
          return
        }

        setError(null)
        setIsRunning(true)

        // Strip base64 blobs from the displayed bubble — show just "📎 filename" pills.
        // The full text (with base64) is still sent to the agent for the API call.
        const displayText = text.replace(
          /\n\n\[Attached file: ([^\]]+)\]\ndata:[^\s]+/g,
          '\n\n📎 $1',
        )

        const userMsg: UIMessage = {
          id: uid(), role: 'user', text: displayText, toolCalls: [],
          thinkingBlocks: [], isStreaming: false, timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, userMsg])

        // Save session as last active session
        chrome.storage.local.set({ harbor_last_session: sessionId })

        // Reconnect port if background service worker went idle
        if (!portRef.current) {
          connectPortRef.current?.()
        }

        if (!portRef.current) {
          setError('Lost connection to agent. Please try again.')
          setIsRunning(false)
          return
        }

        portRef.current.postMessage({ type: 'chat', sessionId, message: text, attachedTabId, ...options })
      } catch (err) {
        setError(`Error sending message: ${err instanceof Error ? err.message : String(err)}`)
        setIsRunning(false)
      }
    },
    [sessionId, isRunning],
  )

  const stopAgent = useCallback(() => {
    if (!portRef.current) return
    portRef.current.postMessage({ type: 'stop', sessionId })
    setIsRunning(false)
    const mid = currentMsgId.current
    if (mid) {
      setMessages((prev) => prev.map((m) => (m.id === mid ? { ...m, isStreaming: false } : m)))
      currentMsgId.current = null
    }
  }, [sessionId])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setIsRunning(false)
    portRef.current?.postMessage({ type: 'clear_session', sessionId })
  }, [sessionId])

  const toggleThinkingBlock = useCallback((messageId: string, blockId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id !== messageId
          ? msg
          : {
              ...msg,
              thinkingBlocks: msg.thinkingBlocks.map((b) =>
                b.id === blockId ? { ...b, isOpen: !b.isOpen } : b,
              ),
            },
      ),
    )
  }, [])

  const editMessage = useCallback((messageId: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, text: newText } : msg,
      ),
    )
  }, [])

  const approvePlan = useCallback(() => {
    setPendingPlan(null)
    if (!portRef.current) return
    portRef.current.postMessage({ type: 'continue_execution', sessionId })
  }, [sessionId])

  const denyPlan = useCallback(() => {
    setPendingPlan(null)
    setIsRunning(false)
    const mid = pendingPlan?.messageId
    if (mid) {
      setMessages((prev) => prev.map((m) => (m.id === mid ? { ...m, isStreaming: false } : m)))
    }
    if (!portRef.current) return
    portRef.current.postMessage({ type: 'cancel_task', sessionId })
  }, [sessionId, pendingPlan])

  const modifyPlan = useCallback((newPlan: string) => {
    if (!portRef.current) return
    portRef.current.postMessage({ type: 'update_plan', sessionId, plan: newPlan })
    setPendingPlan(null)
  }, [sessionId])

  return {
    messages, isRunning, error, sessionId,
    sendMessage, stopAgent, clearMessages, toggleThinkingBlock, editMessage,
    pendingPlan, approvePlan, denyPlan, modifyPlan,
  }
}
