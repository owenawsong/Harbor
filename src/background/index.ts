/**
 * Harbor Background Service Worker
 */

import { runAgent } from './agent/agent'
import type { AgentSettings, StoredSettings, StoredSession, ChatMessage } from '../shared/types'
import type { PortMessage, AgentEvent } from '../shared/types'
import { PORT_NAME, STORAGE_KEYS, VERSION } from '../shared/constants'

console.log(`🌊 Harbor Extension loaded - Version ${VERSION}`)

// ─── Global Command Listener ──────────────────────────────────────────────────
// Listen for keyboard commands registered in manifest.json
chrome.commands.onCommand.addListener((command) => {
  console.log('🎯 [COMMAND] Received command:', command)

  if (command === 'toggle-command-palette') {
    console.log('🎯 [COMMAND] Toggling command palette...')
    // Get the active tab and send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        console.log('🎯 [COMMAND] Sending toggle to tab:', tabs[0].id)
        chrome.tabs.sendMessage(tabs[0].id, { type: 'harbor_toggle_palette' }).catch((err) => {
          console.warn('⚠️  [COMMAND] Could not send to tab (content script not loaded):', err)
        })
      }
    })
  }
})

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AgentSettings = {
  provider: { provider: 'anthropic', model: 'claude-opus-4-5-20251101', apiKey: '' },
  enableMemory: true,
  enableScreenshots: true,
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function getSettings(): Promise<AgentSettings> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
  return (data[STORAGE_KEYS.SETTINGS] as StoredSettings)?.agentSettings ?? DEFAULT_SETTINGS
}

async function getStoredSettings(): Promise<StoredSettings> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
  console.log('🔍 Background: getStoredSettings - raw data from chrome.storage:', data)
  console.log('🔍 Background: STORAGE_KEYS.SETTINGS =', STORAGE_KEYS.SETTINGS)

  const stored = (data[STORAGE_KEYS.SETTINGS] as StoredSettings) ?? {
    agentSettings: DEFAULT_SETTINGS,
    theme: 'system',
  }

  console.log('📂 Background: getStoredSettings returning:', {
    provider: stored.agentSettings?.provider?.provider,
    apiKey: stored.agentSettings?.provider?.apiKey ? '***' : 'empty',
    hasIdentity: !!stored.identity,
    theme: stored.theme
  })
  console.log('📂 Background: FULL stored object:', stored)
  return stored
}

async function saveSettings(settings: AgentSettings, theme: string, identity?: any): Promise<void> {
  const stored: StoredSettings = {
    agentSettings: settings,
    theme: (theme as 'light' | 'dark' | 'system') || 'system',
    identity,
  }
  console.log('💾 SAVING - key:', STORAGE_KEYS.SETTINGS)
  console.log('💾 SAVING - provider:', settings.provider.provider)
  console.log('💾 SAVING - apiKey:', settings.provider.apiKey ? '***' : 'empty')
  console.log('💾 SAVING - full object:', stored)

  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: stored })
  console.log('⏳ Write command queued, waiting for verification...')

  // VERIFY the data was actually written
  const verification = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
  console.log('🔍 VERIFICATION - raw response:', verification)
  console.log('🔍 VERIFICATION - data[key]:', verification[STORAGE_KEYS.SETTINGS])

  const verified = verification[STORAGE_KEYS.SETTINGS]
  if (!verified) {
    throw new Error('CRITICAL: Data was not written to chrome.storage.local!')
  }

  console.log('✅ VERIFIED - Data persisted with:', {
    provider: verified.agentSettings?.provider?.provider,
    apiKey: verified.agentSettings?.provider?.apiKey ? '***' : 'empty',
    theme: verified.theme,
  })
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
  // Auto-save as last session for persistence
  await chrome.storage.local.set({ [STORAGE_KEYS.LAST_SESSION]: session.id })
}

async function deleteSession(sessionId: string): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS)
  const sessions = (data[STORAGE_KEYS.SESSIONS] ?? {}) as Record<string, StoredSession>
  delete sessions[sessionId]
  await chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions })
}

async function getAllSessions(): Promise<StoredSession[]> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS)
  const sessions = (data[STORAGE_KEYS.SESSIONS] ?? {}) as Record<string, StoredSession>
  return Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt)
}

// ─── Active Agents ────────────────────────────────────────────────────────────

const activeControllers = new Map<string, AbortController>()

