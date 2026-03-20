import React from 'react'
import { X } from 'lucide-react'

interface Shortcut {
  key: string
  description: string
  category: 'Navigation' | 'Chat' | 'Settings' | 'Mode'
}

const shortcuts: Shortcut[] = [
  // Navigation
  { key: 'Ctrl+K / Cmd+K', description: 'Open Command Palette', category: 'Navigation' },
  { key: 'Ctrl+Alt+H / Cmd+Alt+H', description: 'Toggle Harbor Side Panel', category: 'Navigation' },

  // Chat
  { key: 'Enter', description: 'Send message', category: 'Chat' },
  { key: 'Shift+Enter', description: 'Add new line', category: 'Chat' },
  { key: 'Ctrl+N / Cmd+N', description: 'New conversation', category: 'Chat' },
  { key: 'Ctrl+H / Cmd+H', description: 'View history', category: 'Chat' },

  // Settings
  { key: 'Ctrl+, / Cmd+,', description: 'Open settings (from any view)', category: 'Settings' },

  // Mode
  { key: 'Tab', description: 'Toggle Agent/Chat mode', category: 'Mode' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcuts({ isOpen, onClose }: Props) {
  if (!isOpen) return null

  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[rgb(var(--harbor-surface))] border border-[rgb(var(--harbor-border))] rounded-xl shadow-xl w-full max-w-2xl max-h-96 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--harbor-border))]">
          <h2 className="font-semibold text-sm" style={{ color: 'rgb(var(--harbor-text))' }}>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text))] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto harbor-scroll">
          <div className="p-6 space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut) => (
                      <div key={shortcut.key} className="flex items-center justify-between gap-4">
                        <p className="text-sm flex-1" style={{ color: 'rgb(var(--harbor-text))' }}>
                          {shortcut.description}
                        </p>
                        <kbd className="px-2.5 py-1 rounded-lg bg-[rgb(var(--harbor-surface-2))] border border-[rgb(var(--harbor-border))] text-xs font-mono text-[rgb(var(--harbor-text-muted))] whitespace-nowrap flex-shrink-0">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface-2))] text-center">
          <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Press <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--harbor-surface))] border border-[rgb(var(--harbor-border))] font-mono">?</kbd> to show this again
          </p>
        </div>
      </div>
    </div>
  )
}
