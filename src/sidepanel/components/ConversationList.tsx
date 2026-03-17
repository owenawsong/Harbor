import React, { useState } from 'react'
import { ArrowLeft, Plus, Trash2, MessageSquare, Search } from 'lucide-react'
import type { StoredSession } from '../../shared/types'

interface Props {
  sessions: StoredSession[]
  currentSessionId?: string
  onSelectSession: (id: string) => void
  onNewConversation: () => void
  onDeleteSession: (id: string) => void
  onBack: () => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ConversationList({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewConversation,
  onDeleteSession,
  onBack,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = sessions.filter((s) =>
    !searchQuery || (s.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-3 border-b"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        <button onClick={onBack} className="icon-btn" title="Back">
          <ArrowLeft size={15} />
        </button>
        <span
          className="font-semibold text-sm flex-1"
          style={{ color: 'rgb(var(--harbor-text))' }}
        >
          Conversations
        </span>
        <button
          onClick={onNewConversation}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ background: 'rgb(var(--harbor-accent))' }}
        >
          <Plus size={12} />
          New
        </button>
      </div>

      {/* Search */}
      {sessions.length > 4 && (
        <div className="px-3 py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
          <div
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg border"
            style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}
          >
            <Search size={12} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: 'rgb(var(--harbor-text))' }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto harbor-scroll py-1.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3 py-12">
            <MessageSquare size={28} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                {searchQuery ? 'No results found' : 'No conversations yet'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                {searchQuery ? 'Try a different search' : 'Start a new conversation above'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-1.5">
            {filtered.map((session) => {
              const isActive = session.id === currentSessionId
              return (
                <div
                  key={session.id}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectSession(session.id)}
                  className="group flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl cursor-pointer border transition-all duration-150"
                  style={{
                    borderColor: isActive ? 'rgb(var(--harbor-accent) / 0.35)' : 'transparent',
                    background: isActive
                      ? 'rgb(var(--harbor-accent-light))'
                      : hoveredId === session.id
                        ? 'rgb(var(--harbor-surface-2))'
                        : 'transparent',
                  }}
                >
                  <MessageSquare
                    size={13}
                    className="flex-shrink-0 mt-0.5"
                    style={{
                      color: isActive
                        ? 'rgb(var(--harbor-accent))'
                        : 'rgb(var(--harbor-text-faint))',
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs truncate font-medium"
                      style={{
                        color: isActive
                          ? 'rgb(var(--harbor-accent))'
                          : 'rgb(var(--harbor-text))',
                      }}
                    >
                      {session.title || 'Untitled conversation'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                      {session.messages.length} msg · {formatDate(session.updatedAt)}
                    </p>
                  </div>

                  {(hoveredId === session.id || isActive) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this conversation?')) onDeleteSession(session.id)
                      }}
                      className="flex-shrink-0 p-1 rounded-lg"
                      style={{ color: 'rgb(var(--harbor-text-faint))' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(var(--harbor-text-faint))' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
