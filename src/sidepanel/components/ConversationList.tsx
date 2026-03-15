import React, { useState, useEffect } from 'react'
import { Plus, Trash2, MessageSquare, Calendar } from 'lucide-react'
import type { StoredSession } from '../../shared/types'

interface ConversationListProps {
  sessions: StoredSession[]
  currentSessionId?: string
  onSelectSession: (sessionId: string) => void
  onNewConversation: () => void
  onDeleteSession: (sessionId: string) => void
}

export default function ConversationList({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewConversation,
  onDeleteSession,
}: ConversationListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--harbor-bg))]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[rgb(var(--harbor-border))]">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-harbor-600 hover:bg-harbor-700 text-white font-medium rounded-lg transition-all"
        >
          <Plus size={16} />
          New conversation
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto harbor-scrollbar">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <MessageSquare size={32} className="text-[rgb(var(--harbor-text-muted))] mb-3 opacity-50" />
            <p className="text-sm text-[rgb(var(--harbor-text-muted))]">No conversations yet</p>
            <p className="text-xs text-[rgb(var(--harbor-text-muted))] mt-1">Start a new conversation to get began</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onMouseEnter={() => setHoveredId(session.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  currentSessionId === session.id
                    ? 'bg-harbor-600/10 border border-harbor-500/30'
                    : 'hover:bg-[rgb(var(--harbor-surface))] border border-transparent'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                {/* Icon */}
                <MessageSquare
                  size={14}
                  className={`flex-shrink-0 mt-1 transition-colors ${
                    currentSessionId === session.id
                      ? 'text-harbor-600'
                      : 'text-[rgb(var(--harbor-text-muted))]'
                  }`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[rgb(var(--harbor-text))] truncate">
                    {session.title || 'Untitled conversation'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar size={11} className="text-[rgb(var(--harbor-text-muted))]" />
                    <p className="text-xs text-[rgb(var(--harbor-text-muted))]">
                      {new Date(session.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Delete Button */}
                {(hoveredId === session.id || currentSessionId === session.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Delete this conversation?')) {
                        onDeleteSession(session.id)
                      }
                    }}
                    className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