// ─── Port Connection ──────────────────────────────────────────────────────────

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PORT_NAME) return

  port.onDisconnect.addListener(() => {
    for (const [id, ctrl] of activeControllers) {
      ctrl.abort()
      activeControllers.delete(id)
    }
  })

  port.onMessage.addListener(async (message: PortMessage) => {
    const send = (event: AgentEvent) => {
      try {
        if (event.type === 'error') {
          console.error('❌🔤 ERROR EVENT being sent to port:', (event as any).error)
        } else {
          console.log('🔤 Sending event back to port:', event.type)
        }
        port.postMessage(event)
      } catch (err) {
        console.error('❌ Failed to send event to port:', err)
      }
    }

    try {
      console.log('📨 Background received message:', message.type)
      switch (message.type) {
        case 'chat': {
          console.log('💬 Processing chat message')
          const { sessionId, message: userMessage, attachedTabId } = message
          console.log('📝 Chat details:', { sessionId, messageLength: userMessage.length, attachedTabId })

          console.log('🛑 Aborting previous controller if exists')
          activeControllers.get(sessionId)?.abort()
          const controller = new AbortController()
          activeControllers.set(sessionId, controller)
          console.log('✅ New controller created')

          console.log('⚙️  Getting settings')
          const settings = await getSettings()
          console.log('✅ Settings loaded:', { provider: settings.provider.provider })

          console.log('📂 Getting session')
          const session = await getSession(sessionId)
          console.log('✅ Session loaded:', { messageCount: session?.messages.length ?? 0 })

          // Show running indicator on the active tab
          let indicatorTabId: number | undefined
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
            indicatorTabId = activeTab?.id
            if (indicatorTabId !== undefined) {
              chrome.tabs.sendMessage(indicatorTabId, { type: 'harbor_agent_running' }).catch(() => {})
            }
          } catch { /* tab may not have content script */ }

          const userChatMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: [{ type: 'text', text: userMessage }],
            timestamp: Date.now(),
          }

          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: [],
            timestamp: Date.now(),
          }

          let assistantText = ''

          try {
            await runAgent({
              sessionId,
              message: userMessage,
              settings,
              history: session?.messages ?? [],
              attachedTabId,
              onEvent: (event) => {
                if (event.type === 'text_delta') assistantText += event.text
                send(event)
              },
              signal: controller.signal,
            })
          } catch (err) {
            send({ type: 'error', error: err instanceof Error ? err.message : String(err) })
          } finally {
            activeControllers.delete(sessionId)
            // Hide the tab indicator
            if (indicatorTabId !== undefined) {
              chrome.tabs.sendMessage(indicatorTabId, { type: 'harbor_agent_stopped' }).catch(() => {})
            }
          }

          if (assistantText) {
            assistantMsg.content = [{ type: 'text', text: assistantText }]
          }

          await saveSession({
            id: sessionId,
            messages: [...(session?.messages ?? []), userChatMsg, assistantMsg],
            createdAt: session?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
            title: session?.title ?? userMessage.slice(0, 60).trim(),
          })
          break
        }

        case 'stop': {
          activeControllers.get(message.sessionId)?.abort()
          activeControllers.delete(message.sessionId)
          break
        }

        case 'clear_session': {
          await deleteSession(message.sessionId)
          break
        }
      }
    } catch (err) {
      send({ type: 'error', error: err instanceof Error ? err.message : String(err) })
    }
  })
})

