/**
 * Harbor Background Service Worker
 * Handles port connections from the side panel and runs the agent loop.
 */

import { runAgent } from './agent/agent'
import type { AgentSettings, StoredSettings, StoredSession, ChatMessage } from '../shared/types'
import type { PortMessage, AgentEvent } from '../shared/types'
import { PORT_NAME, STORAGE_KEYS } from '../shared/constants'

// ─── Default Settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AgentSettings = {
  provider: {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    apiKey: '',
  },
  maxTokens: 8192,
  enableMemory: false,
  enableScreenshots: true,
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

async function getSettings(): Promise<AgentSettings> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
  return (data[STORAGE_KEYS.SETTINGS] as StoredSettings)?.agentSettings ?? DEFAULT_SETTINGS
}

async function getSession(sessionId: string): Promise<StoredSession | null> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS)
  const sessions = (data[STORAGE_KEYS.SESSIONS] ?? {}) as Record<string, StoredSession>
  return sessions[sessionId] ?? null
}

async function saveSession(session: StoredSession): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS)
  const sessions = (data[STORAGE_KEYS.SESSIONS] ?? {}) as Record<string, StoredSession>
  sessions[session.id] = session
  await chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions })
}

async function getAllSessions(): Promise<StoredSession[]> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS)
  const sessions = (data[STORAGE_KEYS.SESSIONS] ?? {}) as Record<string, StoredSession>
  return Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt)
}

// ─── Active Agents ────────────────────────────────────────────────────────────

const activeControllers = new Map<string, AbortController>()

// ─── Port Connection Handler ──────────────────────────────────────────────────

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PORT_NAME) return

  console.log('[Harbor] Side panel connected')

  port.onDisconnect.addListener(() => {
    console.log('[Harbor] Side panel disconnected')
    // Abort any running agents for this port
    for (const [sessionId, controller] of activeControllers) {
      controller.abort()
      activeControllers.delete(sessionId)
    }
  })

  port.onMessage.addListener(async (message: PortMessage) => {
    try {
      switch (message.type) {
        case 'chat': {
          const { sessionId, message: userMessage, attachedTabId } = message

          // Abort any existing agent for this session
          const existing = activeControllers.get(sessionId)
          if (existing) {
            existing.abort()
            activeControllers.delete(sessionId)
          }

          const controller = new AbortController()
          activeControllers.set(sessionId, controller)

          // Load settings and session history
          const settings = await getSettings()
          const session = await getSession(sessionId)
          const history: ChatMessage[] = session?.messages ?? []

          // Add user message to history
          const userChatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: [{ type: 'text', text: userMessage }],
            timestamp: Date.now(),
          }
          history.push(userChatMessage)

          // Create assistant message placeholder
          const assistantMessageId = crypto.randomUUID()
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: [],
            timestamp: Date.now(),
          }
          history.push(assistantMessage)

          // Track content being built for the assistant message
          let assistantText = ''
          const pendingToolCalls = new Map<string, { name: string; input: Record<string, unknown> }>()

          const onEvent = (event: AgentEvent) => {
            // Update the assistant message content
            if (event.type === 'text_delta') {
              assistantText += event.text
              assistantMessage.content = [
                { type: 'text', text: assistantText },
                ...Array.from(pendingToolCalls.values()).map((tc) => ({
                  type: 'tool_call' as const,
                  id: crypto.randomUUID(),
                  name: tc.name,
                  input: tc.input,
                })),
              ]
            }

            // Forward event to side panel
            try {
              port.postMessage(event)
            } catch {
              // Port disconnected
            }
          }

          try {
            await runAgent({
              sessionId,
              message: userMessage,
              settings,
              history: session?.messages ?? [],
              attachedTabId,
              onEvent,
              signal: controller.signal,
            })
          } catch (err) {
            onEvent({ type: 'error', error: err instanceof Error ? err.message : String(err) })
          } finally {
            activeControllers.delete(sessionId)
          }

          // Update assistant message with final text
          if (assistantText && assistantMessage.content.every((c) => c.type !== 'text')) {
            assistantMessage.content.unshift({ type: 'text', text: assistantText })
          }

          // Save session
          const updatedSession: StoredSession = {
            id: sessionId,
            messages: [...(session?.messages ?? []), userChatMessage, assistantMessage],
            createdAt: session?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
            title: session?.title ?? userMessage.slice(0, 60),
          }
          await saveSession(updatedSession)

          break
        }

        case 'stop': {
          const { sessionId } = message
          const controller = activeControllers.get(sessionId)
          if (controller) {
            controller.abort()
            activeControllers.delete(sessionId)
          }
          break
        }

        case 'clear_session': {
          const { sessionId } = message
          const data = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS)
          const sessions = (data[STORAGE_KEYS.SESSIONS] ?? {}) as Record<string, StoredSession>
          delete sessions[sessionId]
          await chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions })
          break
        }
      }
    } catch (err) {
      console.error('[Harbor] Error handling port message:', err)
      try {
        port.postMessage({ type: 'error', error: err instanceof Error ? err.message : String(err) })
      } catch {
        // Port disconnected
      }
    }
  })
})

// ─── Message Handler (for non-port messages) ─────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  ;(async () => {
    try {
      switch (message.type) {
        case 'get_settings': {
          const settings = await getSettings()
          sendResponse({ success: true, data: settings })
          break
        }

        case 'save_settings': {
          const { settings, theme } = message as { settings: AgentSettings; theme?: string }
          const stored: StoredSettings = {
            agentSettings: settings,
            theme: (theme as 'light' | 'dark' | 'system') || 'system',
          }
          await chrome.storage.local.set({
            [STORAGE_KEYS.SETTINGS]: stored,
            'harbor_settings_cache': JSON.stringify(settings) // Debug cache
          })
          console.log('[Harbor] Settings saved:', stored)
          sendResponse({ success: true, data: stored })
          break
        }

        case 'get_sessions': {
          const sessions = await getAllSessions()
          sendResponse({ success: true, data: sessions })
          break
        }

        case 'get_session': {
          const { sessionId } = message as { sessionId: string }
          const session = await getSession(sessionId)
          sendResponse({ success: true, data: session })
          break
        }

        case 'delete_session': {
          const { sessionId } = message as { sessionId: string }
          const data = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS)
          const sessions = (data[STORAGE_KEYS.SESSIONS] ?? {}) as Record<string, StoredSession>
          delete sessions[sessionId]
          await chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions })
          sendResponse({ success: true })
          break
        }

        case 'get_active_tab': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
          sendResponse({ success: true, data: tab })
          break
        }

        case 'harbor_content_ready':
          // Content script loaded successfully
          break

        default:
          sendResponse({ success: false, error: `Unknown message type: ${message.type}` })
      }
    } catch (err) {
      sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) })
    }
  })()

  return true // Keep channel open for async
})

// ─── Action Button → Open Side Panel ─────────────────────────────────────────

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})

// ─── Install Handler ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Harbor] Extension installed. Welcome!')
    // Open side panel on first install
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.windowId) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId })
      }
    })
  }
})

console.log('[Harbor] Service worker started')
