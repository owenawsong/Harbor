import React, { useState, useEffect } from 'react'
import {
  Check, ChevronRight, ArrowLeft,
  Briefcase, Search, Code, PenTool, ShoppingCart, BookOpen, Palette, Sprout
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { OnboardingData, ToneStyle } from '../../shared/types'

interface Props {
  onComplete: (data: OnboardingData) => void
}

const TOTAL_STEPS = 8 // 0 = welcome, 1 = language, 2-7 = form steps

export default function Onboarding({ onComplete }: Props) {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)

  // Form state
  const [userName, setUserName] = useState('')
  const [useCases, setUseCases] = useState<string[]>([])
  const [tone, setTone] = useState<ToneStyle>('friendly')
  const [theme, setTheme] = useState<'system' | 'sunlight' | 'moonlight' | 'forest' | 'nebula' | 'sunset' | 'ocean'>('system')
  const [language, setLanguage] = useState(i18n.language || 'en')

  const USE_CASE_ICONS: Record<string, React.ReactNode> = {
    work: <Briefcase size={20} />,
    research: <Search size={20} />,
    coding: <Code size={20} />,
    writing: <PenTool size={20} />,
    shopping: <ShoppingCart size={20} />,
    learning: <BookOpen size={20} />,
    creative: <Palette size={20} />,
    personal: <Sprout size={20} />,
  }

  const USE_CASES = [
    { id: 'work', label: t('usecases.work') },
    { id: 'research', label: t('usecases.research') },
    { id: 'coding', label: t('usecases.coding') },
    { id: 'writing', label: t('usecases.writing') },
    { id: 'shopping', label: t('usecases.shopping') },
    { id: 'learning', label: t('usecases.learning') },
    { id: 'creative', label: t('usecases.creative') },
    { id: 'personal', label: t('usecases.personal') },
  ]

  const TONES = [
    { id: 'professional' as const, label: t('tones.professional'), description: t('tones.professional_desc') },
    { id: 'friendly' as const, label: t('tones.friendly'), description: t('tones.friendly_desc') },
    { id: 'concise' as const, label: t('tones.concise'), description: t('tones.concise_desc') },
    { id: 'detailed' as const, label: t('tones.detailed'), description: t('tones.detailed_desc') },
    { id: 'playful' as const, label: t('tones.playful'), description: t('tones.playful_desc') },
  ]

  const THEMES = [
    { id: 'sunlight' as const,  label: t('themes.sunlight'), description: t('themes.sunlight_desc') },
    { id: 'moonlight' as const, label: t('themes.moonlight'), description: t('themes.moonlight_desc') },
    { id: 'forest' as const,    label: t('themes.forest'), description: t('themes.forest_desc') },
    { id: 'nebula' as const,    label: t('themes.nebula'), description: t('themes.nebula_desc') },
    { id: 'sunset' as const,    label: t('themes.sunset'), description: t('themes.sunset_desc') },
    { id: 'ocean' as const,     label: t('themes.ocean'), description: t('themes.ocean_desc') },
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

  // Step 0: Welcome animation (dramatic, cinematic)
  if (step === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full px-6 overflow-hidden"
        style={{ background: 'rgb(var(--harbor-bg))' }}
      >
        <div className="flex flex-col items-center gap-6 text-center animate-onboard-reveal">
          {/* Animated Logo with enhanced glow */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-3xl animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgb(var(--harbor-accent) / 0.4) 0%, transparent 70%)',
                filter: 'blur(30px)',
                transform: 'scale(1.2)',
              }}
            />
            <img
              src="/icons/logo.png"
              alt="Harbor"
              className="w-28 h-28 rounded-3xl logo-glow relative"
              style={{
                animation: 'bounceInLarge 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 20px 50px rgb(var(--harbor-accent) / 0.25)',
              }}
            />
          </div>

          {/* Welcome text with staggered animation */}
          <div className="flex flex-col gap-2 animate-fade-up px-2" style={{ animationDelay: '0.2s' }}>
            <h1
              className="harbor-serif text-6xl font-light tracking-tight"
              style={{
                color: 'rgb(var(--harbor-text))',
                letterSpacing: '-0.02em',
              }}
            >
              {t('onboarding.welcome')}
            </h1>
            <p
              className="text-sm font-light tracking-wide"
              style={{ color: 'rgb(var(--harbor-accent))' }}
            >
              {t('onboarding.tagline')}
            </p>
          </div>

          <p
            className="text-sm leading-relaxed max-w-xs animate-fade-up"
            style={{ color: 'rgb(var(--harbor-text-muted))', animationDelay: '0.3s' }}
          >
            {t('onboarding.subtitle')}
          </p>

          <button
            onClick={goNext}
            className="harbor-btn-primary mt-4 px-8 py-3 hover:scale-105 transition-transform animate-fade-up text-base font-medium shadow-lg"
            style={{ animationDelay: '0.4s' }}
          >
            {t('onboarding.getStarted')}
            <ChevronRight size={18} />
          </button>

          <p
            className="text-xs animate-fade-up"
            style={{ color: 'rgb(var(--harbor-text-faint))', animationDelay: '0.5s' }}
          >
            {t('onboarding.timeEstimate')}
          </p>
        </div>

        <style>{`
          @keyframes bounceInLarge {
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
            animation: fadeUp 0.7s ease-out forwards;
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
          <StepLanguage
            selected={language}
            onSelect={handleLanguageChange}
            languages={LANGUAGES}
            t={t}
          />
        )}
        {step === 2 && (
          <StepName
            userName={userName}
            onChange={setUserName}
            onNext={goNext}
            t={t}
          />
        )}
        {step === 3 && (
          <StepUseCases
            selected={useCases}
            onToggle={toggleUseCase}
            useCases={USE_CASES}
            icons={USE_CASE_ICONS}
            t={t}
          />
        )}
        {step === 4 && (
          <StepTone
            selected={tone}
            onSelect={setTone}
            tones={TONES}
            t={t}
          />
        )}
        {step === 5 && (
          <StepTheme
            selected={theme}
            onSelect={setTheme}
            themes={THEMES}
            t={t}
          />
        )}
        {step === 6 && (
          <StepReview
            userName={userName}
            useCases={useCases}
            tone={tone}
            theme={theme}
            language={language}
            languages={LANGUAGES}
            t={t}
          />
        )}
        {step === 7 && (
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
      {step < 7 && (
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
          <div className="flex gap-2">
            {step > 1 && step < 7 && (
              <button onClick={goBack} className="harbor-btn-ghost flex-shrink-0 px-4">
                {t('onboarding.back')}
              </button>
            )}
            <button
              onClick={step === 2 ? (userName.trim() ? goNext : undefined) : goNext}
              className="harbor-btn-primary flex-1"
            >
              {step === 6 ? t('onboarding.almost_done') : t('onboarding.continue')}
            </button>
          </div>
          {step < 7 && (
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
        <p className="text-sm mt-2" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          {t('onboarding.nameHint')}
        </p>
      </div>
      <input
        type="text"
        value={userName}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onNext()}
        placeholder={t('onboarding.namePlaceholder')}
        className="harbor-input text-center text-lg py-3"
        autoFocus
        maxLength={40}
        style={{
          transition: 'all 200ms ease',
          boxShadow: userName ? '0 8px 24px rgb(var(--harbor-accent) / 0.12)' : 'none',
        }}
      />
    </div>
  )
}

function StepUseCases({ selected, onToggle, useCases, icons, t }: any) {
  return (
    <div className="flex flex-col gap-4 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          {t('onboarding.useCases')}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          {t('onboarding.useCasesHint')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {useCases.map((uc: any) => {
          const isSelected = selected.includes(uc.id)
          return (
            <button
              key={uc.id}
              onClick={() => onToggle(uc.id)}
              className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border text-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: isSelected ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                borderColor: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
                color: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))',
                boxShadow: isSelected ? '0 8px 24px rgb(var(--harbor-accent) / 0.15)' : 'none',
              }}
            >
              <div style={{ color: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))' }}>
                {icons[uc.id]}
              </div>
              <span className="text-xs font-medium leading-tight">{uc.label}</span>
              {isSelected && (
                <Check size={14} className="mt-1" />
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
        <p className="text-sm mt-2" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          {t('onboarding.toneHint')}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {tones.map((tone: any) => {
          const isSelected = selected === tone.id
          return (
            <button
              key={tone.id}
              onClick={() => onSelect(tone.id)}
              className="flex items-center gap-3 px-4 py-4 rounded-2xl border text-left transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: isSelected ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                borderColor: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
                boxShadow: isSelected ? '0 8px 24px rgb(var(--harbor-accent) / 0.15)' : 'none',
              }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                style={{
                  borderColor: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border-2))',
                  background: isSelected ? 'rgb(var(--harbor-accent))' : 'transparent',
                }}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{tone.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--harbor-text-muted))' }}>{tone.description}</p>
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
        <p className="text-sm mt-2" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          {t('onboarding.appearanceHint')}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((theme: any) => {
          const isSelected = selected === theme.id
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: isSelected ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                borderColor: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
                boxShadow: isSelected ? '0 8px 24px rgb(var(--harbor-accent) / 0.15)' : 'none',
              }}
            >
              <div
                className="w-12 h-8 rounded-lg border-2 shadow-md"
                style={{
                  background:
                    theme.id === 'sunlight' ? '#f9f8f4' :
                    theme.id === 'moonlight' ? '#07070e' :
                    theme.id === 'forest' ? '#1a3a2e' :
                    theme.id === 'nebula' ? '#1a1a2e' :
                    theme.id === 'sunset' ? '#2d1810' :
                    theme.id === 'ocean' ? '#0f2b3e' :
                    'linear-gradient(135deg, #f9f8f4 50%, #07070e 50%)',
                  borderColor: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border-2))',
                }}
              />
              <span className="text-xs font-medium" style={{ color: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))' }}>
                {theme.label}
              </span>
            </button>
          )
        })}
      </div>
      {themes.map((theme: any) => theme.id === selected && (
        <p key={theme.id} className="text-sm text-center" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          {theme.description}
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
        <p className="text-sm mt-2" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          {t('onboarding.languageHint')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang: any) => {
          const isSelected = selected === lang.code
          return (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: isSelected ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                borderColor: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
                color: isSelected ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text))',
                boxShadow: isSelected ? '0 8px 24px rgb(var(--harbor-accent) / 0.15)' : 'none',
              }}
            >
              <span className="text-sm font-medium">{lang.label}</span>
              {isSelected && <Check size={14} className="flex-shrink-0" />}
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
    <div className="flex flex-col items-center gap-8 py-4 text-center animate-onboard-reveal">
      {/* Celebration checkmark */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center animate-bounce-slow"
        style={{
          background: 'rgb(var(--harbor-accent-light))',
          boxShadow: '0 20px 50px rgb(var(--harbor-accent) / 0.25)',
        }}
      >
        <Check size={40} style={{ color: 'rgb(var(--harbor-accent))' }} />
      </div>

      {/* Celebration text */}
      <div>
        <h2 className="harbor-serif text-3xl font-light mb-2" style={{ color: 'rgb(var(--harbor-text))' }}>
          {name ? t('onboarding.welcome_step', { name }) : t('onboarding.welcome_alt')}
        </h2>
        <p className="text-sm" style={{ color: 'rgb(var(--harbor-accent))' }}>
          {t('onboarding.welcome_ready')}
        </p>
      </div>

      {/* Summary card */}
      <div
        className="w-full rounded-2xl p-5 border text-left"
        style={{
          background: 'rgb(var(--harbor-surface))',
          borderColor: 'rgb(var(--harbor-border))',
          boxShadow: '0 8px 24px rgb(var(--harbor-accent) / 0.08)',
        }}
      >
        <p className="harbor-section-label mb-4 uppercase">{t('onboarding.setup_summary')}</p>
        <div className="flex flex-col gap-3">
          {name && (
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
              <span className="text-sm" style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.name_label')}</span>
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{name}</span>
            </div>
          )}
          {useCases.length > 0 && (
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
              <span className="text-sm" style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.focus_areas')}</span>
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{useCases.length} selected</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
            <span className="text-sm" style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.tone_label')}</span>
            <span className="text-sm font-medium capitalize" style={{ color: 'rgb(var(--harbor-text))' }}>{tone}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
            <span className="text-sm" style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.theme_label')}</span>
            <span className="text-sm font-medium capitalize" style={{ color: 'rgb(var(--harbor-text))' }}>{theme}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm" style={{ color: 'rgb(var(--harbor-text-muted))' }}>{t('onboarding.language_label')}</span>
            <span className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>
              {languages.find((l: any) => l.code === language)?.label ?? language}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
        {t('onboarding.settings_adjustable')}
      </p>

      <button
        onClick={onComplete}
        className="harbor-btn-primary w-full text-base py-3 font-medium shadow-lg hover:scale-105 active:scale-95 transition-all"
      >
        {t('onboarding.start_using')}
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function StepReview({
  userName, useCases, tone, theme, language, languages, t,
}: any) {
  const name = userName.trim()
  return (
    <div className="flex flex-col gap-5 animate-step-in">
      <div>
        <h2 className="harbor-serif text-2xl font-light" style={{ color: 'rgb(var(--harbor-text))' }}>
          {t('onboarding.review')}
        </h2>
        <p className="text-sm mt-2" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          {t('onboarding.reviewHint', 'Review your settings before completing setup')}
        </p>
      </div>

      <div
        className="w-full rounded-2xl p-5 border space-y-3"
        style={{
          background: 'rgb(var(--harbor-surface))',
          borderColor: 'rgb(var(--harbor-border))',
          boxShadow: '0 8px 24px rgb(var(--harbor-accent) / 0.08)',
        }}
      >
        <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
          <span className="text-xs font-medium uppercase" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{t('onboarding.language_label')}</span>
          <span className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>
            {languages.find((l: any) => l.code === language)?.label ?? language}
          </span>
        </div>

        {name && (
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
            <span className="text-xs font-medium uppercase" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{t('onboarding.name_label')}</span>
            <span className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{name}</span>
          </div>
        )}

        {useCases.length > 0 && (
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
            <span className="text-xs font-medium uppercase" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{t('onboarding.focus_areas')}</span>
            <span className="text-sm font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{useCases.length}</span>
          </div>
        )}

        <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
          <span className="text-xs font-medium uppercase" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{t('onboarding.tone_label')}</span>
          <span className="text-sm font-medium capitalize" style={{ color: 'rgb(var(--harbor-text))' }}>{tone}</span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-xs font-medium uppercase" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{t('onboarding.theme_label')}</span>
          <span className="text-sm font-medium capitalize" style={{ color: 'rgb(var(--harbor-text))' }}>{theme}</span>
        </div>
      </div>
    </div>
  )
}
