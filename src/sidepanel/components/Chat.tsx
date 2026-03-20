import React, { useEffect, useRef, useState } from 'react'
import {
  Settings as SettingsIcon, Clock, SquarePen,
  Brain, Zap, Search, MoreVertical,
} from 'lucide-react'
import type { AgentSettings, IdentitySettings } from '../../shared/types'
import { useChat } from '../hooks/useChat'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import EmptyState from './EmptyState'


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
  agentMode?: boolean
  onToggleAgentMode?: () => void
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
  agentMode = true,
  onToggleAgentMode,
}: Props) {
  const { messages, isRunning, error, sendMessage, stopAgent, toggleThinkingBlock } =
    useChat(settings, currentSessionId)

  const [showNotifications, setShowNotifications] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

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
          <span
            className="harbor-serif text-base font-medium header-logo-text"
            style={{ color: 'rgb(var(--harbor-text))' }}
          >
            Harbor
          </span>
        </button>

        {/* Actions: New, History, Settings + overflow menu */}
        <div className="flex items-center gap-0.5">
          <button onClick={onNewConversation} className="icon-btn" title="New conversation">
            <SquarePen size={14} />
          </button>
          <button onClick={onViewHistory} className="icon-btn" title="History">
            <Clock size={14} />
          </button>
          <button onClick={onOpenSettings} className="icon-btn" title="Settings">
            <SettingsIcon size={14} />
          </button>

          {/* Overflow menu: Memory, Skills, Search */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="icon-btn"
              title="More"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className="absolute right-0 mt-1 w-36 rounded-lg border shadow-lg z-40 overflow-hidden animate-scale-in"
                  style={{
                    background: 'rgb(var(--harbor-surface))',
                    borderColor: 'rgb(var(--harbor-border))',
                    transformOrigin: 'top right',
                    boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
                  }}
                >
                  <button
                    onClick={() => { onOpenCommandPalette?.(); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[rgb(var(--harbor-surface-2))] transition-colors flex items-center gap-2"
                    style={{ color: 'rgb(var(--harbor-text))' }}
                  >
                    <Search size={12} />
                    Search
                  </button>
                  <div className="h-px" style={{ background: 'rgb(var(--harbor-border))' }} />
                  <button
                    onClick={() => { onOpenMemory?.(); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[rgb(var(--harbor-surface-2))] transition-colors flex items-center gap-2"
                    style={{ color: 'rgb(var(--harbor-text))' }}
                  >
                    <Brain size={12} />
                    Memory
                  </button>
                  <button
                    onClick={() => { onOpenSkills?.(); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[rgb(var(--harbor-surface-2))] transition-colors flex items-center gap-2"
                    style={{ color: 'rgb(var(--harbor-text))' }}
                  >
                    <Zap size={12} />
                    Skills
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── API key warning with Harbor Free suggestion ─────────────────────── */}
      {!hasApiKey && (
        <div
          className="mx-3 mt-2.5 px-3 py-2.5 rounded-xl text-xs border flex flex-col gap-2"
          style={{
            borderColor: 'rgb(245 158 11 / 0.3)',
            background: 'rgb(245 158 11 / 0.08)',
            color: '#b45309',
          }}
        >
          <div>
            No API key configured. Add one in{' '}
            <button onClick={onOpenSettings} className="font-semibold underline underline-offset-2 hover:no-underline">
              Settings
            </button>
            , or use{' '}
            <span className="font-semibold">Harbor Free ✦</span>
            {' '}for free access.
          </div>
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

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <ChatInput
        onSend={(text, attachments, options) => {
          let fullText = text
          if (attachments && attachments.length > 0) {
            const attText = attachments
              .map((a) => `\n\n[Attached file: ${a.name}]\n${a.dataUrl}`)
              .join('')
            fullText = text + attText
          }
          sendMessage(fullText, undefined, options)
        }}
        onStop={stopAgent}
        isRunning={isRunning}
        disabled={!hasApiKey}
        placeholder={hasApiKey ? (agentMode ? 'Ask Harbor anything…' : 'Chat with Harbor…') : 'Configure your API key first'}
        agentMode={agentMode}
        onToggleAgentMode={onToggleAgentMode}
        settings={settings}
      />
    </div>
  )
}
