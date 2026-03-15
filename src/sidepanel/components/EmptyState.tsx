import React from 'react'

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void
}

const SUGGESTIONS = [
  { icon: '🔍', text: 'Search Google for the latest AI news' },
  { icon: '📋', text: 'Summarize this page for me' },
  { icon: '🛒', text: 'Find the best price for this product' },
  { icon: '📧', text: 'Draft a reply to the email I have open' },
  { icon: '🔖', text: 'Bookmark all my open tabs into a folder' },
  { icon: '📊', text: 'Extract data from this table into CSV' },
]

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 gap-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-harbor-500 to-harbor-700 flex items-center justify-center shadow-lg">
          <span className="text-white text-3xl font-bold">H</span>
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-[rgb(var(--harbor-text))]">Harbor AI Agent</h1>
          <p className="text-sm text-[rgb(var(--harbor-text-muted))] mt-1">
            I can control your browser, automate tasks, and help you get things done.
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="w-full grid grid-cols-1 gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.text}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[rgb(var(--harbor-border))] hover:border-harbor-400 hover:bg-[rgb(var(--harbor-surface))] transition-all text-left group"
          >
            <span className="text-base flex-shrink-0">{suggestion.icon}</span>
            <span className="text-sm text-[rgb(var(--harbor-text))] group-hover:text-harbor-600 dark:group-hover:text-harbor-400 transition-colors">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>

      <p className="text-xs text-[rgb(var(--harbor-text-muted))] text-center">
        Supports Claude, GPT, Gemini, Ollama & more
      </p>
    </div>
  )
}
