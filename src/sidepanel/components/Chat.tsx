import React from 'react'
import { Settings as SettingsIcon, Clock } from 'lucide-react'
import type { AgentSettings } from '../../shared/types'
import { useChat } from '../hooks/useChat'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import EmptyState from './EmptyState'

interface Props {
  settings: AgentSettings
  currentSessionId?: string | null
  onOpenSettings: () => void
  onViewHistory: () => void
}

export default function Chat({ settings, currentSessionId, onOpenSettings, onViewHistory }: Props) {
  const { messages, isRunning, sendMessage, stopAgent, toggleThinkingBlock } =
    useChat(settings, currentSessionId)

  const hasApiKey =
    Boolean(settings.provider.apiKey) || settings.provider.provider === 'ollama'

  // Show just the short model name without version hash
  const modelLabel = (() => {
    const m = settings.provider.model
    const parts = m.split('/')
    const name = parts[parts.length - 1]
    return name.split('-').slice(0, 3).join('-')
  })()

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgb(var(--harbor-border))]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-harbor-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold">H</span>
          </div>
          <span className="font-semibold text-sm text-[rgb(var(--harbor-text))]">Harbor</span>
          <span className="text-[11px] text-[rgb(var(--harbor-text-faint))] border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface-2))] px-1.5 py-0.5 rounded-md font-mono truncate max-w-[130px]">
            {modelLabel}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={onViewHistory} className="icon-btn" title="History">
            <Clock size={15} />
          </button>
          <button onClick={onOpenSettings} className="icon-btn" title="Settings">
            <SettingsIcon size={15} />
          </button>
        </div>
      </div>

      {/* ── API key warning ─────────────────────────────────────────────────── */}
      {!hasApiKey && (
        <div className="mx-3 mt-2.5 px-3 py-2 rounded-lg text-xs border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
          No API key configured.{' '}
          <button onClick={onOpenSettings} className="font-semibold underline underline-offset-2 hover:no-underline">
            Open Settings
          </button>
        </div>
      )}

      {/* ── Messages / Empty state ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState
            onSuggestionClick={(text) => {
              if (hasApiKey) sendMessage(text)
              else onOpenSettings()
            }}
          />
        ) : (
          <ChatMessages
            messages={messages}
            isRunning={isRunning}
            onToggleThinking={toggleThinkingBlock}
          />
        )}
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopAgent}
        isRunning={isRunning}
        disabled={!hasApiKey}
        placeholder={hasApiKey ? 'Ask Harbor anything…' : 'Configure your API key first'}
      />
    </div>
  )
}
