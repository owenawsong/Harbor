import React, { useState, useEffect, useCallback } from 'react'
import Chat from './components/Chat'
import Settings from './components/Settings'
import ConversationList from './components/ConversationList'
import type { AgentSettings, StoredSession } from '../shared/types'

type View = 'chat' | 'settings' | 'history'

export default function App() {
  const [view, setView]                       = useState<View>('chat')
  const [settings, setSettings]               = useState<AgentSettings | null>(null)
  const [theme, setTheme]                     = useState<'light' | 'dark' | 'system'>('system')
  const [sessions, setSessions]               = useState<StoredSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // ── Load settings + theme on mount ─────────────────────────────────────────
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'get_settings' }, (res) => {
      setSettings(res?.success && res.data
        ? res.data
        : {
            provider: { provider: 'anthropic', model: 'claude-opus-4-5-20251101', apiKey: '' },
            maxTokens: 8192,
            enableMemory: false,
            enableScreenshots: true,
          })
    })

    chrome.storage.local.get('harbor_theme', (data) => {
      if (data.harbor_theme) setTheme(data.harbor_theme as 'light' | 'dark' | 'system')
    })
  }, [])

  // ── Apply theme ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? root.classList.add('dark')
        : root.classList.remove('dark')
    }
    chrome.storage.local.set({ harbor_theme: theme })
  }, [theme])

  // ── Sessions ────────────────────────────────────────────────────────────────
  const loadSessions = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'get_sessions' }, (res) => {
      setSessions(res?.success ? (res.data ?? []) : [])
    })
  }, [])

  const handleSaveSettings = async (
    newSettings: AgentSettings,
    newTheme: 'light' | 'dark' | 'system',
  ) => {
    setSettings(newSettings)
    setTheme(newTheme)
    setView('chat')
  }

  const handleViewHistory = () => {
    loadSessions()
    setView('history')
  }

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id)
    setView('chat')
  }

  const handleNewConversation = () => {
    setCurrentSessionId(null)
    setView('chat')
  }

  const handleDeleteSession = (id: string) => {
    chrome.runtime.sendMessage({ type: 'delete_session', sessionId: id }, () => {
      loadSessions()
      if (currentSessionId === id) setCurrentSessionId(null)
    })
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-harbor-500 typing-dot"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--harbor-bg))] text-[rgb(var(--harbor-text))]">
      {view === 'chat' && (
        <Chat
          settings={settings}
          currentSessionId={currentSessionId}
          onOpenSettings={() => setView('settings')}
          onViewHistory={handleViewHistory}
          onNewConversation={handleNewConversation}
        />
      )}
      {view === 'settings' && (
        <Settings
          settings={settings}
          theme={theme}
          onSave={handleSaveSettings}
          onBack={() => setView('chat')}
        />
      )}
      {view === 'history' && (
        <ConversationList
          sessions={sessions}
          currentSessionId={currentSessionId ?? undefined}
          onSelectSession={handleSelectSession}
          onNewConversation={handleNewConversation}
          onDeleteSession={handleDeleteSession}
          onBack={() => setView('chat')}
        />
      )}
    </div>
  )
}
