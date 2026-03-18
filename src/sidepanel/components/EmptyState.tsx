import React, { useState, useEffect } from 'react'
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
  { icon: 'Search',       text: 'Research a topic for me' },
  { icon: 'ShoppingCart', text: 'Compare prices for this product' },
  { icon: 'Table',        text: 'Extract data from this page' },
  { icon: 'Shuffle',      text: 'Find alternatives to this' },
  { icon: 'Layers',       text: 'Organize my open tabs' },
]

interface Props {
  onSuggestionClick: (text: string) => void
  userName?: string
}

export default function EmptyState({ onSuggestionClick, userName }: Props) {
  const [greeting] = useState(() => getGreeting(userName))

  return (
    <div className="flex flex-col h-full overflow-y-auto harbor-scroll justify-center items-center">
      <div className="flex flex-col gap-8 px-6 py-8 animate-fade-in max-w-xs text-center">
        {/* Greeting */}
        <div className="flex flex-col gap-3">
          <h2
            className="harbor-serif text-5xl font-light leading-tight"
            style={{ color: 'rgb(var(--harbor-text))' }}
          >
            {greeting}
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            Ask anything, automate tasks, browse smarter.
          </p>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-col gap-2">
          <p className="harbor-section-label mb-2 text-xs">Try asking</p>
          {SUGGESTIONS.map(({ icon, text }) => {
            const Icon = ICON_MAP[icon]
            return (
              <button
                key={text}
                onClick={() => onSuggestionClick(text)}
                className="flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl border text-left group transition-all duration-150"
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
                    size={14}
                    className="flex-shrink-0"
                    style={{ color: 'rgb(var(--harbor-accent))' }}
                  />
                )}
                <span
                  className="text-xs"
                  style={{ color: 'rgb(var(--harbor-text))' }}
                >
                  {text}
                </span>
              </button>
            )
          })}
        </div>

        {/* Footer hint */}
        <p
          className="text-[10px] text-center pt-4"
          style={{ color: 'rgb(var(--harbor-text-faint))' }}
        >
          Claude · GPT · Gemini · Ollama · OpenRouter · more
        </p>
      </div>
    </div>
  )
}
