import React, { useEffect, useRef } from 'react'
import {
  Settings as SettingsIcon, Clock, SquarePen, LayoutDashboard,
  Brain, Zap, Search,
} from 'lucide-react'
import type { AgentSettings, IdentitySettings } from '../../shared/types'
import { useChat } from '../hooks/useChat'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import EmptyState from './EmptyState'
import { NotificationBell, NotificationCenter } from './NotificationCenter'

interface Props {
  settings: AgentSettings
  identity?: IdentitySettings
  currentSessionId?: string | null
  pendingMessage?: string | null
  onPendingMessageSent?: () => void
  onOpenSettings: () => void
  onViewHistory: () => void
  onNewConversation: () => void
  onOpenMemory?: () => void
  onOpenSkills?: () => void
  onOpenDashboard?: () => void
  onOpenCommandPalette?: () => void
}

export default function Chat({
  settings,
  identity,
  currentSessionId,
  pendingMessage,
  onPendingMessageSent,
  onOpenSettings,
  onViewHistory,
  onNewConversation,
  onOpenMemory,
  onOpenSkills,
  onOpenDashboard,
  onOpenCommandPalette,
}: Props) {
  const { messages, isRunning, error, sendMessage, stopAgent, toggleThinkingBlock } =
    useChat(settings, currentSessionId)

  const [showNotifications, setShowNotifications] = React.useState(false)

  const hasApiKey =
    Boolean(settings.provider.apiKey) ||
    settings.provider.provider === 'ollama' ||
    settings.provider.provider === 'harbor-free'

  // Send pending message (from skills / dashboard quick actions)
  const pendingSent = useRef(false)
  useEffect(() => {
    if (pendingMessage && !pendingSent.current && hasApiKey) {
      pendingSent.current = true
      sendMessage(pendingMessage)
      onPendingMessageSent?.()
    }
  }, [pendingMessage, hasApiKey, sendMessage, onPendingMessageSent])

  return (
    <div className={`flex flex-col h-full relative ${isRunning ? 'agent-active-border' : ''}`}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        {/* Logo + name */}
        <button
          onClick={onOpenDashboard}
          className="flex items-center gap-2 min-w-0 group"
        >
          <img
            src="/icons/logo.png"
            alt="Harbor"
            className="w-6 h-6 rounded-lg flex-shrink-0"
          />
          <div className="flex items-center gap-1.5">
            <span
              className="harbor-serif text-base font-medium"
              style={{ color: 'rgb(var(--harbor-text))' }}
            >
              Harbor
            </span>
            {isRunning && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium animate-pulse"
                style={{
                  background: 'rgb(var(--harbor-accent-light))',
                  color: 'rgb(var(--harbor-accent))',
                  border: '1px solid rgb(var(--harbor-accent) / 0.3)',
                }}
              >
                running
              </span>
            )}
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          {onOpenCommandPalette && (
            <button onClick={onOpenCommandPalette} className="icon-btn" title="Command palette (Ctrl+Shift+K)">
              <Search size={14} />
            </button>
          )}
          <button onClick={onNewConversation} className="icon-btn" title="New conversation">
            <SquarePen size={14} />
          </button>
          <button onClick={onViewHistory} className="icon-btn" title="History">
            <Clock size={14} />
          </button>
          {onOpenMemory && (
            <button onClick={onOpenMemory} className="icon-btn" title="Memory">
              <Brain size={14} />
            </button>
          )}
          {onOpenSkills && (
            <button onClick={onOpenSkills} className="icon-btn" title="Skills">
              <Zap size={14} />
            </button>
          )}
          <div className="relative">
            <NotificationBell onClick={() => setShowNotifications((v) => !v)} />
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifications(false)}
                />
                <NotificationCenter onClose={() => setShowNotifications(false)} />
              </>
            )}
          </div>
          <button onClick={onOpenSettings} className="icon-btn" title="Settings">
            <SettingsIcon size={14} />
          </button>
        </div>
      </div>

      {/* ── API key warning ─────────────────────────────────────────────────── */}
      {!hasApiKey && (
        <div
          className="mx-3 mt-2.5 px-3 py-2 rounded-xl text-xs border"
          style={{
            borderColor: 'rgb(245 158 11 / 0.3)',
            background: 'rgb(245 158 11 / 0.08)',
            color: '#b45309',
          }}
        >
          No API key configured.{' '}
          <button onClick={onOpenSettings} className="font-semibold underline underline-offset-2 hover:no-underline">
            Open Settings
          </button>
        </div>
      )}

      {/* ── Runtime error banner ─────────────────────────────────────────────── */}
      {error && (
        <div
          className="mx-3 mt-2.5 px-3 py-2 rounded-xl text-xs border"
          style={{
            borderColor: 'rgb(239 68 68 / 0.3)',
            background: 'rgb(239 68 68 / 0.08)',
            color: '#b91c1c',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Messages / Empty state ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState
            userName={identity?.userName}
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

      {/* ── Agent running pill overlay ─────────────────────────────────────── */}
      {isRunning && (
        <div className="flex justify-center px-3 py-1.5">
          <div className="agent-pill flex items-center gap-2 px-3 py-1.5 rounded-full">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'rgb(var(--harbor-accent))' }}
            />
            <span className="text-[11px] font-medium" style={{ color: 'rgb(var(--harbor-accent))' }}>
              Harbor is working…
            </span>
          </div>
        </div>
      )}

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <ChatInput
        onSend={(text, attachments) => {
          let fullText = text
          if (attachments && attachments.length > 0) {
            const attText = attachments
              .map((a) => `\n\n[Attached file: ${a.name}]\n${a.dataUrl}`)
              .join('')
            fullText = text + attText
          }
          sendMessage(fullText)
        }}
        onStop={stopAgent}
        isRunning={isRunning}
        disabled={!hasApiKey}
        placeholder={hasApiKey ? 'Ask Harbor anything…' : 'Configure your API key first'}
      />
    </div>
  )
}
