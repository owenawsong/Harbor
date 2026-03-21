import React, { useState } from 'react'
import {
  Globe, Search, ShoppingCart, Table, Shuffle,
  Layers, BookOpen, Camera,
} from 'lucide-react'
import { getGreeting } from '../../shared/greetings'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Globe, Search, ShoppingCart, Table, Shuffle, Layers, BookOpen, Camera,
}

const AGENT_SUGGESTIONS = [
  { icon: 'Globe',        text: 'Summarize this page' },
  { icon: 'Search',       text: 'Research a topic' },
  { icon: 'ShoppingCart', text: 'Compare prices' },
  { icon: 'Table',        text: 'Extract data' },
  { icon: 'Shuffle',      text: 'Find alternatives' },
  { icon: 'Layers',       text: 'Organize my tabs' },
]

const CHAT_SUGGESTIONS = [
  { icon: 'Search',       text: 'Research a topic' },
  { icon: 'BookOpen',     text: 'Explain a concept' },
  { icon: 'ShoppingCart', text: 'Get recommendations' },
  { icon: 'Shuffle',      text: 'Brainstorm ideas' },
  { icon: 'Camera',       text: 'Analyze an image' },
  { icon: 'Layers',       text: 'Organize information' },
]

interface Props {
  onSuggestionClick: (text: string) => void
  userName?: string
  agentMode?: boolean
}

export default function EmptyState({ onSuggestionClick, userName, agentMode = true }: Props) {
  const [greeting] = useState(() => getGreeting(userName))
  const suggestions = agentMode ? AGENT_SUGGESTIONS : CHAT_SUGGESTIONS
  const description = agentMode
    ? 'Automate tasks, navigate pages, and browse smarter.'
    : 'Ask anything, get answers, explore ideas.'

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
            {description}
          </p>
        </div>

        {/* Suggestion chips — 2 column grid */}
        <div>
          <p className="harbor-section-label mb-2 text-xs text-center">Try asking</p>
          <div className="grid grid-cols-2 gap-1.5 suggestions-grid">
            {suggestions.map(({ icon, text }, i) => {
              const Icon = ICON_MAP[icon]
              return (
                <button
                  key={text}
                  onClick={() => onSuggestionClick(text)}
                  className="suggestion-chip flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left animate-fade-up"
                  style={{
                    background: 'rgb(var(--harbor-surface))',
                    borderColor: 'rgb(var(--harbor-border))',
                    animationDelay: `${i * 50}ms`,
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
        <div className="space-y-1.5">
          <p
            className="text-[10px] text-center"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            Powered by: Claude · GPT · Gemini · Ollama · OpenRouter
          </p>
          <p
            className="text-[10px] text-center italic"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            💡 Use Shift+Enter for multi-line messages
          </p>
        </div>
      </div>
    </div>
  )
}
