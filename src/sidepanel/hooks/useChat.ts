import { useState, useEffect, useRef, useCallback } from 'react'
import type { AgentSettings, AgentEvent } from '../../shared/types'
import { PORT_NAME } from '../../shared/constants'

export interface UIThinkingBlock {
  id: string
  text: string
  isOpen: boolean
  timestamp: number
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

export interface UIToolCall {
  id: string
  name: string
  input?: Record<string, unknown>
  result?: { success: boolean; output?: unknown; error?: string; screenshot?: string }
  status: 'pending' | 'running' | 'done' | 'error'
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export function useChat(settings: AgentSettings) {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [sessionId] = useState(() => generateId())
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const portRef = useRef<chrome.runtime.Port | null>(null)
  const currentAssistantMsgId = useRef<string | null>(null)

  // Connect to background service worker
  useEffect(() => {
    const port = chrome.runtime.connect({ name: PORT_NAME })
    portRef.current = port

    port.onMessage.addListener((event: AgentEvent) => {
      switch (event.type) {
        case 'text_delta': {
          const { text, messageId } = event
          currentAssistantMsgId.current = messageId
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.id === messageId && last.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + text, isStreaming: true },
              ]
            }
            // New assistant message
            const newMsg: UIMessage = {
              id: messageId,
              role: 'assistant',
              text,
              toolCalls: [],
              thinkingBlocks: [],
              isStreaming: true,
              timestamp: Date.now(),
            }
            return [...prev, newMsg]
          })
          break
        }

        case 'thinking': {
          const { text, messageId } = event as { type: 'thinking'; text: string; messageId?: string }
          const id = messageId || currentAssistantMsgId.current
          if (!id) break

          setMessages((prev) => {
            const msgIdx = prev.findIndex((m) => m.id === id && m.role === 'assistant')
            if (msgIdx === -1) return prev

            const updated = [...prev]
            const msg = { ...updated[msgIdx] }

            // Find or create thinking block
            const lastThinking = msg.thinkingBlocks[msg.thinkingBlocks.length - 1]
            if (lastThinking && !lastThinking.isOpen) {
              // Create new thinking block
              msg.thinkingBlocks = [
                ...msg.thinkingBlocks,
                { id: generateId(), text, isOpen: true, timestamp: Date.now() },
              ]
            } else if (lastThinking && lastThinking.isOpen) {
              // Append to existing open thinking block
              lastThinking.text += text
            } else {
              // First thinking block
              msg.thinkingBlocks = [
                { id: generateId(), text, isOpen: true, timestamp: Date.now() },
              ]
            }

            updated[msgIdx] = msg
            return updated
          })
          break
        }

        case 'tool_call_start': {
          const { messageId, toolCallId, toolName } = event
          currentAssistantMsgId.current = messageId

          const newToolCall: UIToolCall = {
            id: toolCallId,
            name: toolName,
            status: 'running',
          }

          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.id === messageId && last.role === 'assistant') {
              // Close any open thinking blocks when tool starts
              const updated = { ...last }
              updated.thinkingBlocks = updated.thinkingBlocks.map((tb) =>
                tb.isOpen ? { ...tb, isOpen: false } : tb
              )
              return [
                ...prev.slice(0, -1),
                { ...updated, toolCalls: [...updated.toolCalls, newToolCall], isStreaming: true },
              ]
            }
            // Create new assistant message if it doesn't exist
            const newMsg: UIMessage = {
              id: messageId,
              role: 'assistant',
              text: '',
              toolCalls: [newToolCall],
              thinkingBlocks: [],
              isStreaming: true,
              timestamp: Date.now(),
            }
            return [...prev, newMsg]
          })
          break
        }

        case 'tool_call_result': {
          const { toolCallId, result } = event
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.role !== 'assistant') return msg
              const toolCallIdx = msg.toolCalls.findIndex((tc) => tc.id === toolCallId)
              if (toolCallIdx === -1) return msg
              const updatedCalls = [...msg.toolCalls]
              updatedCalls[toolCallIdx] = {
                ...updatedCalls[toolCallIdx],
                result,
                status: result.success ? 'done' : 'error',
              }
              return { ...msg, toolCalls: updatedCalls }
            })
          )
          break
        }

        case 'message_complete': {
          const { messageId } = event
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, isStreaming: false } : msg
            )
          )
          setIsRunning(false)
          currentAssistantMsgId.current = null
          break
        }

        case 'error': {
          const { error } = event
          setError(error)
          setIsRunning(false)

          // Mark current message as having error
          const msgId = currentAssistantMsgId.current
          if (msgId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId ? { ...msg, isStreaming: false, error } : msg
              )
            )
          }
          currentAssistantMsgId.current = null
          break
        }
      }
    })

    port.onDisconnect.addListener(() => {
      portRef.current = null
    })

    return () => {
      port.disconnect()
    }
  }, [])

  const sendMessage = useCallback(
    (text: string, attachedTabId?: number) => {
      if (!portRef.current || isRunning) return

      setError(null)
      setIsRunning(true)

      // Add user message
      const userMsg: UIMessage = {
        id: generateId(),
        role: 'user',
        text,
        toolCalls: [],
        thinkingBlocks: [],
        isStreaming: false,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])

      // Send to background
      portRef.current.postMessage({
        type: 'chat',
        sessionId,
        message: text,
        attachedTabId,
      })
    },
    [sessionId, isRunning]
  )

  const stopAgent = useCallback(() => {
    if (!portRef.current) return
    portRef.current.postMessage({ type: 'stop', sessionId })
    setIsRunning(false)

    // Mark current message as stopped
    const msgId = currentAssistantMsgId.current
    if (msgId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId ? { ...msg, isStreaming: false } : msg
        )
      )
      currentAssistantMsgId.current = null
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
      prev.map((msg) => {
        if (msg.id !== messageId) return msg
        return {
          ...msg,
          thinkingBlocks: msg.thinkingBlocks.map((tb) =>
            tb.id === blockId ? { ...tb, isOpen: !tb.isOpen } : tb
          ),
        }
      })
    )
  }, [])

  return { messages, isRunning, error, sendMessage, stopAgent, clearMessages, toggleThinkingBlock }
}
