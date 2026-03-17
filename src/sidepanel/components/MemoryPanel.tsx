import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Plus, Search, Pin, Trash2, Tag, Brain,
  User, Settings as SettingsIcon, FolderOpen, Wrench, Heart, Users, MessageSquare,
} from 'lucide-react'
import type { MemoryEntry, MemoryCategory } from '../../shared/types'

interface Props {
  onBack: () => void
}

const CATEGORY_META: Record<MemoryCategory, { label: string; icon: React.ComponentType<{ size?: number }>; color: string }> = {
  identity:    { label: 'Identity',    icon: User,          color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
  preferences: { label: 'Preferences', icon: Heart,         color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
  projects:    { label: 'Projects',    icon: FolderOpen,    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  tools:       { label: 'Tools',       icon: Wrench,        color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  habits:      { label: 'Habits',      icon: Brain,         color: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
  people:      { label: 'People',      icon: Users,         color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30' },
  general:     { label: 'General',     icon: MessageSquare, color: 'text-gray-500 bg-gray-50 dark:bg-gray-950/30' },
}

const ALL_CATEGORIES: MemoryCategory[] = ['identity', 'preferences', 'projects', 'tools', 'habits', 'people', 'general']

const STORAGE_KEY = 'harbor_memory_entries'

function uid(): string {
  return Math.random().toString(36).slice(2, 11)
}

export default function MemoryPanel({ onBack }: Props) {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Load from storage
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      if (data[STORAGE_KEY]) setEntries(data[STORAGE_KEY])
    })
  }, [])

  const save = useCallback((newEntries: MemoryEntry[]) => {
    setEntries(newEntries)
    chrome.storage.local.set({ [STORAGE_KEY]: newEntries })
  }, [])

  const addEntry = (content: string, category: MemoryCategory, tags: string[]) => {
    const entry: MemoryEntry = {
      id: uid(),
      category,
      content,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
    }
    save([entry, ...entries])
    setShowAdd(false)
  }

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
          Memory
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="icon-btn"
          title="Add memory"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
        <div
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border"
          style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}
        >
          <Search size={13} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories…"
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
          All ({entries.length})
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
              {meta.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto harbor-scroll px-3 py-3 flex flex-col gap-2">
        {showAdd && (
          <AddEntryForm
            onAdd={addEntry}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {filtered.length === 0 && !showAdd && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12 text-center">
            <Brain size={32} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                {searchQuery ? 'No results found' : 'No memories yet'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                {searchQuery ? 'Try a different search term' : 'Harbor will remember things you tell it, or you can add them manually.'}
              </p>
            </div>
            {!searchQuery && (
              <button onClick={() => setShowAdd(true)} className="harbor-btn-primary text-xs px-4 py-2">
                <Plus size={13} /> Add first memory
              </button>
            )}
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
  const [editContent, setEditContent] = useState(entry.content)
  const meta = CATEGORY_META[entry.category]
  const CatIcon = meta.icon

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
          {meta.label}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onTogglePin}
            className="p-1 rounded hover:bg-[rgb(var(--harbor-surface-2))]"
            title={entry.isPinned ? 'Unpin' : 'Pin'}
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
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
            title="Delete"
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
            className="w-full text-xs rounded-lg p-2 border outline-none resize-none min-h-[60px]"
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
              className="text-[11px] px-2.5 py-1 rounded-lg font-medium"
              style={{ background: 'rgb(var(--harbor-accent))', color: 'white' }}
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="text-[11px] px-2.5 py-1 rounded-lg"
              style={{ color: 'rgb(var(--harbor-text-muted))' }}
            >
              Cancel
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

// ─── Add Entry Form ────────────────────────────────────────────────────────────

function AddEntryForm({ onAdd, onCancel }: { onAdd: (content: string, category: MemoryCategory, tags: string[]) => void; onCancel: () => void }) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<MemoryCategory>('general')
  const [tagsInput, setTagsInput] = useState('')

  const handleAdd = () => {
    if (!content.trim()) return
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    onAdd(content.trim(), category, tags)
  }

  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-3 animate-fade-in"
      style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-accent) / 0.3)' }}
    >
      <p className="text-xs font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>New Memory</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What should Harbor remember?"
        className="w-full text-xs rounded-lg p-2 border outline-none resize-none min-h-[60px]"
        style={{
          background: 'rgb(var(--harbor-surface-2))',
          borderColor: 'rgb(var(--harbor-border))',
          color: 'rgb(var(--harbor-text))',
        }}
        autoFocus
      />
      <div className="flex flex-col gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MemoryCategory)}
          className="text-xs rounded-lg px-2 py-1.5 border outline-none"
          style={{
            background: 'rgb(var(--harbor-surface))',
            borderColor: 'rgb(var(--harbor-border))',
            color: 'rgb(var(--harbor-text))',
          }}
        >
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
          ))}
        </select>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="text-xs rounded-lg px-2 py-1.5 border outline-none"
          style={{
            background: 'rgb(var(--harbor-surface))',
            borderColor: 'rgb(var(--harbor-border))',
            color: 'rgb(var(--harbor-text))',
          }}
        />
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={handleAdd}
          disabled={!content.trim()}
          className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40"
          style={{ background: 'rgb(var(--harbor-accent))', color: 'white' }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ color: 'rgb(var(--harbor-text-muted))' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