// ─── Message Handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  ;(async () => {
    try {
      switch (message.type) {
        case 'get_settings':
          sendResponse({ success: true, data: await getStoredSettings() })
          break

        case 'save_settings': {
          const { settings, theme, identity } = message as { settings: AgentSettings; theme: string; identity?: any }
          try {
            console.log('💾 Background: Received save_settings message', { provider: settings.provider.provider, apiKey: settings.provider.apiKey ? '***' : 'empty' })
            await saveSettings(settings, theme ?? 'system', identity)
            console.log('✅ Background: Settings saved to chrome.storage.local')
            sendResponse({ success: true })
          } catch (err) {
            console.error('❌ Background: Failed to save settings:', err)
            sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) })
          }
          break
        }

        case 'get_sessions':
          sendResponse({ success: true, data: await getAllSessions() })
          break

        case 'get_session':
          sendResponse({ success: true, data: await getSession(message.sessionId as string) })
          break

        case 'delete_session':
          await deleteSession(message.sessionId as string)
          sendResponse({ success: true })
          break

        case 'get_active_tab': {
          const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
          sendResponse({ success: true, data: tab })
          break
        }

        case 'harbor_get_palette_commands': {
          // Return list of available commands for the command palette overlay
          console.log('🎯 [BACKGROUND] harbor_get_palette_commands requested')
          const commands = [
            { id: 'new-chat', label: 'New conversation', description: 'Start a fresh chat' },
            { id: 'settings', label: 'Open Settings', description: 'Configure Harbor' },
            { id: 'history', label: 'View History', description: 'Browse past conversations' },
            { id: 'memory', label: 'View Memory', description: 'Manage learned information' },
            { id: 'skills', label: 'Browse Skills', description: 'Explore available tools' },
            { id: 'dashboard', label: 'Open Dashboard', description: 'View usage statistics' },
          ]
          console.log('✅ [BACKGROUND] Sending', commands.length, 'commands')
          sendResponse({ success: true, data: { commands } })
          break
        }

        case 'harbor_execute_palette_command': {
          const { commandId } = message
          console.log('🎯 [BACKGROUND] harbor_execute_palette_command:', commandId)
          // Send command to the active extension panel
          try {
            // Send message to sidepanel to execute the command
            console.log('🎯 [BACKGROUND] Sending command to sidepanel...')
            chrome.runtime.sendMessage({
              type: 'harbor_palette_command_execute',
              commandId,
            }).then(() => {
              console.log('✅ [BACKGROUND] Command sent to sidepanel')
            }).catch((err) => {
              console.warn('⚠️  [BACKGROUND] Sidepanel not responding:', err)
              // Sidepanel might not be open, that's ok
            })
            sendResponse({ success: true })
          } catch (err) {
            console.error('❌ [BACKGROUND] Error executing command:', err)
            sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) })
          }
          break
        }

        default:
          sendResponse({ success: false, error: `Unknown message: ${message.type}` })
      }
    } catch (err) {
      sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) })
    }
  })()
  return true
})

// ─── Side Panel ───────────────────────────────────────────────────────────────

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.windowId) chrome.sidePanel.open({ windowId: tabs[0].windowId })
    })
  }
  // Set up context menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'harbor-root',
      title: 'Harbor AI',
      contexts: ['all'],
    })
    chrome.contextMenus.create({
      id: 'harbor-ask-selection',
      parentId: 'harbor-root',
      title: 'Ask Harbor about "%s"',
      contexts: ['selection'],
    })
    chrome.contextMenus.create({
      id: 'harbor-summarize',
      parentId: 'harbor-root',
      title: 'Summarize this page',
      contexts: ['page', 'frame'],
    })
    chrome.contextMenus.create({
      id: 'harbor-extract',
      parentId: 'harbor-root',
      title: 'Extract data from this page',
      contexts: ['page', 'frame'],
    })
    chrome.contextMenus.create({
      id: 'harbor-save-link',
      parentId: 'harbor-root',
      title: 'Save this link for later',
      contexts: ['link'],
    })
    chrome.contextMenus.create({
      id: 'harbor-translate',
      parentId: 'harbor-root',
      title: 'Translate selection',
      contexts: ['selection'],
    })
    chrome.contextMenus.create({
      id: 'harbor-explain',
      parentId: 'harbor-root',
      title: 'Explain "%s"',
      contexts: ['selection'],
    })
  })
})

// ─── Context Menu Handler ─────────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.windowId) return

  // Open side panel first
  chrome.sidePanel.open({ windowId: tab.windowId })

  let message = ''
  switch (info.menuItemId) {
    case 'harbor-ask-selection':
      message = `Tell me about this: "${info.selectionText}"`
      break
    case 'harbor-summarize':
      message = 'Summarize this page for me'
      break
    case 'harbor-extract':
      message = 'Extract all the data from this page into a structured format'
      break
    case 'harbor-save-link':
      message = `Save this link for later reading: ${info.linkUrl}`
      break
    case 'harbor-translate':
      message = `Translate this to English: "${info.selectionText}"`
      break
    case 'harbor-explain':
      message = `Explain this in simple terms: "${info.selectionText}"`
      break
    default:
      return
  }

  // Store the pending context menu message — sidepanel will pick it up on load
  await chrome.storage.local.set({ harbor_context_message: message })
})
