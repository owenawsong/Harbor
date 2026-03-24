import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const ACTIONS: PaletteAction[] = [
    {
      id: 'new-chat',
      label: t('command_palette.new_conversation'),
      description: t('command_palette.new_conversation_desc'),
      icon: Plus,
      shortcut: '⌘N',
      keywords: ['new', 'chat', 'conversation', 'fresh', 'clear'],
      action: () => { onNewChat(); onClose() },
    },
    {
      id: 'settings',
      label: t('command_palette.open_settings'),
      description: t('command_palette.open_settings_desc'),
      icon: Settings,
      shortcut: '⌘,',
      keywords: ['settings', 'config', 'preferences', 'api', 'key'],
      action: () => { onOpenSettings(); onClose() },
    },
    {
      id: 'history',
      label: t('command_palette.conversation_history'),
      description: t('command_palette.conversation_history_desc'),
      icon: Clock,
      keywords: ['history', 'past', 'conversations', 'sessions'],
      action: () => { onOpenHistory(); onClose() },
    },
    {
      id: 'memory',
      label: t('command_palette.memory_panel'),
      description: t('command_palette.memory_panel_desc'),
      icon: Brain,
      keywords: ['memory', 'remember', 'store', 'context'],
      action: () => { onOpenMemory(); onClose() },
    },
    {
      id: 'skills',
      label: t('command_palette.skills_gallery'),
      description: t('command_palette.skills_gallery_desc'),
      icon: Zap,
      keywords: ['skills', 'gallery', 'automation', 'tools'],
      action: () => { onOpenSkills(); onClose() },
    },
    {
      id: 'dashboard',
      label: t('command_palette.dashboard'),
      description: t('command_palette.dashboard_desc'),
      icon: LayoutDashboard,
      keywords: ['dashboard', 'home', 'overview'],
      action: () => { onOpenDashboard(); onClose() },
    },
    {
      id: 'theme-dark',
      label: t('command_palette.dark_mode'),
      icon: Moon,
      keywords: ['dark', 'theme', 'night', 'appearance'],
      action: () => { onSetTheme('dark'); onClose() },
    },
    {
      id: 'theme-light',
      label: t('command_palette.light_mode'),
      icon: Sun,
      keywords: ['light', 'theme', 'day', 'appearance'],
      action: () => { onSetTheme('light'); onClose() },
    },
    {
      id: 'theme-system',
      label: t('command_palette.system_theme'),
      icon: Monitor,
      keywords: ['system', 'auto', 'theme', 'appearance'],
      action: () => { onSetTheme('system'); onClose() },
    },
    {
      id: 'summarize',
      label: t('command_palette.summarize_page'),
      icon: Globe,
      keywords: ['summarize', 'page', 'tldr', 'summary'],
      action: () => {
        onSendMessage?.('Summarize this page for me')
        onClose()
      },
    },
    {
      id: 'extract',
      label: t('command_palette.extract_data'),
      icon: Globe,
      keywords: ['extract', 'data', 'scrape', 'page'],
      action: () => {
        onSendMessage?.('Extract all the data from this page into a structured format')
        onClose()
      },
    },
    {
      id: 'organize-tabs',
      label: t('command_palette.organize_tabs'),
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
            placeholder={t('command_palette.search_placeholder')}
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
            {t('command_palette.esc')}
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
                {t('command_palette.no_results', { query })}
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
            {t('command_palette.footer_hint')}
          </span>
        </div>
      </div>
    </div>
  )
}
