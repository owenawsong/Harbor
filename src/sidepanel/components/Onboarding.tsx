import React, { useState, useEffect } from 'react'
import { Check, ChevronRight, ArrowLeft } from 'lucide-react'
import type { OnboardingData, ToneStyle } from '../../shared/types'

interface Props {
  onComplete: (data: OnboardingData) => void
}

const TOTAL_STEPS = 6

const USE_CASES = [
  { id: 'work',     label: 'Work & Productivity',  icon: '💼' },
  { id: 'research', label: 'Research',             icon: '🔬' },
  { id: 'coding',   label: 'Coding & Dev',         icon: '⌨️' },
  { id: 'writing',  label: 'Writing & Content',    icon: '✍️' },
  { id: 'shopping', label: 'Shopping & Deals',     icon: '🛍️' },
  { id: 'learning', label: 'Learning & Study',     icon: '📚' },
  { id: 'creative', label: 'Creative Projects',    icon: '🎨' },
  { id: 'personal', label: 'Personal Life',        icon: '🌱' },
]

const TONES: { id: ToneStyle; label: string; description: string }[] = [
  { id: 'professional', label: 'Professional',  description: 'Clear, precise, business-ready' },
  { id: 'friendly',     label: 'Friendly',      description: 'Warm, approachable, conversational' },
  { id: 'concise',      label: 'Concise',        description: 'Brief answers, no fluff' },
  { id: 'detailed',     label: 'Detailed',       description: 'Thorough explanations with context' },
  { id: 'playful',      label: 'Playful',        description: 'Light-hearted, creative, fun' },
]

