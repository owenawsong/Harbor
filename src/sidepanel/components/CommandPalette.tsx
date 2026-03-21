import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, MessageSquare, Settings, Clock, Brain, Zap, LayoutDashboard,
  Plus, Moon, Sun, Monitor, Globe, ArrowRight,
} from 'lucide-react'

export interface PaletteAction {
  id: string
  label: string
  description?: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  shortcut?: string
  keywords?: string[]
  action: () => void
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onNewChat: () => void
  onOpenSettings: () => void
  onOpenHistory: () => void
  onOpenMemory: () => void
  onOpenSkills: () => void
  onOpenDashboard: () => void
  onSetTheme: (theme: 'light' | 'dark' | 'system') => void
  onSendMessage?: (text: string) => void
}

export default function CommandPalette({
  isOpen, onClose, onNewChat, onOpenSettings, onOpenHistory,
  onOpenMemory, onOpenSkills, onOpenDashboard, onSetTheme, onSendMessage,
}: Props) {
  const [query, setQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const ACTIONS: PaletteAction[] = [
    {
      id: 'new-chat',
      label: 'New conversation',
      description: 'Start a fresh chat',
      icon: Plus,
      shortcut: '⌘N',
      keywords: ['new', 'chat', 'conversation', 'fresh', 'clear'],
      action: () => { onNewChat(); onClose() },
    },
    {
      id: 'settings',
      label: 'Open Settings',
      description: 'Configure Harbor',
      icon: Settings,
      shortcut: '⌘,',
      keywords: ['settings', 'config', 'preferences', 'api', 'key'],
      action: () => { onOpenSettings(); onClose() },
    },
    {
      id: 'history',
      label: 'Conversation History',
      description: 'Browse past conversations',
      icon: Clock,
      keywords: ['history', 'past', 'conversations', 'sessions'],
      action: () => { onOpenHistory(); onClose() },
    },
    {
      id: 'memory',
      label: 'Memory Panel',
      description: 'View and manage Harbor\'s memory',
      icon: Brain,
      keywords: ['memory', 'remember', 'store', 'context'],
      action: () => { onOpenMemory(); onClose() },
    },
    {
      id: 'skills',
      label: 'Skills Gallery',
      description: 'Browse and manage skills',
      icon: Zap,
      keywords: ['skills', 'gallery', 'automation', 'tools'],
      action: () => { onOpenSkills(); onClose() },
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Quick overview and shortcuts',
      icon: LayoutDashboard,
      keywords: ['dashboard', 'home', 'overview'],
      action: () => { onOpenDashboard(); onClose() },
    },
    {
      id: 'theme-dark',
      label: 'Switch to Dark mode',
      icon: Moon,
      keywords: ['dark', 'theme', 'night', 'appearance'],
      action: () => { onSetTheme('dark'); onClose() },
    },
    {
      id: 'theme-light',
      label: 'Switch to Light mode',
      icon: Sun,
      keywords: ['light', 'theme', 'day', 'appearance'],
      action: () => { onSetTheme('light'); onClose() },
    },
    {
      id: 'theme-system',
      label: 'Use System theme',
      icon: Monitor,
      keywords: ['system', 'auto', 'theme', 'appearance'],
      action: () => { onSetTheme('system'); onClose() },
    },
    {
      id: 'summarize',
      label: 'Summarize this page',
      icon: Globe,
      keywords: ['summarize', 'page', 'tldr', 'summary'],
      action: () => {
        onSendMessage?.('Summarize this page for me')
        onClose()
      },
    },
    {
      id: 'extract',
      label: 'Extract data from page',
      icon: Globe,
      keywords: ['extract', 'data', 'scrape', 'page'],
      action: () => {
        onSendMessage?.('Extract all the data from this page into a structured format')
        onClose()
      },
    },
    {
      id: 'organize-tabs',
      label: 'Organize my tabs',
      icon: Globe,
      keywords: ['organize', 'tabs', 'group', 'sort'],
      action: () => {
        onSendMessage?.('Please organize all my open tabs into groups')
        onClose()
      },
    },
  ]

  const filtered = query.trim()
    ? ACTIONS.filter((a) => {
        const q = query.toLowerCase()
        return (
          a.label.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.keywords?.some((k) => k.includes(q))
        )
      })
    : ACTIONS

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setFocusedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setFocusedIndex(0)
  }, [query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[focusedIndex]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [filtered, focusedIndex, onClose])

  // Scroll focused item into view
  useEffect(() => {
    const el = listRef.current?.children[focusedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 command-palette-overlay"
      onClick={onClose}
    >
      <div
        className="w-full mx-4 max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{
          background: 'rgb(var(--harbor-surface))',
          border: '1px solid rgb(var(--harbor-border))',
          boxShadow: '0 20px 60px rgb(0 0 0 / 0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-2.5 px-4 py-3.5 border-b"
          style={{ borderColor: 'rgb(var(--harbor-border))' }}
        >
          <Search size={15} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actions, pages, commands…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'rgb(var(--harbor-text))' }}
          />
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: 'rgb(var(--harbor-surface-2))',
              color: 'rgb(var(--harbor-text-faint))',
              border: '1px solid rgb(var(--harbor-border))',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-72 overflow-y-auto harbor-scroll py-1.5"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                No actions match "{query}"
              </p>
            </div>
          ) : (
            filtered.map((action, i) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  className={`command-palette-item w-full ${i === focusedIndex ? 'focused' : ''}`}
                  onClick={action.action}
                  onMouseEnter={() => setFocusedIndex(i)}
                >
                  <div
                    className="command-palette-icon w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: i === focusedIndex ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface-2))',
                    }}
                  >
                    <Icon
                      size={14}
                      style={{
                        color: i === focusedIndex ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))',
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-medium truncate" style={{ color: 'rgb(var(--harbor-text))' }}>
                      {action.label}
                    </p>
                    {action.description && (
                      <p className="text-[10px] truncate" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                        {action.description}
                      </p>
                    )}
                  </div>
                  {action.shortcut && (
                    <kbd
                      className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: 'rgb(var(--harbor-surface-2))',
                        color: 'rgb(var(--harbor-text-faint))',
                        border: '1px solid rgb(var(--harbor-border))',
                      }}
                    >
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-3 px-4 py-2 border-t"
          style={{
            borderColor: 'rgb(var(--harbor-border))',
            background: 'rgb(var(--harbor-surface-2))',
          }}
        >
          <span className="text-[10px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            ↑↓ Navigate · Enter to select · Esc to close
          </span>
        </div>
      </div>
    </div>
  )
}
