import React, { useState, useEffect, useCallback } from 'react'
import Chat from './components/Chat'
import Settings from './components/Settings'
import ConversationList from './components/ConversationList'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import MemoryPanel from './components/MemoryPanel'
import SkillsGallery from './components/SkillsGallery'
import CommandPalette from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import DataManager from './components/DataManager'
import type {
  AgentSettings, StoredSession, OnboardingData, IdentitySettings,
} from '../shared/types'

type View = 'loading' | 'onboarding' | 'chat' | 'settings' | 'history' | 'dashboard' | 'memory' | 'skills' | 'data-manager'

const ONBOARDING_KEY  = 'harbor_onboarding'
const IDENTITY_KEY    = 'harbor_identity'

export default function App() {
  const [view, setView]                         = useState<View>('loading')
  const [settings, setSettings]                 = useState<AgentSettings | null>(null)
  const [theme, setTheme]                       = useState<'light' | 'dark' | 'system'>('system')
  const [identity, setIdentity]                 = useState<IdentitySettings | undefined>(undefined)
  const [sessions, setSessions]                 = useState<StoredSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [chatKey, setChatKey]                   = useState(0)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [cmdShortcut, setCmdShortcut] = useState('Ctrl+Alt+H')
  const [agentMode, setAgentMode]               = useState(true) // true = Agent mode, false = Chat mode
  // Pending message to send when switching to chat
  const [pendingMessage, setPendingMessage]     = useState<string | null>(null)

  // ── Load on mount ─────────────────────────────────────────────────────────

  useEffect(() => {
    // Load settings, theme, and identity from background service
    console.log('📞 App: Requesting get_settings from background...')
    chrome.runtime.sendMessage({ type: 'get_settings' }, (res) => {
      console.log('📥 App: Raw response from background:', res)
      console.log('📥 App: res.success?', res?.success)
      console.log('📥 App: res.data?', res?.data)

      if (res?.success && res.data) {
        const stored = res.data
        console.log('📥 App: Received agentSettings:', stored.agentSettings)

        const settingsToUse = stored.agentSettings || {
          provider: { provider: 'harbor-free', model: 'minimax/minimax-m2.5', apiKey: '' },
          enableMemory: true,
          enableScreenshots: true,
        }
        console.log('📥 App: Setting agentSettings state to:', settingsToUse)
        setSettings(settingsToUse)

        if (stored.theme) {
          console.log('🎨 App: Setting theme to', stored.theme)
          setTheme(stored.theme as 'light' | 'dark' | 'system')
        }
        if (stored.identity) {
          console.log('👤 App: Setting identity to', stored.identity)
          setIdentity(stored.identity as IdentitySettings)
        }
      } else {
        console.warn('⚠️ App: No settings response or error:', res)
      }
    })

    // Load keybindings
    chrome.storage.local.get('harbor_keybindings', (data) => {
      if (data.harbor_keybindings?.commandPalette) {
        setCmdShortcut(data.harbor_keybindings.commandPalette as string)
      }
    })

    // Check onboarding status
    chrome.storage.local.get(ONBOARDING_KEY, (data) => {
      const onboarding = data[ONBOARDING_KEY] as OnboardingData | undefined
      if (!onboarding?.completed) {
        setView('onboarding')
      } else {
        // Load last session for persistence
        chrome.storage.local.get('harbor_last_session', (sessionData) => {
          const lastSessionId = sessionData.harbor_last_session as string | undefined
          if (lastSessionId) {
            console.log('📚 App: Restoring last session:', lastSessionId)
            setCurrentSessionId(lastSessionId)
          }
        })
        setView('chat')
      }
    })
  }, [])

  // ── Apply theme ───────────────────────────────────────────────────────────

  useEffect(() => {
    const root = document.documentElement
    const apply = (t: 'light' | 'dark' | 'system') => {
      if (t === 'dark') {
        root.classList.add('dark')
      } else if (t === 'light') {
        root.classList.remove('dark')
      } else {
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? root.classList.add('dark')
          : root.classList.remove('dark')
      }
    }
    apply(theme)
    chrome.storage.local.set({ harbor_theme: theme })
  }, [theme])

  // ── Command palette keyboard shortcut ─────────────────────────────────────

  useEffect(() => {
    // Keep shortcut in sync when changed from Settings while panel is open
    const storageListener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.harbor_keybindings?.newValue?.commandPalette) {
        setCmdShortcut(changes.harbor_keybindings.newValue.commandPalette as string)
      }
    }
    chrome.storage.onChanged.addListener(storageListener)
    return () => chrome.storage.onChanged.removeListener(storageListener)
  }, [])

  // ── Command Palette Hotkey Listener DISABLED ──────────────────────────
  // The command palette hotkey is now handled ONLY by the content script
  // This allows the overlay to work when the sidebar is closed and appear on the webpage
  // Previously, the sidebar listener would interfere by consuming the keypress event
  // and opening the palette IN the sidebar instead of on the webpage
  useEffect(() => {
    // Content script handles: Ctrl+Alt+H hotkey -> shows overlay on webpage
    console.log('🎯 CommandPalette: Hotkey handling delegated to content script')
  }, [])

  // ── Context menu message pickup ────────────────────────────────────────────

  useEffect(() => {
    const checkContextMessage = () => {
      chrome.storage.local.get('harbor_context_message', (data) => {
        if (data.harbor_context_message) {
          setPendingMessage(data.harbor_context_message as string)
          chrome.storage.local.remove('harbor_context_message')
          if (view !== 'loading' && view !== 'onboarding') setView('chat')
        }
      })
    }
    checkContextMessage()
    // Also listen for storage changes (in case panel was already open)
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.harbor_context_message?.newValue) {
        setPendingMessage(changes.harbor_context_message.newValue as string)
        chrome.storage.local.remove('harbor_context_message')
        setView('chat')
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [view])

  // ── Command Palette Overlay (Ctrl+Shift+K from webpage) ────────────────────

  useEffect(() => {
    const handlePaletteCommand = (message: any, _sender: any, sendResponse: any) => {
      if (message.type !== 'harbor_palette_command_execute') return

      const commandId = message.commandId as string
      console.log('🎨 App: Executing palette command:', commandId)

      // Execute the command based on ID
      switch (commandId) {
        case 'new-chat':
          setCurrentSessionId(null)
          setChatKey((k) => k + 1)
          setView('chat')
          sendResponse({ success: true })
          break
        case 'settings':
          setView('settings')
          sendResponse({ success: true })
          break
        case 'history':
          // Load sessions and switch to history view
          chrome.runtime.sendMessage({ type: 'get_sessions' }, (res) => {
            setSessions(res?.success ? (res.data ?? []) : [])
          })
          setView('history')
          sendResponse({ success: true })
          break
        case 'memory':
          setView('memory')
          sendResponse({ success: true })
          break
        case 'skills':
          setView('skills')
          sendResponse({ success: true })
          break
        case 'dashboard':
          setView('dashboard')
          sendResponse({ success: true })
          break
        default:
          sendResponse({ success: false, error: `Unknown command: ${commandId}` })
      }
    }

    chrome.runtime.onMessage.addListener(handlePaletteCommand)
    return () => chrome.runtime.onMessage.removeListener(handlePaletteCommand)
  }, [setSessions])

  // ── Sessions ──────────────────────────────────────────────────────────────

  const loadSessions = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'get_sessions' }, (res) => {
      setSessions(res?.success ? (res.data ?? []) : [])
    })
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCompleteOnboarding = (data: OnboardingData) => {
    chrome.storage.local.set({ [ONBOARDING_KEY]: data })

    // Save identity from onboarding
    const newIdentity: IdentitySettings = {
      userName: data.userName,
      useCases: data.useCases,
      tone: data.tone,
      verbosity: 'balanced',
      useEmoji: false,
      language: data.language,
    }
    setIdentity(newIdentity)
    chrome.storage.local.set({ [IDENTITY_KEY]: newIdentity })

    // Apply theme
    setTheme(data.theme)

    setView('chat')
  }

  const handleSaveSettings = useCallback(
    (
      newSettings: AgentSettings,
      newTheme: 'light' | 'dark' | 'system',
      newIdentity?: IdentitySettings,
    ) => {
      console.log('💾 App: Received save from Settings, updating state')
      setSettings(newSettings)
      setTheme(newTheme)
      if (newIdentity) {
        setIdentity(newIdentity)
      }
      // Do NOT call setView('chat') - let user stay in Settings
    },
    [],
  )

  const handleViewHistory = () => {
    loadSessions()
    setView('history')
  }

  const handleNewConversation = () => {
    setCurrentSessionId(null)
    setChatKey((k) => k + 1)
    setView('chat')
  }

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id)
    setChatKey((k) => k + 1)
    setView('chat')
  }

  const handleDeleteSession = (id: string) => {
    chrome.runtime.sendMessage({ type: 'delete_session', sessionId: id }, () => {
      loadSessions()
      if (currentSessionId === id) setCurrentSessionId(null)
    })
  }

  const handlePinSession = (id: string, pinned: boolean) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: pinned } : s)),
    )
    // Persist pinned state to storage
    chrome.storage.local.get('harbor_sessions', (data) => {
      const stored: StoredSession[] = data.harbor_sessions ?? []
      const updated = stored.map((s) => (s.id === id ? { ...s, isPinned: pinned } : s))
      chrome.storage.local.set({ harbor_sessions: updated })
    })
  }

  const handleSendMessage = (text: string) => {
    setPendingMessage(text)
    setView('chat')
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (view === 'loading' || !settings) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ background: 'rgb(var(--harbor-bg))' }}
      >
        <div className="flex flex-col items-center gap-4">
          <img
            src="/icons/logo.png"
            alt="Harbor"
            className="w-12 h-12 rounded-xl logo-glow"
          />
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full typing-dot"
                style={{ background: 'rgb(var(--harbor-accent))', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div
        className="flex flex-col h-full"
        style={{ background: 'rgb(var(--harbor-bg))', color: 'rgb(var(--harbor-text))' }}
      >
      {/* Onboarding */}
      {view === 'onboarding' && (
        <Onboarding onComplete={handleCompleteOnboarding} />
      )}

      {/* Main Chat */}
      {view === 'chat' && (
        <Chat
          key={chatKey}
          settings={settings}
          identity={identity}
          currentSessionId={currentSessionId}
          pendingMessage={pendingMessage}
          onPendingMessageSent={() => setPendingMessage(null)}
          onOpenSettings={() => setView('settings')}
          onViewHistory={handleViewHistory}
          onNewConversation={handleNewConversation}
          onOpenMemory={() => setView('memory')}
          onOpenSkills={() => setView('skills')}
          onOpenDashboard={() => setView('dashboard')}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          agentMode={agentMode}
          onToggleAgentMode={() => setAgentMode(!agentMode)}
        />
      )}

      {/* Settings */}
      {view === 'settings' && (
        <>
          {console.log('📤 App: Rendering Settings with:', { provider: settings?.provider?.provider, apiKey: settings?.provider?.apiKey ? '***' : 'none', theme, identity })}
          <Settings
            settings={settings}
            theme={theme}
            identity={identity}
            onSave={handleSaveSettings}
            onBack={() => setView('chat')}
          />
        </>
      )}

      {/* History */}
      {view === 'history' && (
        <ConversationList
          sessions={sessions}
          currentSessionId={currentSessionId ?? undefined}
          onSelectSession={handleSelectSession}
          onNewConversation={handleNewConversation}
          onDeleteSession={handleDeleteSession}
          onPinSession={handlePinSession}
          onBack={() => setView('chat')}
        />
      )}

      {/* Dashboard */}
      {view === 'dashboard' && (
        <Dashboard
          identity={identity}
          onNewChat={handleNewConversation}
          onOpenHistory={handleViewHistory}
          onOpenMemory={() => setView('memory')}
          onOpenSkills={() => setView('skills')}
          onOpenSettings={() => setView('settings')}
          onSendMessage={handleSendMessage}
          onOpenChat={() => setView('chat')}
        />
      )}

      {/* Memory */}
      {view === 'memory' && (
        <MemoryPanel onBack={() => setView('chat')} />
      )}

      {/* Skills */}
      {view === 'skills' && (
        <SkillsGallery
          onBack={() => setView('chat')}
          onRunSkill={(skill) => {
            handleSendMessage(skill.instructions)
          }}
        />
      )}

      {/* Data Manager */}
      {view === 'data-manager' && (
        <DataManager onBack={() => setView('settings')} />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNewChat={handleNewConversation}
        onOpenSettings={() => setView('settings')}
        onOpenHistory={handleViewHistory}
        onOpenMemory={() => setView('memory')}
        onOpenSkills={() => setView('skills')}
        onOpenDashboard={() => setView('dashboard')}
        onSetTheme={setTheme}
        onSendMessage={handleSendMessage}
      />
      </div>
    </ErrorBoundary>
  )
}
