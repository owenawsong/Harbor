import React from 'react'
import { Search, FileText, ShoppingCart, Mail, Bookmark, BarChart3, Globe, Zap } from 'lucide-react'

const SUGGESTIONS = [
  { Icon: Search,       text: 'Search for the latest AI news',        short: 'Search the web' },
  { Icon: FileText,     text: 'Summarize this page for me',            short: 'Summarize page' },
  { Icon: ShoppingCart, text: 'Find the best price for this product',  short: 'Price compare' },
  { Icon: Mail,         text: 'Draft a reply to this email',           short: 'Draft reply' },
  { Icon: Bookmark,     text: 'Bookmark all my open tabs into a folder', short: 'Organize tabs' },
  { Icon: BarChart3,    text: 'Extract data from this table into CSV', short: 'Export data' },
]

interface Props {
  onSuggestionClick: (text: string) => void
}

export default function EmptyState({ onSuggestionClick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6 gap-5 animate-fade-in overflow-y-auto harbor-scroll">
      {/* Brand */}
      <div className="flex flex-col items-center gap-2.5 text-center">
        <img src="/icons/harbor-logo.svg" alt="Harbor" className="w-14 h-14 rounded-2xl shadow-sm" />
        <div>
          <h1 className="font-semibold text-base text-[rgb(var(--harbor-text))]">Harbor AI Agent</h1>
          <p className="text-xs text-[rgb(var(--harbor-text-muted))] mt-0.5 leading-relaxed">
            Control your browser, automate tasks, get things done.
          </p>
        </div>
      </div>

      {/* Suggestions — 2-column grid */}
      <div className="w-full grid grid-cols-2 gap-2">
        {SUGGESTIONS.map(({ Icon, text, short }, i) => (
          <button
            key={text}
            onClick={() => onSuggestionClick(text)}
            className="flex flex-col items-start gap-2 px-3 py-3 rounded-xl border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] hover:border-harbor-400 hover:bg-[rgb(var(--harbor-surface-2))] hover:scale-[1.02] active:scale-[0.98] text-left group transition-transform duration-150 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Icon
              size={14}
              className="flex-shrink-0 text-[rgb(var(--harbor-text-faint))] group-hover:text-harbor-500 transition-colors"
            />
            <span className="text-xs font-medium text-[rgb(var(--harbor-text-muted))] group-hover:text-[rgb(var(--harbor-text))] leading-snug transition-colors">
              {short}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-[rgb(var(--harbor-text-faint))]">
        Supports Claude, GPT, Gemini, Ollama &amp; more
      </p>
    </div>
  )
}