const THEMES = [
  { id: 'light' as const,  label: 'Light',  description: 'Warm cream, perfect for daytime' },
  { id: 'dark' as const,   label: 'Dark',   description: 'Deep navy, easy on the eyes' },
  { id: 'system' as const, label: 'Auto',   description: 'Follows your system setting' },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'pt', label: 'Português' },
  { code: 'ko', label: '한국어' },
]

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0) // 0 = logo reveal
  const [animating, setAnimating] = useState(false)

  // Form state
  const [userName, setUserName] = useState('')
  const [useCases, setUseCases] = useState<string[]>([])
  const [tone, setTone] = useState<ToneStyle>('friendly')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState('en')

  const goNext = () => {
    if (animating) return
    if (step < TOTAL_STEPS) {
      setAnimating(true)
      setTimeout(() => {
        setStep((s) => s + 1)
        setAnimating(false)
      }, 200)
    }
  }

  const goBack = () => {
    if (animating || step === 0) return
    setAnimating(true)
    setTimeout(() => {
      setStep((s) => s - 1)
      setAnimating(false)
    }, 200)
  }

  const toggleUseCase = (id: string) => {
    setUseCases((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const handleComplete = () => {
    onComplete({
      completed: true,
      userName: userName.trim() || undefined,
      useCases,
      tone,
      theme,
      language,
      completedAt: Date.now(),
    })
  }

  // Step 0: Logo reveal screen
  if (step === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full px-6 animate-onboard-reveal"
        style={{ background: 'rgb(var(--harbor-bg))' }}
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <img
              src="/icons/logo.png"
              alt="Harbor"
              className="w-20 h-20 rounded-2xl logo-glow"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h1
              className="harbor-serif text-4xl font-light tracking-tight"
              style={{ color: 'rgb(var(--harbor-text))' }}
            >
              Harbor
            </h1>
            <p
              className="text-sm font-light tracking-wide"
              style={{ color: 'rgb(var(--harbor-text-muted))' }}
            >
              Your intelligent browser companion
            </p>
          </div>

          <p
            className="text-xs leading-relaxed max-w-[220px]"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            Let's set up Harbor to work exactly the way you do.
          </p>

          <button
            onClick={goNext}
            className="harbor-btn-primary mt-2 px-8"
          >
            Get Started
            <ChevronRight size={15} />
          </button>

          <p
            className="text-[10px]"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            Takes about 30 seconds
          </p>
        </div>
      </div>
    )
  }

  const progressStep = step - 1 // 0-indexed for steps 1-6

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'rgb(var(--harbor-bg))' }}
    >
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          {step > 1 && (
            <button
              onClick={goBack}
              className="icon-btn flex-shrink-0"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <div className="flex-1 flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-0.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: i < progressStep
                    ? 'rgb(var(--harbor-accent))'
                    : i === progressStep
                      ? 'rgb(var(--harbor-accent) / 0.5)'
                      : 'rgb(var(--harbor-border-2))',
                }}
              />
            ))}
          </div>
          <span
            className="text-[10px] flex-shrink-0"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            {progressStep + 1}/{TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className={`flex-1 overflow-y-auto harbor-scroll px-4 pb-4 ${animating ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}>
        {step === 1 && (
          <StepName userName={userName} onChange={setUserName} onNext={goNext} />
        )}
        {step === 2 && (
          <StepUseCases selected={useCases} onToggle={toggleUseCase} />
        )}
        {step === 3 && (
          <StepTone selected={tone} onSelect={setTone} />
        )}
        {step === 4 && (
          <StepTheme selected={theme} onSelect={setTheme} />
        )}
        {step === 5 && (
          <StepLanguage selected={language} onSelect={setLanguage} />
        )}
        {step === 6 && (
          <StepWelcome
            userName={userName}
            useCases={useCases}
            tone={tone}
            theme={theme}
            language={language}
            onComplete={handleComplete}
          />
        )}
      </div>

      {/* Navigation */}
      {step < 6 && (
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
          <div className="flex gap-2">
            {step > 1 && step < 6 && (
              <button onClick={goBack} className="harbor-btn-ghost flex-shrink-0 px-4">
                Back
              </button>
            )}
            <button
              onClick={step === 1 ? (userName.trim() ? goNext : goNext) : goNext}
              className="harbor-btn-primary flex-1"
            >
              {step === 5 ? 'Almost done →' : 'Continue'}
            </button>
          </div>
          {step < 6 && (
            <button
              onClick={step === 5 ? goNext : goNext}
              className="w-full text-center text-[11px] mt-2"
              style={{ color: 'rgb(var(--harbor-text-faint))' }}
            >
              Skip for now
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step Components ───────────────────────────────────────────────────────────

function StepName({ userName, onChange, onNext }: { userName: string; onChange: (v: string) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-5 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          What should I call you?
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          Optional — makes greetings more personal.
        </p>
      </div>
      <input
        type="text"
        value={userName}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onNext()}
        placeholder="Your name or nickname…"
        className="harbor-input"
        autoFocus
        maxLength={40}
      />
    </div>
  )
}

function StepUseCases({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-4 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          What will you use Harbor for?
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          Select all that apply — shapes how I assist you.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {USE_CASES.map((uc) => {
          const isSelected = selected.includes(uc.id)
          return (
            <button
              key={uc.id}
              onClick={() => onToggle(uc.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150"
              style={{
                background: isSelected ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                borderColor: isSelected ? 'rgb(var(--harbor-accent) / 0.5)' : 'rgb(var(--harbor-border))',
                color: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))',
              }}
            >
              <span className="text-base">{uc.icon}</span>
              <span className="text-xs font-medium leading-tight">{uc.label}</span>
              {isSelected && (
                <Check size={11} className="ml-auto flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepTone({ selected, onSelect }: { selected: ToneStyle; onSelect: (t: ToneStyle) => void }) {
  return (
    <div className="flex flex-col gap-4 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          How should I communicate?
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          Sets Harbor's default tone and style.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {TONES.map((t) => {
          const isSelected = selected === t.id
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all duration-150"
              style={{
                background: isSelected ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                borderColor: isSelected ? 'rgb(var(--harbor-accent) / 0.5)' : 'rgb(var(--harbor-border))',
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                style={{
                  borderColor: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border-2))',
                  background: isSelected ? 'rgb(var(--harbor-accent))' : 'transparent',
                }}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{t.label}</p>
                <p className="text-[11px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{t.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepTheme({ selected, onSelect }: { selected: 'light' | 'dark' | 'system'; onSelect: (t: 'light' | 'dark' | 'system') => void }) {
  return (
    <div className="flex flex-col gap-4 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          Choose your appearance
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          You can always change this in Settings.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((t) => {
          const isSelected = selected === t.id
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-150"
              style={{
                background: isSelected ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                borderColor: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
              }}
            >
              <div
                className="w-10 h-7 rounded-lg border"
                style={{
                  background: t.id === 'light' ? '#f9f8f4' : t.id === 'dark' ? '#07070e' : 'linear-gradient(135deg, #f9f8f4 50%, #07070e 50%)',
                  borderColor: 'rgb(var(--harbor-border))',
                }}
              />
              <span className="text-[11px] font-medium" style={{ color: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))' }}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
      {THEMES.map((t) => t.id === selected && (
        <p key={t.id} className="text-[11px] text-center" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          {t.description}
        </p>
      ))}
    </div>
  )
}

function StepLanguage({ selected, onSelect }: { selected: string; onSelect: (l: string) => void }) {
  return (
    <div className="flex flex-col gap-4 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          Preferred language
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          Harbor will respond in your chosen language.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code
          return (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150"
              style={{
                background: isSelected ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                borderColor: isSelected ? 'rgb(var(--harbor-accent) / 0.5)' : 'rgb(var(--harbor-border))',
              }}
            >
              <span className="text-xs font-medium" style={{ color: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text))' }}>
                {lang.label}
              </span>
              {isSelected && <Check size={11} className="ml-auto flex-shrink-0" style={{ color: 'rgb(var(--harbor-accent))' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepWelcome({
  userName, useCases, tone, theme, language, onComplete,
}: {
  userName: string; useCases: string[]; tone: ToneStyle; theme: 'light' | 'dark' | 'system'; language: string; onComplete: () => void
}) {
  const name = userName.trim()
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center animate-onboard-reveal">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgb(var(--harbor-accent-light))' }}
        >
          <Check size={24} style={{ color: 'rgb(var(--harbor-accent))' }} />
        </div>
        <div>
          <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
            {name ? `Welcome, ${name}.` : 'You\'re all set.'}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Harbor is ready to help.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div
        className="w-full rounded-2xl p-4 border text-left"
        style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}
      >
        <p className="harbor-section-label mb-3">Your setup</p>
        <div className="flex flex-col gap-2">
          {name && (
            <div className="flex justify-between text-xs">
              <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>Name</span>
              <span style={{ color: 'rgb(var(--harbor-text))' }}>{name}</span>
            </div>
          )}
          {useCases.length > 0 && (
            <div className="flex justify-between text-xs">
              <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>Focus areas</span>
              <span style={{ color: 'rgb(var(--harbor-text))' }}>{useCases.length} selected</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>Tone</span>
            <span style={{ color: 'rgb(var(--harbor-text))' }} className="capitalize">{tone}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>Theme</span>
            <span style={{ color: 'rgb(var(--harbor-text))' }} className="capitalize">{theme}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>Language</span>
            <span style={{ color: 'rgb(var(--harbor-text))' }}>
              {LANGUAGES.find((l) => l.code === language)?.label ?? language}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
        All settings are adjustable in the Settings panel anytime.
      </p>

      <button onClick={onComplete} className="harbor-btn-primary w-full text-base">
        Start using Harbor
      </button>
    </div>
  )
}
