import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Globe, Search, ShoppingCart, Table, Shuffle,
  Layers, BookOpen, Camera,
} from 'lucide-react'
import { getGreeting } from '../../shared/greetings'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Globe, Search, ShoppingCart, Table, Shuffle, Layers, BookOpen, Camera,
}

interface Props {
  onSuggestionClick: (text: string) => void
  userName?: string
  agentMode?: boolean
}

export default function EmptyState({ onSuggestionClick, userName, agentMode = true }: Props) {
  const { t } = useTranslation()
  const [greeting] = useState(() => getGreeting(t, userName))

  const AGENT_SUGGESTIONS = [
    { icon: 'Globe',        text: t('suggestions.agent.summarize') },
    { icon: 'Search',       text: t('suggestions.agent.research') },
    { icon: 'ShoppingCart', text: t('suggestions.agent.compare') },
    { icon: 'Table',        text: t('suggestions.agent.extract') },
    { icon: 'Shuffle',      text: t('suggestions.agent.find_alternatives') },
    { icon: 'Layers',       text: t('suggestions.agent.organize') },
  ]

  const CHAT_SUGGESTIONS = [
    { icon: 'Search',       text: t('suggestions.chat.research') },
    { icon: 'BookOpen',     text: t('suggestions.chat.explain') },
    { icon: 'ShoppingCart', text: t('suggestions.chat.recommend') },
    { icon: 'Shuffle',      text: t('suggestions.chat.brainstorm') },
    { icon: 'Camera',       text: t('suggestions.chat.analyze') },
    { icon: 'Layers',       text: t('suggestions.chat.organize') },
  ]

  const suggestions = agentMode ? AGENT_SUGGESTIONS : CHAT_SUGGESTIONS
  const description = agentMode
    ? t('empty_state.agent_description')
    : t('empty_state.chat_description')

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

        {/* Suggestion chips — visually distinct by mode */}
        <div>
          <p className="harbor-section-label mb-3 text-xs text-center font-medium" style={{
            color: agentMode ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))'
          }}>
            {t('suggestions.try_asking')}
          </p>
          <div className={`grid gap-2 suggestions-grid ${agentMode ? 'grid-cols-2' : 'grid-cols-2'}`}>
            {suggestions.map(({ icon, text }, i) => {
              const Icon = ICON_MAP[icon]
              return (
                <button
                  key={text}
                  onClick={() => onSuggestionClick(text)}
                  className={`suggestion-chip flex items-center gap-2 px-2.5 py-2.5 rounded-lg border text-left animate-fade-up transition-all hover:scale-105 ${
                    agentMode
                      ? 'border-[rgb(var(--harbor-accent))] bg-[rgb(var(--harbor-accent-light))] hover:shadow-md hover:shadow-harbor-500/20'
                      : 'border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] hover:border-[rgb(var(--harbor-accent))]'
                  }`}
                  style={{
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  {Icon && (
                    <Icon
                      size={agentMode ? 14 : 13}
                      className="flex-shrink-0"
                      style={{
                        color: agentMode ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-accent))',
                        opacity: agentMode ? 1 : 0.8,
                      }}
                    />
                  )}
                  <span
                    className={`text-[11px] leading-tight font-medium`}
                    style={{ color: agentMode ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text))' }}
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
            className="text-[10px] text-center italic"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            {t('chat.multiline_hint')}
          </p>
        </div>
      </div>
    </div>
  )
}
