import React, { useState, useEffect } from 'react'
import {
  MessageSquare, Clock, Brain, Zap, Settings, Plus,
  Globe, Search, ShoppingCart, Layers, TrendingUp, ArrowRight,
} from 'lucide-react'
import type { StoredSession, IdentitySettings } from '../../shared/types'
import { getGreeting } from '../../shared/greetings'

interface Props {
  identity?: IdentitySettings
  onNewChat: () => void
  onOpenHistory: () => void
  onOpenMemory: () => void
  onOpenSkills: () => void
  onOpenSettings: () => void
  onSendMessage: (text: string) => void
  onOpenChat: () => void
}

const QUICK_ACTIONS = [
  { icon: Globe,        label: 'Summarize page',  text: 'Summarize this page' },
  { icon: Search,       label: 'Research',         text: 'Research a topic for me' },
  { icon: ShoppingCart, label: 'Compare prices',   text: 'Compare prices for this product' },
  { icon: Layers,       label: 'Organize tabs',    text: 'Organize all my open tabs' },
]

export default function Dashboard({
  identity, onNewChat, onOpenHistory, onOpenMemory,
  onOpenSkills, onOpenSettings, onSendMessage, onOpenChat,
}: Props) {
  const [recentSessions, setRecentSessions] = useState<StoredSession[]>([])
  const [greeting] = useState(() => getGreeting(identity?.userName))

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'get_sessions' }, (res) => {
      if (res?.success && res.data) {
        setRecentSessions((res.data as StoredSession[]).slice(0, 3))
      }
    })
  }, [])

  const handleQuickAction = (text: string) => {
    onSendMessage(text)
    onOpenChat()
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto harbor-scroll">
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* Greeting */}
        <div>
          <h2
            className="harbor-serif text-2xl font-light leading-snug"
            style={{ color: 'rgb(var(--harbor-text))' }}
          >
            {greeting}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            What can Harbor help with today?
          </p>
        </div>

        {/* New chat CTA */}
        <button
          onClick={onNewChat}
          className="harbor-btn-primary w-full justify-start gap-3 py-3"
        >
          <Plus size={15} />
          <span className="text-sm">New conversation</span>
        </button>

        {/* Quick actions */}
        <div>
          <p className="harbor-section-label mb-2.5">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(({ icon: Icon, label, text }) => (
              <button
                key={label}
                onClick={() => handleQuickAction(text)}
                className="suggestion-chip flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
                style={{
                  background: 'rgb(var(--harbor-surface))',
                  borderColor: 'rgb(var(--harbor-border))',
                }}
              >
                <Icon size={13} style={{ color: 'rgb(var(--harbor-accent))', flexShrink: 0 }} />
                <span className="text-[11px] font-medium truncate" style={{ color: 'rgb(var(--harbor-text))' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Nav tiles */}
        <div>
          <p className="harbor-section-label mb-2.5">Harbor</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Brain,    label: 'Memory',   onClick: onOpenMemory },
              { icon: Zap,      label: 'Skills',   onClick: onOpenSkills },
              { icon: Clock,    label: 'History',  onClick: onOpenHistory },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="skill-card flex flex-col items-center gap-2 px-2 py-3 rounded-xl border focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
                style={{
                  background: 'rgb(var(--harbor-surface))',
                  borderColor: 'rgb(var(--harbor-border))',
                }}
              >
                <Icon size={18} style={{ color: 'rgb(var(--harbor-accent))' }} />
                <span className="text-[11px] font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent conversations */}
        {recentSessions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="harbor-section-label">Recent</p>
              <button
                onClick={onOpenHistory}
                className="text-[10px] flex items-center gap-0.5 focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))] rounded px-1 py-0.5"
                style={{ color: 'rgb(var(--harbor-accent))' }}
                title="View all conversations"
              >
                View all <ArrowRight size={10} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {recentSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    // Navigate to session - handled by parent
                    onOpenHistory()
                  }}
                  className="suggestion-chip flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
                  style={{
                    background: 'rgb(var(--harbor-surface))',
                    borderColor: 'rgb(var(--harbor-border))',
                  }}
                >
                  <MessageSquare size={13} style={{ color: 'rgb(var(--harbor-text-faint))', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>
                      {session.title ?? `Chat from ${new Date(session.createdAt).toLocaleDateString()}`}
                    </p>
                    <p className="text-[10px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                      {session.messages.length} messages · {formatRelativeTime(session.updatedAt)}
                    </p>
                  </div>
                  <ArrowRight size={11} style={{ color: 'rgb(var(--harbor-text-faint))', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings link */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-xs focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))] rounded px-1 py-0.5 hover:text-[rgb(var(--harbor-text-muted))] transition-colors"
          style={{ color: 'rgb(var(--harbor-text-faint))' }}
          title="Settings & configuration"
        >
          <Settings size={12} />
          Settings & configuration
        </button>
      </div>
    </div>
  )
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(ts).toLocaleDateString()
}
