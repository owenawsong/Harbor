import React from 'react'
import { Search, FileText, ShoppingCart, Mail, Bookmark, BarChart3 } from 'lucide-react'

const SUGGESTIONS = [
  { Icon: Search,       text: 'Search Google for the latest AI news' },
  { Icon: FileText,     text: 'Summarize this page for me' },
  { Icon: ShoppingCart, text: 'Find the best price for this product' },
  { Icon: Mail,         text: 'Draft a reply to this email' },
  { Icon: Bookmark,     text: 'Bookmark all my open tabs into a folder' },
  { Icon: BarChart3,    text: 'Extract data from this table into CSV' },
]

interface Props {
  onSuggestionClick: (text: string) => void
}

export default function EmptyState({ onSuggestionClick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-5 py-6 gap-6 animate-fade-in">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/icons/logo.png" alt="Harbor" className="w-16 h-16 rounded-2xl shadow-sm" />
        <div>
          <h1 className="font-semibold text-[rgb(var(--harbor-text))]">Harbor AI Agent</h1>
          <p className="text-sm text-[rgb(var(--harbor-text-muted))] mt-0.5 leading-relaxed">
            Control your browser, automate tasks, get things done.
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="w-full flex flex-col gap-1.5">
        {SUGGESTIONS.map(({ Icon, text }) => (
          <button
            key={text}
            onClick={() => onSuggestionClick(text)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] hover:border-harbor-400 hover:bg-[rgb(var(--harbor-surface-2))] text-left group"
          >
            <Icon
              size={15}
              className="flex-shrink-0 text-[rgb(var(--harbor-text-muted))] group-hover:text-harbor-600 dark:group-hover:text-harbor-400"
            />
            <span className="text-sm text-[rgb(var(--harbor-text))]">{text}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-[rgb(var(--harbor-text-faint))]">
        Supports Claude, GPT, Gemini, Ollama &amp; more
      </p>
    </div>
  )
}
