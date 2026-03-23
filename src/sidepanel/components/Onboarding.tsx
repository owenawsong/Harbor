import React, { useState, useEffect } from 'react'
import { Check, ChevronRight, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { OnboardingData, ToneStyle } from '../../shared/types'

interface Props {
  onComplete: (data: OnboardingData) => void
}

const TOTAL_STEPS = 7 // 0 = welcome, 1-6 = form steps

export default function Onboarding({ onComplete }: Props) {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)

  // Form state
  const [userName, setUserName] = useState('')
  const [useCases, setUseCases] = useState<string[]>([])
  const [tone, setTone] = useState<ToneStyle>('friendly')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState(i18n.language || 'en')

  const USE_CASES = [
    { id: 'work', label: t('usecases.work'), icon: '💼' },
    { id: 'research', label: t('usecases.research'), icon: '🔬' },
    { id: 'coding', label: t('usecases.coding'), icon: '⌨️' },
    { id: 'writing', label: t('usecases.writing'), icon: '✍️' },
    { id: 'shopping', label: t('usecases.shopping'), icon: '🛍️' },
    { id: 'learning', label: t('usecases.learning'), icon: '📚' },
    { id: 'creative', label: t('usecases.creative'), icon: '🎨' },
    { id: 'personal', label: t('usecases.personal'), icon: '🌱' },
  ]

  const TONES = [
    { id: 'professional' as const, label: t('tones.professional'), description: t('tones.professional_desc') },
    { id: 'friendly' as const, label: t('tones.friendly'), description: t('tones.friendly_desc') },
    { id: 'concise' as const, label: t('tones.concise'), description: t('tones.concise_desc') },
    { id: 'detailed' as const, label: t('tones.detailed'), description: t('tones.detailed_desc') },
    { id: 'playful' as const, label: t('tones.playful'), description: t('tones.playful_desc') },
  ]

  const THEMES = [
    { id: 'light' as const, label: t('themes.light'), description: t('themes.light_desc') },
    { id: 'dark' as const, label: t('themes.dark'), description: t('themes.dark_desc') },
    { id: 'system' as const, label: t('themes.auto'), description: t('themes.auto_desc') },
  ]

  const LANGUAGES = [
    { code: 'en', label: t('languages.en') },
    { code: 'zh', label: t('languages.zh') },
    { code: 'es', label: t('languages.es') },
    { code: 'fr', label: t('languages.fr') },
    { code: 'de', label: t('languages.de') },
    { code: 'ja', label: t('languages.ja') },
    { code: 'pt', label: t('languages.pt') },
    { code: 'ko', label: t('languages.ko') },
    { code: 'it', label: t('languages.it') },
    { code: 'ru', label: t('languages.ru') },
  ]

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

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode)
    i18n.changeLanguage(langCode)
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

  // Step 0: Welcome animation
  if (step === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full px-6 overflow-hidden"
        style={{ background: 'rgb(var(--harbor-bg))' }}
      >
        <div className="flex flex-col items-center gap-6 text-center animate-onboard-reveal">
          {/* Animated Logo */}
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-2xl" style={{ background: 'rgb(var(--harbor-accent) / 0.2)', filter: 'blur(20px)' }} />
            <img
              src="/icons/logo.png"
              alt="Harbor"
              className="w-24 h-24 rounded-2xl logo-glow relative animate-bounce-slow"
              style={{
                animation: 'bounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </div>

          {/* Welcome text with staggered animation */}
          <div className="flex flex-col gap-2 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <h1
              className="harbor-serif text-5xl font-light tracking-tight"
              style={{ color: 'rgb(var(--harbor-text))' }}
            >
              {t('onboarding.welcome')}
            </h1>
            <p
              className="text-sm font-light tracking-wide"
              style={{ color: 'rgb(var(--harbor-text-muted))' }}
            >
              {t('onboarding.tagline')}
            </p>
          </div>

          <p
            className="text-xs leading-relaxed max-w-[240px] animate-fade-up"
            style={{ color: 'rgb(var(--harbor-text-faint))', animationDelay: '0.3s' }}
          >
            {t('onboarding.subtitle')}
          </p>

          <button
            onClick={goNext}
            className="harbor-btn-primary mt-4 px-8 hover:scale-105 transition-transform animate-fade-up"
            style={{ animationDelay: '0.4s' }}
          >
            {t('onboarding.getStarted')}
            <ChevronRight size={15} />
          </button>

          <p
            className="text-[10px] animate-fade-up"
            style={{ color: 'rgb(var(--harbor-text-faint))', animationDelay: '0.5s' }}
          >
            {t('onboarding.timeEstimate')}
          </p>
        </div>

        <style>{`
          @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { opacity: 1; }
            70% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up {
            animation: fadeUp 0.6s ease-out forwards;
            opacity: 0;
          }
        `}</style>
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
              className="icon-btn flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <div className="flex-1 flex gap-1">
            {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
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
            {progressStep + 1}/{TOTAL_STEPS - 1}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className={`flex-1 overflow-y-auto harbor-scroll px-4 pb-4 ${animating ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}>
        {step === 1 && (
          <StepName
            userName={userName}
            onChange={setUserName}
            onNext={goNext}
            t={t}
          />
        )}
        {step === 2 && (
          <StepUseCases
            selected={useCases}
            onToggle={toggleUseCase}
            useCases={USE_CASES}
            t={t}
          />
        )}
        {step === 3 && (
          <StepTone
            selected={tone}
            onSelect={setTone}
            tones={TONES}
            t={t}
          />
        )}
        {step === 4 && (
          <StepTheme
            selected={theme}
            onSelect={setTheme}
            themes={THEMES}
            t={t}
          />
        )}
        {step === 5 && (
          <StepLanguage
            selected={language}
            onSelect={handleLanguageChange}
            languages={LANGUAGES}
            t={t}
          />
        )}
        {step === 6 && (
          <StepWelcome
            userName={userName}
            useCases={useCases}
            tone={tone}
            theme={theme}
            language={language}
            onComplete={handleComplete}
            languages={LANGUAGES}
            t={t}
          />
        )}
      </div>

      {/* Navigation */}
      {step < 6 && (
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
          <div className="flex gap-2">
            {step > 1 && step < 6 && (
              <button onClick={goBack} className="harbor-btn-ghost flex-shrink-0 px-4">
                {t('onboarding.back')}
              </button>
            )}
            <button
              onClick={step === 1 ? (userName.trim() ? goNext : undefined) : goNext}
              className="harbor-btn-primary flex-1"
            >
              {step === 5 ? t('onboarding.almost_done') : t('onboarding.continue')}
            </button>
          </div>
          {step < 6 && (
            <button
              onClick={goNext}
              className="w-full text-center text-[11px] mt-2"
              style={{ color: 'rgb(var(--harbor-text-faint))' }}
            >
              {t('onboarding.skip')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step Components ───────────────────────────────────────────────────────────

function StepName({ userName, onChange, onNext, t }: any) {
  return (
    <div className="flex flex-col gap-5 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          {t('onboarding.name')}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          {t('onboarding.nameHint')}
        </p>
      </div>
      <input
        type="text"
        value={userName}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onNext()}
        placeholder={t('onboarding.namePlaceholder')}
        className="harbor-input"
        autoFocus
        maxLength={40}
      />
    </div>
  )
}

function StepUseCases({ selected, onToggle, useCases, t }: any) {
  return (
    <div className="flex flex-col gap-4 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          {t('onboarding.useCases')}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          {t('onboarding.useCasesHint')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {useCases.map((uc: any) => {
          const isSelected = selected.includes(uc.id)
          return (
            <button
              key={uc.id}
              onClick={() => onToggle(uc.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 hover:scale-105"
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

function StepTone({ selected, onSelect, tones, t }: any) {
  return (
    <div className="flex flex-col gap-4 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          {t('onboarding.tone')}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          {t('onboarding.toneHint')}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {tones.map((tone: any) => {
          const isSelected = selected === tone.id
          return (
            <button
              key={tone.id}
              onClick={() => onSelect(tone.id)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all duration-150 hover:scale-105"
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
                <p className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{tone.label}</p>
                <p className="text-[11px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{tone.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepTheme({ selected, onSelect, themes, t }: any) {
  return (
    <div className="flex flex-col gap-4 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          {t('onboarding.appearance')}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          {t('onboarding.appearanceHint')}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((theme: any) => {
          const isSelected = selected === theme.id
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-150 hover:scale-105"
              style={{
                background: isSelected ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                borderColor: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
              }}
            >
              <div
                className="w-10 h-7 rounded-lg border"
                style={{
                  background: theme.id === 'light' ? '#f9f8f4' : theme.id === 'dark' ? '#07070e' : 'linear-gradient(135deg, #f9f8f4 50%, #07070e 50%)',
                  borderColor: 'rgb(var(--harbor-border))',
                }}
              />
              <span className="text-[11px] font-medium" style={{ color: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))' }}>
                {theme.label}
              </span>
            </button>
          )
        })}
      </div>
      {themes.map((t: any) => t.id === selected && (
        <p key={t.id} className="text-[11px] text-center" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          {t.description}
        </p>
      ))}
    </div>
  )
}

function StepLanguage({ selected, onSelect, languages, t }: any) {
  return (
    <div className="flex flex-col gap-4 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          {t('onboarding.language')}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          {t('onboarding.languageHint')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {languages.map((lang: any) => {
          const isSelected = selected === lang.code
          return (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 hover:scale-105"
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
  userName, useCases, tone, theme, language, onComplete, languages, t,
}: any) {
  const name = userName.trim()
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center animate-onboard-reveal">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center animate-bounce-slow"
          style={{ background: 'rgb(var(--harbor-accent-light))' }}
        >
          <Check size={24} style={{ color: 'rgb(var(--harbor-accent))' }} />
        </div>
        <div>
          <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
            {name ? t('onboarding.welcome_step', { name }) : t('onboarding.welcome_alt')}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            {t('onboarding.welcome_ready')}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div
        className="w-full rounded-2xl p-4 border text-left"
        style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}
      >
        <p className="harbor-section-label mb-3">{t('onboarding.setup_summary')}</p>
        <div className="flex flex-col gap-2">
          {name && (
            <div className="flex justify-between text-xs">
              <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.name_label')}</span>
              <span style={{ color: 'rgb(var(--harbor-text))' }}>{name}</span>
            </div>
          )}
          {useCases.length > 0 && (
            <div className="flex justify-between text-xs">
              <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.focus_areas')}</span>
              <span style={{ color: 'rgb(var(--harbor-text))' }}>{useCases.length} selected</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.tone_label')}</span>
            <span style={{ color: 'rgb(var(--harbor-text))' }} className="capitalize">{tone}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.theme_label')}</span>
            <span style={{ color: 'rgb(var(--harbor-text))' }} className="capitalize">{theme}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.language_label')}</span>
            <span style={{ color: 'rgb(var(--harbor-text))' }}>
              {languages.find((l: any) => l.code === language)?.label ?? language}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
        {t('onboarding.settings_adjustable')}
      </p>

      <button onClick={onComplete} className="harbor-btn-primary w-full text-base hover:scale-105 transition-transform">
        {t('onboarding.start_using')}
      </button>
    </div>
  )
}
