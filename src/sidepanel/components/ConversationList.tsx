import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Trash2, MessageSquare, Search, Pin, PinOff, Download } from 'lucide-react'
import type { StoredSession } from '../../shared/types'
import ConfirmDialog from './ConfirmDialog'

interface Props {
  sessions: StoredSession[]
  currentSessionId?: string
  onSelectSession: (id: string) => void
  onNewConversation: () => void
  onDeleteSession: (id: string) => void
  onPinSession?: (id: string, pinned: boolean) => void
  onExport?: () => void
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

function exportSessionToMarkdown(session: StoredSession): void {
  const title = session.title || 'Untitled conversation'
  const date = new Date(session.createdAt).toLocaleString()
  const lines: string[] = [`# ${title}`, `*Exported from Harbor — ${date}*`, '']

  for (const msg of session.messages) {
    if (msg.role === 'user') {
      lines.push(`**You:** ${msg.content}`, '')
    } else if (msg.role === 'assistant') {
      const text = Array.isArray(msg.content)
        ? msg.content
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('\n')
        : String(msg.content)
      lines.push(`**Harbor:** ${text}`, '')
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// Skeleton row for loading state
function SkeletonConversationItem() {
  return (
    <div className="flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl animate-pulse">
      <div className="w-3 h-3 rounded-sm bg-[rgb(var(--harbor-border))] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="h-3 rounded-full bg-[rgb(var(--harbor-border))]" style={{ width: '75%' }} />
        <div className="h-2.5 rounded-full bg-[rgb(var(--harbor-border))]" style={{ width: '45%' }} />
      </div>
    </div>
  )
}

export default function ConversationList({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewConversation,
  onDeleteSession,
  onPinSession,
  onExport,
  onBack,
}: Props) {
  const { t } = useTranslation()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<StoredSession | null>(null)
  const [isLoading] = useState(false)

  // Sort: pinned first, then by updatedAt descending
  const sorted = [...sessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return b.updatedAt - a.updatedAt
  })

  const filtered = sorted.filter((s) =>
    !searchQuery || (s.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const pinnedCount = sessions.filter((s) => s.isPinned).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-3 border-b"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        <button onClick={onBack} className="icon-btn" title={t('common.close')}>
          <ArrowLeft size={15} />
        </button>
        <span
          className="font-semibold text-sm flex-1"
          style={{ color: 'rgb(var(--harbor-text))' }}
        >
          {t('conversations.header')}
        </span>
        {sessions.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{
            color: 'rgb(var(--harbor-text-faint))',
            background: 'rgb(var(--harbor-surface-2))',
          }}>
            {sessions.length}
          </span>
        )}
        <button
          onClick={onNewConversation}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ background: 'rgb(var(--harbor-accent))' }}
        >
          <Plus size={12} />
          {t('conversations.new')}
        </button>
      </div>

      {/* Search */}
      {sessions.length > 4 && (
        <div className="px-3 py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
          <div
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors focus-within:border-[rgb(var(--harbor-accent))] focus-within:shadow-[0_0_0_3px_rgb(var(--harbor-accent)_/_0.12)]"
            style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}
          >
            <Search size={12} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('conversations.search_placeholder')}
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: 'rgb(var(--harbor-text))' }}
            />
          </div>
        </div>
      )}

      {/* Pinned section label */}
      {!searchQuery && pinnedCount > 0 && (
        <div className="px-3 pt-2 pb-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide flex items-center gap-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            <Pin size={9} /> {t('conversations.pinned')}
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto harbor-scroll py-1.5">
        {isLoading ? (
          <div className="flex flex-col gap-0.5 px-1.5">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonConversationItem key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3 py-12">
            <MessageSquare size={28} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                {searchQuery ? t('conversations.no_results') : t('conversations.empty_state')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                {searchQuery ? t('conversations.try_search') : t('conversations.empty_help')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-1.5">
            {/* Separator between pinned and unpinned */}
            {filtered.map((session, idx) => {
              const isActive = session.id === currentSessionId
              const isPinned = session.isPinned ?? false
              const prevPinned = idx > 0 ? (filtered[idx - 1].isPinned ?? false) : null
              const showSeparator = !searchQuery && idx > 0 && prevPinned && !isPinned

              return (
                <React.Fragment key={session.id}>
                  {showSeparator && (
                    <div className="px-2 py-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide flex items-center gap-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                        {t('conversations.recent')}
                      </span>
                    </div>
                  )}
                  <div
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
                        {session.title || t('conversations.untitled')}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                        {session.messages.length} {t('conversations.msg_count')} · {formatDate(session.updatedAt)}
                      </p>
                    </div>

                    {/* Action buttons — shown on hover or active */}
                    {(hoveredId === session.id || isActive) && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {/* Pin button */}
                        {onPinSession && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onPinSession(session.id, !isPinned)
                            }}
                            className="p-1 rounded-lg transition-colors focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
                            title={isPinned ? t('conversations.unpin') : t('conversations.pin')}
                            style={{ color: isPinned ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-faint))' }}
                          >
                            {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                          </button>
                        )}

                        {/* Export button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            exportSessionToMarkdown(session)
                            onExport?.()
                          }}
                          className="p-1 rounded-lg transition-colors focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
                          title={t('conversations.export')}
                          style={{ color: 'rgb(var(--harbor-text-faint))' }}
                        >
                          <Download size={11} />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(session)
                          }}
                          className="p-1 rounded-lg transition-colors focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-red-500"
                          title={t('common.delete')}
                          style={{ color: 'rgb(var(--harbor-text-faint))' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>

      {/* Styled delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title={t('conversations.delete_confirm')}
          description={`"${deleteTarget.title || t('conversations.untitled')}" ${t('conversations.delete_message')}`}
          confirmText={t('common.delete')}
          isDangerous
          onConfirm={() => {
            onDeleteSession(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
