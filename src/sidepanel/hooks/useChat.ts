import { useState, useEffect, useRef, useCallback } from 'react'
import type { AgentSettings, AgentEvent, ChatMessage } from '../../shared/types'
import { PORT_NAME } from '../../shared/constants'

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface UIThinkingBlock {
  id: string
  text: string
  isOpen: boolean
}

export interface UIToolCall {
  id: string
  name: string
  input?: Record<string, unknown>
  result?: { success: boolean; output?: unknown; error?: string; screenshot?: string }
  status: 'pending' | 'running' | 'done' | 'error'
}

export interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  toolCalls: UIToolCall[]
  thinkingBlocks: UIThinkingBlock[]
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
    if (inner.trim()) blocks.push({ id: uid(), text: inner.trim(), isOpen: false })
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
    if (thinkText) blocks.push({ id: uid(), text: thinkText, isOpen: false })
    return ''
  })

  return { text: cleaned.trim(), thinkingBlocks: blocks }
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
        return { id: c.id, name: c.name, input: c.input, status: 'done' as const }
      })
      .filter(Boolean) as UIToolCall[]

    if (text || toolCalls.length) {
      result.push({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        text,
        toolCalls,
        thinkingBlocks: [],
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

  useEffect(() => {
    // Event handler defined once; state setters are stable refs so no deps needed
    function handleEvent(event: AgentEvent) {
      switch (event.type) {
        // ── Streaming text ──────────────────────────────────────────────────
        case 'text_delta': {
          const { text, messageId } = event
          currentMsgId.current = messageId
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.id === messageId && last.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, text: last.text + text, isStreaming: true }]
            }
            // If the last message is a streaming assistant msg with thinking blocks,
            // reasoning_content arrived before text — merge into that message instead
            if (last?.role === 'assistant' && last.isStreaming && last.thinkingBlocks.length > 0 && !last.text) {
              return [...prev.slice(0, -1), { ...last, id: messageId, text, isStreaming: true }]
            }
            return [...prev, {
              id: messageId, role: 'assistant', text, toolCalls: [],
              thinkingBlocks: [], isStreaming: true, timestamp: Date.now(),
            }]
          })
          break
        }

        // ── Thinking blocks ─────────────────────────────────────────────────
        case 'thinking': {
          const { text } = event
          const msgId = currentMsgId.current ?? (() => {
            const id = uid()
            currentMsgId.current = id
            return id
          })()

          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === msgId && m.role === 'assistant')

            if (idx === -1) {
              return [...prev, {
                id: msgId, role: 'assistant', text: '', toolCalls: [],
                thinkingBlocks: [{ id: uid(), text, isOpen: true }],
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
              msg.thinkingBlocks = [...msg.thinkingBlocks, { id: uid(), text, isOpen: true }]
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

          setMessages((prev) => {
            const last = prev[prev.length - 1]
            const newTool: UIToolCall = { id: toolCallId, name: toolName, status: 'running' }

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
          const { messageId } = event
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m
              // Extract inline thinking blocks, collapse all thinking after streaming stops
              const { text, thinkingBlocks } = extractThinkingBlocks(m.text, m.thinkingBlocks)
              return {
                ...m,
                text,
                thinkingBlocks: thinkingBlocks.map((b) => ({ ...b, isOpen: false })),
                isStreaming: false,
              }
            }),
          )
          // Do NOT set isRunning: false here — agent may still be executing tool calls.
          // Wait for agent_complete.
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
      const port = chrome.runtime.connect({ name: PORT_NAME })
      portRef.current = port
      port.onMessage.addListener(handleEvent)
      port.onDisconnect.addListener(() => {
        portRef.current = null
      })
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
    (text: string, attachedTabId?: number) => {
      if (isRunning) return
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

      // Reconnect port if background service worker went idle
      if (!portRef.current) {
        connectPortRef.current?.()
      }

      if (!portRef.current) {
        setError('Lost connection to agent. Please try again.')
        setIsRunning(false)
        return
      }

      portRef.current.postMessage({ type: 'chat', sessionId, message: text, attachedTabId })
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

  return {
    messages, isRunning, error, sessionId,
    sendMessage, stopAgent, clearMessages, toggleThinkingBlock,
  }
}
