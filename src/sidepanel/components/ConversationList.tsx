import React, { useState } from 'react'
import { ArrowLeft, Plus, Trash2, MessageSquare } from 'lucide-react'
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[rgb(var(--harbor-border))]">
        <button onClick={onBack} className="icon-btn" title="Back">
          <ArrowLeft size={15} />
        </button>
        <span className="font-semibold text-sm text-[rgb(var(--harbor-text))] flex-1">Conversations</span>
        <button
          onClick={onNewConversation}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-harbor-600 hover:bg-harbor-700 text-white"
        >
          <Plus size={13} />
          New
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto harbor-scroll py-1.5">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
            <MessageSquare size={28} className="text-[rgb(var(--harbor-text-faint))]" />
            <div>
              <p className="text-sm font-medium text-[rgb(var(--harbor-text-muted))]">No conversations yet</p>
              <p className="text-xs text-[rgb(var(--harbor-text-faint))] mt-0.5">Start a new one above</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-1.5">
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId
              return (
                <div
                  key={session.id}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectSession(session.id)}
                  className={`group flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg cursor-pointer border ${
                    isActive
                      ? 'border-harbor-400/40 bg-harbor-50 dark:bg-harbor-900/20'
                      : 'border-transparent hover:bg-[rgb(var(--harbor-surface-2))]'
                  }`}
                >
                  <MessageSquare
                    size={14}
                    className={`flex-shrink-0 mt-0.5 ${isActive ? 'text-harbor-600 dark:text-harbor-400' : 'text-[rgb(var(--harbor-text-faint))]'}`}
                  />

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate font-medium ${isActive ? 'text-harbor-700 dark:text-harbor-300' : 'text-[rgb(var(--harbor-text))]'}`}>
                      {session.title || 'Untitled conversation'}
                    </p>
                    <p className="text-xs text-[rgb(var(--harbor-text-faint))] mt-0.5">
                      {formatDate(session.updatedAt)}
                    </p>
                  </div>

                  {(hoveredId === session.id || isActive) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this conversation?')) onDeleteSession(session.id)
                      }}
                      className="flex-shrink-0 p-1 rounded text-[rgb(var(--harbor-text-faint))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={13} />
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
