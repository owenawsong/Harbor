import React, { useState, useEffect } from 'react'
import Chat from './components/Chat'
import Settings from './components/Settings'
import ConversationList from './components/ConversationList'
import type { AgentSettings, StoredSession } from '../shared/types'

type View = 'chat' | 'settings' | 'history'

export default function App() {
  const [view, setView] = useState<View>('chat')
  const [settings, setSettings] = useState<AgentSettings | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  useEffect(() => {
    // Load settings from service worker
    chrome.runtime.sendMessage({ type: 'get_settings' }, (response) => {
      if (response?.success && response.data) {
        setSettings(response.data)
      } else {
        // Use defaults
        setSettings({
          provider: { provider: 'anthropic', model: 'claude-opus-4-5-20251101', apiKey: '' },
          maxTokens: 8192,
          enableMemory: false,
          enableScreenshots: true,
        })
      }
    })

    // Load theme preference
    chrome.storage.local.get('harbor_theme', (data) => {
      const savedTheme = data.harbor_theme as 'light' | 'dark' | 'system' | undefined
      if (savedTheme) setTheme(savedTheme)
    })

    // Load sessions
    loadSessions()
  }, [])

  const loadSessions = () => {
    chrome.runtime.sendMessage({ type: 'get_sessions' }, (response) => {
      if (response?.success && response.data) {
        setSessions(response.data)
        // Load current session from storage
        chrome.storage.local.get('harbor_current_session', (data) => {
          const saved = data.harbor_current_session as string | undefined
          if (saved) setCurrentSessionId(saved)
        })
      }
    })
  }

  useEffect(() => {
    // Apply theme
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark ? root.classList.add('dark') : root.classList.remove('dark')
    }
  }, [theme])

  const handleSaveSettings = async (newSettings: AgentSettings, newTheme: 'light' | 'dark' | 'system') => {
    setSettings(newSettings)
    setTheme(newTheme)
    chrome.storage.local.set({ harbor_theme: newTheme })
    await chrome.runtime.sendMessage({ type: 'save_settings', settings: newSettings, theme: newTheme })
    setView('chat')
  }

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    chrome.storage.local.set({ harbor_current_session: sessionId })
    setView('chat')
  }

  const handleNewConversation = () => {
    setCurrentSessionId(null)
    chrome.storage.local.remove('harbor_current_session')
    setView('chat')
  }

  const handleDeleteSession = (sessionId: string) => {
    chrome.runtime.sendMessage({ type: 'delete_session', sessionId }, () => {
      loadSessions()
      if (currentSessionId === sessionId) {
        handleNewConversation()
      }
    })
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-harbor-500 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-harbor-500 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-harbor-500 typing-dot" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[rgb(var(--harbor-bg))]">
      {view === 'chat' && (
        <Chat
          settings={settings}
          currentSessionId={currentSessionId}
          onOpenSettings={() => setView('settings')}
          onViewHistory={() => setView('history')}
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
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewConversation={handleNewConversation}
          onDeleteSession={handleDeleteSession}
        />
      )}
    </div>
  )
}
