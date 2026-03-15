import React, { useState } from 'react'
import { Settings as SettingsIcon, Plus, RotateCcw } from 'lucide-react'
import type { AgentSettings } from '../../shared/types'
import { useChat } from '../hooks/useChat'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import EmptyState from './EmptyState'

interface ChatProps {
  settings: AgentSettings
  onOpenSettings: () => void
}

export default function Chat({ settings, onOpenSettings }: ChatProps) {
  const { messages, isRunning, error, sendMessage, stopAgent, clearMessages } = useChat(settings)
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null)
  const [attachActiveTab, setAttachActiveTab] = useState(false)

  const hasApiKey = Boolean(settings.provider.apiKey) || settings.provider.provider === 'ollama'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--harbor-border))]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-harbor-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <span className="font-semibold text-[rgb(var(--harbor-text))]">Harbor</span>
          <span className="text-xs text-[rgb(var(--harbor-text-muted))] bg-[rgb(var(--harbor-surface))] px-1.5 py-0.5 rounded">
            {settings.provider.model.split('/').pop()?.split('-').slice(0, 2).join('-') ?? settings.provider.model}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 rounded-md hover:bg-[rgb(var(--harbor-surface))] text-[rgb(var(--harbor-text-muted))] hover:text-[rgb(var(--harbor-text))] transition-colors"
              title="New conversation"
            >
              <Plus size={16} />
            </button>
          )}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-[rgb(var(--harbor-surface))] text-[rgb(var(--harbor-text-muted))] hover:text-[rgb(var(--harbor-text))] transition-colors"
            title="Settings"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>

      {/* No API Key Warning */}
      {!hasApiKey && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            No API key configured.{' '}
            <button onClick={onOpenSettings} className="underline font-medium hover:no-underline">
              Open Settings
            </button>{' '}
            to get started.
          </p>
        </div>
      )}

      {/* Messages or Empty State */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState
            onSuggestionClick={(text) => {
              if (hasApiKey) sendMessage(text)
              else onOpenSettings()
            }}
          />
        ) : (
          <ChatMessages messages={messages} isRunning={isRunning} />
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopAgent}
        isRunning={isRunning}
        disabled={!hasApiKey}
        placeholder={hasApiKey ? 'Ask Harbor to do anything...' : 'Configure API key in settings first'}
      />
    </div>
  )
}
