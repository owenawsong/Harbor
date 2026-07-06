import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Search, Pin, Trash2, Brain,
  User, FolderOpen, Wrench, Heart, Users, MessageSquare,
  FileText, Save,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MemoryEntry, MemoryCategory } from '../../shared/types'
import {
  CORE_MEMORY_DOC_IDS,
  MEMORY_DOCS_STORAGE_KEY,
  getTodayDailyDocId,
  normalizeMemoryDocs,
  type MemoryDoc,
  type MemoryDocMap,
} from '../../shared/memoryDocs'

interface Props {
  onBack: () => void
}

// CATEGORY_META will have labels injected via t() in the component where it's used
const CATEGORY_META: Record<MemoryCategory, { icon: LucideIcon; color: string }> = {
  identity:    { icon: User,          color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
  preferences: { icon: Heart,         color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
  projects:    { icon: FolderOpen,    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  tools:       { icon: Wrench,        color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  habits:      { icon: Brain,         color: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
  people:      { icon: Users,         color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30' },
  general:     { icon: MessageSquare, color: 'text-gray-500 bg-gray-50 dark:bg-gray-950/30' },
}

const ALL_CATEGORIES: MemoryCategory[] = ['identity', 'preferences', 'projects', 'tools', 'habits', 'people', 'general']

const STORAGE_KEY = 'harbor_memory_entries'

export default function MemoryPanel({ onBack }: Props) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [docs, setDocs] = useState<MemoryDocMap>(() => normalizeMemoryDocs(undefined))
  const [selectedDocId, setSelectedDocId] = useState<string>('MEMORY.md')
  const [docDraft, setDocDraft] = useState('')
  const [docSavedAt, setDocSavedAt] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const selectedDoc = docs[selectedDocId] ?? docs['MEMORY.md']
  const isDocDirty = Boolean(selectedDoc && docDraft !== selectedDoc.content)

  // Category labels with translations
  const getCategoryLabel = (cat: MemoryCategory): string => {
    const labels: Record<MemoryCategory, string> = {
      identity: t('memory.identity'),
      preferences: t('memory.preferences'),
      projects: t('memory.projects'),
      tools: t('memory.tools'),
      habits: t('memory.habits'),
      people: t('memory.people'),
      general: t('memory.general'),
    }
    return labels[cat]
  }

  // Load from storage
  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY, MEMORY_DOCS_STORAGE_KEY], (data) => {
      if (data[STORAGE_KEY]) setEntries(data[STORAGE_KEY])
      const nextDocs = normalizeMemoryDocs(data[MEMORY_DOCS_STORAGE_KEY])
      setDocs(nextDocs)
      setSelectedDocId((current) => nextDocs[current] ? current : 'MEMORY.md')
      setDocDraft(nextDocs['MEMORY.md']?.content ?? '')
    })
  }, [])

  useEffect(() => {
    const nextDoc = docs[selectedDocId]
    if (nextDoc) setDocDraft(nextDoc.content)
  }, [docs, selectedDocId])

  const save = useCallback((newEntries: MemoryEntry[]) => {
    setEntries(newEntries)
    chrome.storage.local.set({ [STORAGE_KEY]: newEntries })
  }, [])

  const saveDoc = useCallback(() => {
    if (!selectedDoc) return
    const nextDocs = {
      ...docs,
      [selectedDoc.id]: {
        ...selectedDoc,
        content: docDraft,
        updatedAt: Date.now(),
      },
    }
    setDocs(nextDocs)
    setDocSavedAt(Date.now())
    chrome.storage.local.set({ [MEMORY_DOCS_STORAGE_KEY]: nextDocs })
  }, [docDraft, docs, selectedDoc])

  const deleteEntry = (id: string) => {
    save(entries.filter((e) => e.id !== id))
  }

  const togglePin = (id: string) => {
    save(entries.map((e) => e.id === id ? { ...e, isPinned: !e.isPinned } : e))
  }

  const updateEntry = (id: string, content: string) => {
    save(entries.map((e) => e.id === id ? { ...e, content, updatedAt: Date.now() } : e))
    setEditingId(null)
  }

  // Filter
  const filtered = entries
    .filter((e) => activeCategory === 'all' || e.category === activeCategory)
    .filter((e) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        e.content.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b.updatedAt - a.updatedAt
    })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-3 py-3 border-b"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        <button onClick={onBack} className="icon-btn">
          <ArrowLeft size={15} />
        </button>
        <Brain size={15} style={{ color: 'rgb(var(--harbor-accent))' }} />
        <h2
          className="font-semibold text-sm flex-1"
          style={{ color: 'rgb(var(--harbor-text))' }}
        >
          {t('memory.header')}
        </h2>
      </div>

      <MemoryDocsEditor
        docs={docs}
        selectedDocId={selectedDocId}
        selectedDoc={selectedDoc}
        draft={docDraft}
        isDirty={isDocDirty}
        savedAt={docSavedAt}
        onSelect={(id) => setSelectedDocId(id)}
        onChange={setDocDraft}
        onSave={saveDoc}
      />

      {/* Search */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
        <div
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors focus-within:border-[rgb(var(--harbor-accent))] focus-within:shadow-[0_0_0_3px_rgb(var(--harbor-accent)_/_0.12)]"
          style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}
        >
          <Search size={13} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('memory.search_placeholder')}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'rgb(var(--harbor-text))' }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div
        className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        <button
          onClick={() => setActiveCategory('all')}
          className={`memory-cat-chip flex-shrink-0 ${activeCategory === 'all' ? 'active' : ''}`}
        >
          {t('memory.all')} ({entries.length})
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat]
          const count = entries.filter((e) => e.category === cat).length
          if (count === 0) return null
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`memory-cat-chip flex-shrink-0 ${activeCategory === cat ? 'active' : ''}`}
            >
              {getCategoryLabel(cat)} ({count})
            </button>
          )
        })}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto harbor-scroll px-3 py-3 flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12 text-center">
            <Brain size={32} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                {searchQuery ? t('memory.no_results') : t('memory.empty_state')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                {searchQuery ? t('memory.try_search') : t('memory.empty_help')}
              </p>
            </div>
          </div>
        )}

        {filtered.map((entry) => (
          <MemoryCard
            key={entry.id}
            entry={entry}
            isEditing={editingId === entry.id}
            onEdit={() => setEditingId(entry.id)}
            onSave={(content) => updateEntry(entry.id, content)}
            onCancelEdit={() => setEditingId(null)}
            onDelete={() => deleteEntry(entry.id)}
            onTogglePin={() => togglePin(entry.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Markdown Memory Docs ─────────────────────────────────────────────────────

interface MemoryDocsEditorProps {
  docs: MemoryDocMap
  selectedDocId: string
  selectedDoc?: MemoryDoc
  draft: string
  isDirty: boolean
  savedAt: number | null
  onSelect: (id: string) => void
  onChange: (value: string) => void
  onSave: () => void
}

function MemoryDocsEditor({
  docs,
  selectedDocId,
  selectedDoc,
  draft,
  isDirty,
  savedAt,
  onSelect,
  onChange,
  onSave,
}: MemoryDocsEditorProps) {
  const { t } = useTranslation()
  const todayId = getTodayDailyDocId()
  const docIds = [
    ...CORE_MEMORY_DOC_IDS,
    todayId,
    ...Object.keys(docs).filter((id) => id.startsWith('DAILY/') && id !== todayId).sort().slice(-4),
  ].filter((id, index, arr) => docs[id] && arr.indexOf(id) === index)

  return (
    <div
      className="border-b px-3 py-3"
      style={{ borderColor: 'rgb(var(--harbor-border))' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <FileText size={14} style={{ color: 'rgb(var(--harbor-accent))' }} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>
            {t('memory.docs_title', 'Memory docs')}
          </p>
          <p className="text-[11px] truncate" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            {selectedDoc?.description ?? t('memory.docs_description', 'Editable Markdown context Harbor can read and update.')}
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={!isDirty || !selectedDoc}
          className="harbor-btn-primary text-xs px-3 py-1.5 disabled:opacity-40"
          title={t('memory.save_doc', 'Save document')}
        >
          <Save size={12} />
          {t('memory.save', 'Save')}
        </button>
      </div>

      <div className="grid grid-cols-1 min-[760px]:grid-cols-[180px_minmax(0,1fr)] gap-2">
        <div className="flex min-[760px]:flex-col gap-1 overflow-x-auto min-[760px]:overflow-visible harbor-scroll pb-1 min-[760px]:pb-0">
          {docIds.map((id) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="flex-shrink-0 min-[760px]:flex-shrink min-[760px]:w-full px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-medium transition-colors"
              style={{
                background: selectedDocId === id ? 'rgb(var(--harbor-accent) / 0.12)' : 'rgb(var(--harbor-surface))',
                borderColor: selectedDocId === id ? 'rgb(var(--harbor-accent) / 0.35)' : 'rgb(var(--harbor-border))',
                color: selectedDocId === id ? 'rgb(var(--harbor-text))' : 'rgb(var(--harbor-text-muted))',
              }}
            >
              <span className="block truncate">{id}</span>
            </button>
          ))}
        </div>

        <div className="min-w-0">
          <textarea
            value={draft}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            className="w-full h-[190px] min-[760px]:h-[260px] rounded-lg border p-2.5 text-xs leading-relaxed font-mono resize-y outline-none focus:border-[rgb(var(--harbor-accent))] focus:shadow-[0_0_0_3px_rgb(var(--harbor-accent)_/_0.12)]"
            style={{
              background: 'rgb(var(--harbor-surface))',
              borderColor: 'rgb(var(--harbor-border))',
              color: 'rgb(var(--harbor-text))',
            }}
          />
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <p className="text-[10px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
              {isDirty
                ? t('memory.unsaved', 'Unsaved changes')
                : savedAt
                  ? t('memory.saved_now', 'Saved')
                  : selectedDoc
                    ? `${t('memory.updated', 'Updated')} ${new Date(selectedDoc.updatedAt).toLocaleDateString()}`
                    : ''}
            </p>
            <p className="text-[10px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
              {draft.length.toLocaleString()} {t('memory.characters', 'chars')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Memory Card ───────────────────────────────────────────────────────────────

interface MemoryCardProps {
  entry: MemoryEntry
  isEditing: boolean
  onEdit: () => void
  onSave: (content: string) => void
  onCancelEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
}

function MemoryCard({ entry, isEditing, onEdit, onSave, onCancelEdit, onDelete, onTogglePin }: MemoryCardProps) {
  const { t } = useTranslation()
  const [editContent, setEditContent] = useState(entry.content)
  const meta = CATEGORY_META[entry.category]
  const CatIcon = meta.icon

  // Get translated category label
  const getCategoryLabel = (cat: MemoryCategory): string => {
    const labels: Record<MemoryCategory, string> = {
      identity: t('memory.identity'),
      preferences: t('memory.preferences'),
      projects: t('memory.projects'),
      tools: t('memory.tools'),
      habits: t('memory.habits'),
      people: t('memory.people'),
      general: t('memory.general'),
    }
    return labels[cat]
  }

  useEffect(() => {
    setEditContent(entry.content)
  }, [entry.content])

  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-2 group"
      style={{
        background: 'rgb(var(--harbor-surface))',
        borderColor: entry.isPinned ? 'rgb(var(--harbor-accent) / 0.3)' : 'rgb(var(--harbor-border))',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.color}`}>
          <CatIcon size={10} />
          {getCategoryLabel(entry.category)}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onTogglePin}
            className="p-1 rounded hover:bg-[rgb(var(--harbor-surface-2))] focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
            title={entry.isPinned ? t('memory.unpin') : t('memory.pin')}
          >
            <Pin
              size={11}
              style={{
                color: entry.isPinned ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-faint))',
                fill: entry.isPinned ? 'rgb(var(--harbor-accent))' : 'none',
              }}
            />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-red-500"
            title={t('memory.delete')}
          >
            <Trash2 size={11} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-xs rounded-lg p-2 border outline-none resize-none min-h-[60px] focus:border-[rgb(var(--harbor-accent))] focus:shadow-[0_0_0_3px_rgb(var(--harbor-accent)_/_0.12)] transition-shadow"
            style={{
              background: 'rgb(var(--harbor-surface-2))',
              borderColor: 'rgb(var(--harbor-border))',
              color: 'rgb(var(--harbor-text))',
            }}
            autoFocus
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => onSave(editContent)}
              className="text-[11px] px-2.5 py-1 rounded-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
              style={{ background: 'rgb(var(--harbor-accent))', color: 'white' }}
            >
              {t('memory.save')}
            </button>
            <button
              onClick={onCancelEdit}
              className="text-[11px] px-2.5 py-1 rounded-lg focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
              style={{ color: 'rgb(var(--harbor-text-muted))' }}
            >
              {t('memory.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          className="text-xs text-left leading-relaxed"
          style={{ color: 'rgb(var(--harbor-text))' }}
          onClick={onEdit}
        >
          {entry.content}
        </button>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[10px]"
              style={{
                background: 'rgb(var(--harbor-surface-2))',
                color: 'rgb(var(--harbor-text-faint))',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-[10px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
        {new Date(entry.updatedAt).toLocaleDateString()}
      </p>
    </div>
  )
}

