import React, { useState } from 'react'
import {
  Globe, Search, ShoppingCart, Table, Shuffle,
  Layers, BookOpen, Camera,
} from 'lucide-react'
import { getGreeting } from '../../shared/greetings'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Globe, Search, ShoppingCart, Table, Shuffle, Layers, BookOpen, Camera,
}

const SUGGESTIONS = [
  { icon: 'Globe',        text: 'Summarize this page' },
  { icon: 'Search',       text: 'Research a topic' },
  { icon: 'ShoppingCart', text: 'Compare prices' },
  { icon: 'Table',        text: 'Extract data' },
  { icon: 'Shuffle',      text: 'Find alternatives' },
  { icon: 'Layers',       text: 'Organize my tabs' },
]

interface Props {
  onSuggestionClick: (text: string) => void
  userName?: string
}

export default function EmptyState({ onSuggestionClick, userName }: Props) {
  const [greeting] = useState(() => getGreeting(userName))

  return (
    <div className="flex flex-col h-full overflow-y-auto harbor-scroll justify-center items-center">
      <div className="flex flex-col gap-7 px-5 py-8 animate-fade-in w-full max-w-sm text-center">
        {/* Greeting */}
        <div className="flex flex-col gap-2">
          <h2
            className="harbor-serif text-4xl font-semibold leading-tight empty-greeting"
            style={{ color: 'rgb(var(--harbor-text))' }}
          >
            {greeting}
          </h2>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            Ask anything, automate tasks, browse smarter.
          </p>
        </div>

        {/* Suggestion chips — 2 column grid */}
        <div>
          <p className="harbor-section-label mb-2 text-xs text-center">Try asking</p>
          <div className="grid grid-cols-2 gap-1.5 suggestions-grid">
            {SUGGESTIONS.map(({ icon, text }) => {
              const Icon = ICON_MAP[icon]
              return (
                <button
                  key={text}
                  onClick={() => onSuggestionClick(text)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all duration-150"
                  style={{
                    background: 'rgb(var(--harbor-surface))',
                    borderColor: 'rgb(var(--harbor-border))',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(var(--harbor-accent) / 0.4)'
                    e.currentTarget.style.background = 'rgb(var(--harbor-surface-2))'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(var(--harbor-border))'
                    e.currentTarget.style.background = 'rgb(var(--harbor-surface))'
                  }}
                >
                  {Icon && (
                    <Icon
                      size={13}
                      className="flex-shrink-0"
                      style={{ color: 'rgb(var(--harbor-accent))' }}
                    />
                  )}
                  <span
                    className="text-[11px] leading-tight"
                    style={{ color: 'rgb(var(--harbor-text))' }}
                  >
                    {text}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer hint */}
        <p
          className="text-[10px] text-center"
          style={{ color: 'rgb(var(--harbor-text-faint))' }}
        >
          Claude · GPT · Gemini · Ollama · OpenRouter · more
        </p>
      </div>
    </div>
  )
}
