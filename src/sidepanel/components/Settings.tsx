import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Eye, EyeOff, ExternalLink, Info, Check,
  Palette, User, Brain, Cpu,
  Shield, HelpCircle, Keyboard, ChevronLeft, ChevronRight, Save, Command, Plus,
} from 'lucide-react'
import type {
  AgentSettings, ProviderName, IdentitySettings, ToneStyle, VerbosityLevel,
} from '../../shared/types'
import { DEFAULT_MODELS, PROVIDER_LABELS } from '../../shared/constants'
import ConfirmDialog from './ConfirmDialog'
import ModelPresets from './ModelPresets'

interface Props {
  settings: AgentSettings
  theme: 'light' | 'dark' | 'system'
  identity?: IdentitySettings
  onSave: (settings: AgentSettings, theme: 'light' | 'dark' | 'system', identity?: IdentitySettings) => void
  onBack: () => void
}

type SettingsSection =
  | 'provider'
  | 'appearance'
  | 'identity'
  | 'memory'
  | 'privacy'
  | 'help'
  | 'about'

const NAV_ITEMS: { id: SettingsSection; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'provider',   label: 'General',    icon: Cpu },
  { id: 'appearance', label: 'Appearance',  icon: Palette },
  { id: 'identity',   label: 'Identity',    icon: User },
  { id: 'memory',     label: 'Memory',      icon: Brain },
  { id: 'privacy',    label: 'Privacy',     icon: Shield },
  { id: 'help',       label: 'Help',        icon: HelpCircle },
  { id: 'about',      label: 'About',       icon: Info },
]

const KEY_LINKS: Partial<Record<ProviderName, string>> = {
  anthropic:  'https://console.anthropic.com/settings/keys',
  openai:     'https://platform.openai.com/api-keys',
  google:     'https://aistudio.google.com/app/apikey',
  openrouter: 'https://openrouter.ai/settings/keys',
  poe:        'https://poe.com/api_key',
}

const THEME_OPTIONS = [
  { value: 'light' as const,  label: 'Light' },
  { value: 'dark' as const,   label: 'Dark' },
  { value: 'system' as const, label: 'Auto' },
]

const TONES: { id: ToneStyle; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly',     label: 'Friendly' },
  { id: 'concise',      label: 'Concise' },
  { id: 'detailed',     label: 'Detailed' },
  { id: 'playful',      label: 'Playful' },
]

const VERBOSITY: { id: VerbosityLevel; label: string; description: string }[] = [
  { id: 'brief',    label: 'Brief',    description: 'Short, focused answers' },
  { id: 'balanced', label: 'Balanced', description: 'Standard level of detail' },
  { id: 'thorough', label: 'Thorough', description: 'In-depth explanations' },
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

export default function Settings({ settings, theme, identity, onSave, onBack }: Props) {
  const { t, i18n } = useTranslation()

  const [activeSection, setActiveSection] = useState<SettingsSection>('provider')
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [showPresets, setShowPresets] = useState(false)

  // Provider / Models - with per-provider model storage
  const [provider, setProvider]       = useState<ProviderName>(settings.provider.provider as ProviderName)
  const [modelsByProvider, setModelsByProvider] = useState<Record<ProviderName, string>>({
    anthropic: settings.provider.provider === 'anthropic' ? settings.provider.model : '',
    openai: settings.provider.provider === 'openai' ? settings.provider.model : '',
    google: settings.provider.provider === 'google' ? settings.provider.model : '',
    ollama: settings.provider.provider === 'ollama' ? settings.provider.model : '',
    openrouter: settings.provider.provider === 'openrouter' ? settings.provider.model : '',
    'openai-compatible': settings.provider.provider === 'openai-compatible' ? settings.provider.model : '',
    poe: settings.provider.provider === 'poe' ? settings.provider.model : '',
    'harbor-free': settings.provider.provider === 'harbor-free' ? settings.provider.model : '',
  })
  const [apiKey, setApiKey]           = useState(settings.provider.apiKey ?? '')
  const [baseUrl, setBaseUrl]         = useState(settings.provider.baseUrl ?? '')
  const [enableMemory, setEnableMemory] = useState(settings.enableMemory ?? true)
  const [showKey, setShowKey]         = useState(false)

  // Get model for current provider
  const model = modelsByProvider[provider]
  const handleModelChange = (newModel: string) => {
    setModelsByProvider(prev => ({ ...prev, [provider]: newModel }))
  }

  // Appearance
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(theme)

  // Identity
  const [userName, setUserName]         = useState(identity?.userName ?? '')
  const [tone, setTone]                 = useState<ToneStyle>(identity?.tone ?? 'friendly')
  const [verbosity, setVerbosity]       = useState<VerbosityLevel>(identity?.verbosity ?? 'balanced')
  const [language, setLanguage]         = useState(identity?.language ?? 'en')
  const [useEmoji, setUseEmoji]         = useState(identity?.useEmoji ?? false)
  const [customPersonality, setCustomPersonality] = useState(identity?.customPersonality ?? '')

  const needsKey = provider !== 'ollama' && provider !== 'harbor-free'
  const needsUrl = provider === 'ollama' || provider === 'openai-compatible'
  const keyLink  = KEY_LINKS[provider]

  // Sync props to state ONLY on mount (not on every prop change)
  useEffect(() => {
    setProvider(settings.provider.provider as ProviderName)
    setApiKey(settings.provider.apiKey ?? '')
    setBaseUrl(settings.provider.baseUrl ?? '')
    setEnableMemory(settings.enableMemory ?? true)
    setCurrentTheme(theme)
    setUserName(identity?.userName ?? '')
    setTone(identity?.tone ?? 'friendly')
    setVerbosity(identity?.verbosity ?? 'balanced')
    setLanguage(identity?.language ?? 'en')
    setUseEmoji(identity?.useEmoji ?? false)
    setCustomPersonality(identity?.customPersonality ?? '')
    setModelsByProvider({
      anthropic: settings.provider.provider === 'anthropic' ? settings.provider.model : '',
      openai: settings.provider.provider === 'openai' ? settings.provider.model : '',
      google: settings.provider.provider === 'google' ? settings.provider.model : '',
      ollama: settings.provider.provider === 'ollama' ? settings.provider.model : '',
      openrouter: settings.provider.provider === 'openrouter' ? settings.provider.model : '',
      'openai-compatible': settings.provider.provider === 'openai-compatible' ? settings.provider.model : '',
      poe: settings.provider.provider === 'poe' ? settings.provider.model : '',
      'harbor-free': settings.provider.provider === 'harbor-free' ? settings.provider.model : '',
    })
  }, [])

  useEffect(() => {
    if (provider === 'ollama' && !baseUrl)             setBaseUrl('http://localhost:11434')
    else if (provider === 'openai-compatible' && !baseUrl) setBaseUrl('http://localhost:1234/v1')
  }, [provider])

  // Apply language changes globally
  useEffect(() => {
    console.log('[Settings] Language changed to:', language)
    i18n.changeLanguage(language).catch(err => console.error('[Settings] i18n.changeLanguage failed:', err))
  }, [language, i18n])

  const handleProviderChange = (p: ProviderName) => {
    setProvider(p)
  }

  // Auto-save: debounced 500ms after any change (not on initial mount)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const lastSavedStateRef = useRef<string>('')

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }

    // Create a snapshot of current state
    const currentState = JSON.stringify({
      provider, model, apiKey, baseUrl, enableMemory, currentTheme,
      userName, tone, verbosity, language, useEmoji, customPersonality,
    })

    // Only proceed if state actually changed
    if (currentState === lastSavedStateRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      try {
        const newSettings: AgentSettings = {
          provider: { provider, model: provider === 'harbor-free' ? 'minimaxai/minimax-m2.5' : model, apiKey: apiKey || undefined, baseUrl: baseUrl || undefined },
          enableMemory,
          enableScreenshots: true,
        }
        const newIdentity: IdentitySettings = {
          userName: userName.trim() || undefined,
          useCases: identity?.useCases ?? [],
          tone,
          verbosity,
          language,
          useEmoji,
          customPersonality: customPersonality.trim() || undefined,
        }
        await chrome.runtime.sendMessage({ type: 'save_settings', settings: newSettings, theme: currentTheme, identity: newIdentity })
        lastSavedStateRef.current = currentState
        onSave(newSettings, currentTheme, newIdentity)
        setSavedIndicator(true)
        setTimeout(() => setSavedIndicator(false), 1500)
      } catch (err) {
        console.error('Settings save failed:', err)
      }
    }, 500)
  }, [provider, modelsByProvider, apiKey, baseUrl, enableMemory, currentTheme, userName, tone, verbosity, language, useEmoji, customPersonality, identity, model, onSave])

  const handleApplyPreset = (presetSettings: AgentSettings) => {
    // Apply preset settings to current state
    setProvider(presetSettings.provider.provider as ProviderName)
    setModelsByProvider((prev) => ({
      ...prev,
      [presetSettings.provider.provider]: presetSettings.provider.model,
    }))
    if (presetSettings.provider.apiKey) setApiKey(presetSettings.provider.apiKey)
    if (presetSettings.provider.baseUrl) setBaseUrl(presetSettings.provider.baseUrl)
    if (presetSettings.enableMemory !== undefined) setEnableMemory(presetSettings.enableMemory)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'provider':
        return <SectionGeneral
          provider={provider} model={model}
          apiKey={apiKey} baseUrl={baseUrl} enableMemory={enableMemory}
          showKey={showKey} needsKey={needsKey} needsUrl={needsUrl} keyLink={keyLink}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          onApiKeyChange={setApiKey} onBaseUrlChange={setBaseUrl}
          onEnableMemoryChange={setEnableMemory}
          onShowKeyToggle={() => setShowKey((v) => !v)}
          showPresets={showPresets} setShowPresets={setShowPresets}
          currentSettings={{
            provider: { provider, model: provider === 'harbor-free' ? 'minimaxai/minimax-m2.5' : model, apiKey: apiKey || undefined, baseUrl: baseUrl || undefined },
            enableMemory,
            enableScreenshots: true,
          }}
          onApplyPreset={handleApplyPreset}
        />
      case 'appearance':
        return <SectionAppearance currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
      case 'identity':
        return <SectionIdentity
          userName={userName} tone={tone} verbosity={verbosity}
          language={language} useEmoji={useEmoji} customPersonality={customPersonality}
          onUserNameChange={setUserName} onToneChange={setTone}
          onVerbosityChange={setVerbosity} onLanguageChange={setLanguage}
          onUseEmojiChange={setUseEmoji} onCustomPersonalityChange={setCustomPersonality}
        />
      case 'memory':
        return <SectionMemory enableMemory={enableMemory} onEnableMemoryChange={setEnableMemory} />
      case 'privacy':
        return <SectionPrivacy />
      case 'help':
        return <SectionHelp />
      case 'about':
        return <SectionAbout />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        <button onClick={onBack} className="icon-btn flex-shrink-0">
          <ArrowLeft size={15} />
        </button>
        <h2 className="font-semibold text-sm flex-1" style={{ color: 'rgb(var(--harbor-text))' }}>{t('settings.title')}</h2>
        {savedIndicator && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-500 animate-fade-in">
            <Check size={11} /> Saved
          </span>
        )}
      </div>

      {/* Horizontal tab bar with small-screen scroll navigation */}
      <SettingsTabBar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Section content */}
      <div className="flex-1 overflow-y-auto harbor-scroll animate-fade-in">
        {renderSection()}
      </div>
    </div>
  )
}

// ─── Settings Tab Bar with Small Screen Navigation ────────────────────────────

function SettingsTabBar({ activeSection, onSectionChange }: {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
}) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current
      // Add more buffer (10px) to prevent off-by-one jittering
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }, [])

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      // Scroll by multiple tab items (more noticeable movement)
      const scrollAmount = 460 // Approximately 6-7 tab items worth
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
      // Check scroll state after smooth animation completes
      setTimeout(checkScroll, 500)
    }
  }

  return (
    <div className="flex border-b flex-shrink-0" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="p-1 flex-shrink-0"
          style={{ color: 'rgb(var(--harbor-text-muted))' }}
        >
          <ChevronLeft size={14} />
        </button>
      )}
      <div
        ref={tabsRef}
        className="flex border-b overflow-x-auto flex-1"
        style={{ scrollbarWidth: 'none' }}
        onScroll={checkScroll}
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap flex-shrink-0 border-b-2"
            style={{
              borderBottomColor: activeSection === id ? 'rgb(var(--harbor-accent))' : 'transparent',
              color: activeSection === id ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))',
              background: 'transparent',
              transition: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="p-1 flex-shrink-0"
          style={{ color: 'rgb(var(--harbor-text-muted))' }}
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Section: General ─────────────────────────────────────────────────────────

function SectionGeneral({
  provider, model, apiKey, baseUrl, enableMemory, showKey,
  needsKey, needsUrl, keyLink,
  onProviderChange, onModelChange, onApiKeyChange, onBaseUrlChange,
  onEnableMemoryChange, onShowKeyToggle,
  showPresets, setShowPresets, currentSettings, onApplyPreset,
}: any) {
  return (
    <div className="px-4 py-4 flex flex-col gap-4 relative">
      <SectionHeader title="General" />

      {/* Provider */}
      <FormField label="Provider">
        <select
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as ProviderName)}
          className="harbor-input text-xs"
        >
          {Object.entries(PROVIDER_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </FormField>

      {/* Model - hidden in Harbor Free */}
      {provider !== 'harbor-free' && (
        <FormField label="Model">
          <input
            type="text"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="Enter model ID (e.g., gpt-4o, claude-opus-4-5)"
            className="harbor-input text-xs font-mono"
          />
        </FormField>
      )}

      {/* API Key */}
      {needsKey && (
        <FormField
          label="API Key"
          rightSlot={keyLink && (
            <a href={keyLink} target="_blank" rel="noopener noreferrer"
               className="text-[11px] flex items-center gap-1"
               style={{ color: 'rgb(var(--harbor-accent))' }}>
              Get key <ExternalLink size={9} />
            </a>
          )}
        >
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder={`${PROVIDER_LABELS[provider] ?? provider} API key`}
              className="harbor-input text-xs font-mono pr-9"
            />
            <button
              onClick={onShowKeyToggle}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'rgb(var(--harbor-text-faint))' }}
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Stored locally, never shared.
          </p>
        </FormField>
      )}

      {/* Base URL */}
      {needsUrl && (
        <FormField label="Base URL">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => onBaseUrlChange(e.target.value)}
            placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1'}
            className="harbor-input text-xs font-mono"
          />
        </FormField>
      )}

      {/* Ollama / Harbor Free hints */}
      {provider === 'ollama' && (
        <InfoBox>
          Run Ollama with{' '}
          <code className="font-mono text-[10px] px-1 rounded" style={{ background: 'rgb(var(--harbor-surface-3))' }}>
            OLLAMA_ORIGINS=*
          </code>{' '}
          for browser access.
        </InfoBox>
      )}
      {provider === 'harbor-free' && (
        <InfoBox>
          No API key needed. Uses MiniMax-m2.5 for text and auto-switches to Qwen3.5-122B when images or video are attached.
        </InfoBox>
      )}

      {/* Memory toggle */}
      <ToggleRow
        label="Enable Memory"
        description="Persist context across conversations"
        value={enableMemory}
        onChange={onEnableMemoryChange}
      />

      {/* Save / Manage Model Presets Button */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[rgb(var(--harbor-border))]">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex-1 px-4 py-3 rounded-xl border border-[rgb(var(--harbor-border))] hover:bg-[rgb(var(--harbor-surface-2))] transition font-medium text-sm flex items-center justify-center gap-2"
          style={{ color: 'rgb(var(--harbor-text))' }}
          title="Save current model configuration as a preset for quick access"
        >
          <Save size={14} />
          Save Model Preset
        </button>
      </div>

      {/* Model Presets Dropdown */}
      {showPresets && currentSettings && (
        <ModelPresets
          currentSettings={currentSettings}
          onSelectPreset={onApplyPreset}
          onClose={() => setShowPresets(false)}
        />
      )}
    </div>
  )
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

function ShortcutRecorder({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [recording, setRecording] = useState(false)
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (recording) divRef.current?.focus()
  }, [recording])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Escape') { setRecording(false); return }

    const modifiers = []
    if (e.ctrlKey) modifiers.push('Ctrl')
    if (e.metaKey) modifiers.push('Cmd')
    if (e.shiftKey) modifiers.push('Shift')
    if (e.altKey) modifiers.push('Alt')

    const mainKey = e.key
    const isModifierOnly = ['Control', 'Shift', 'Alt', 'Meta'].includes(mainKey)
    if (isModifierOnly || modifiers.length === 0) return

    const shortcut = [...modifiers, mainKey.toUpperCase()].join('+')
    onChange(shortcut)
    setRecording(false)
  }

  return (
    <div className="flex items-center gap-2">
      <div
        ref={divRef}
        tabIndex={recording ? 0 : -1}
        onKeyDown={recording ? handleKeyDown : undefined}
        onBlur={() => setRecording(false)}
        className="flex-1 harbor-input text-xs font-mono flex items-center gap-1.5 cursor-default select-none"
        style={{
          borderColor: recording ? 'rgb(var(--harbor-accent))' : undefined,
          boxShadow: recording ? '0 0 0 3px rgb(var(--harbor-accent) / 0.12)' : undefined,
          color: recording ? 'rgb(var(--harbor-text-faint))' : 'rgb(var(--harbor-text))',
        }}
      >
        {recording ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            Press shortcut…
          </>
        ) : (
          <>
            <Keyboard size={11} style={{ color: 'rgb(var(--harbor-text-faint))', flexShrink: 0 }} />
            {value || 'None'}
          </>
        )}
      </div>
      <button
        onClick={() => setRecording((v) => !v)}
        className="text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors"
        style={{
          borderColor: recording ? 'rgb(var(--harbor-accent) / 0.4)' : 'rgb(var(--harbor-border))',
          color: recording ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))',
          background: recording ? 'rgb(var(--harbor-accent-light))' : 'transparent',
        }}
      >
        {recording ? 'Cancel' : 'Set'}
      </button>
    </div>
  )
}

function SectionAppearance({ currentTheme, onThemeChange }: {
  currentTheme: 'light' | 'dark' | 'system'
  onThemeChange: (t: 'light' | 'dark' | 'system') => void
}) {
  const [shortcut, setShortcut] = useState('Ctrl+Alt+H')
  const [fontSize, setFontSize] = useState<'xs' | 'sm' | 'base' | 'lg' | 'xl'>('base')
  const [compactMode, setCompactMode] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['harbor_keybindings', 'harbor_appearance'], (data) => {
      if (data.harbor_keybindings?.commandPalette) {
        setShortcut(data.harbor_keybindings.commandPalette as string)
      }
      if (data.harbor_appearance) {
        setFontSize(data.harbor_appearance.fontSize || 'base')
        setCompactMode(data.harbor_appearance.compactMode || false)
      }
    })
  }, [])

  const handleShortcutChange = (s: string) => {
    setShortcut(s)
    chrome.storage.local.set({ harbor_keybindings: { commandPalette: s } })
  }

  const handleFontSizeChange = (size: typeof fontSize) => {
    setFontSize(size)
    chrome.storage.local.get('harbor_appearance', (data) => {
      chrome.storage.local.set({
        harbor_appearance: {
          ...(data.harbor_appearance || {}),
          fontSize: size,
        },
      })
    })
  }

  const handleCompactModeChange = (compact: boolean) => {
    setCompactMode(compact)
    chrome.storage.local.get('harbor_appearance', (data) => {
      chrome.storage.local.set({
        harbor_appearance: {
          ...(data.harbor_appearance || {}),
          compactMode: compact,
        },
      })
    })
  }

  const fontSizeOptions = [
    { value: 'xs' as const, label: 'Extra Small' },
    { value: 'sm' as const, label: 'Small' },
    { value: 'base' as const, label: 'Normal' },
    { value: 'lg' as const, label: 'Large' },
    { value: 'xl' as const, label: 'Extra Large' },
  ]

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <SectionHeader title="Appearance" />

      <FormField label="Theme">
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onThemeChange(value)}
              className="py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
              style={{
                borderColor: currentTheme === value ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
                background: currentTheme === value ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                color: currentTheme === value ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))',
              }}
            >
              {currentTheme === value && <Check size={10} />}
              {label}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Font Size">
        <div className="grid grid-cols-2 gap-2">
          {fontSizeOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFontSizeChange(value)}
              className="py-2 px-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 h-10"
              style={{
                borderColor: fontSize === value ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
                background: fontSize === value ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
                color: fontSize === value ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))',
              }}
            >
              {fontSize === value && <Check size={10} className="flex-shrink-0" />}
              {label}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Compact Mode">
        <button
          onClick={() => handleCompactModeChange(!compactMode)}
          className="py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center gap-2"
          style={{
            borderColor: compactMode ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
            background: compactMode ? 'rgb(var(--harbor-accent-light))' : 'rgb(var(--harbor-surface))',
            color: compactMode ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-text-muted))',
          }}
        >
          {compactMode && <Check size={10} />}
          {compactMode ? 'Enabled' : 'Disabled'} - Reduces spacing between messages
        </button>
      </FormField>
    </div>
  )
}

// ─── Section: Identity ────────────────────────────────────────────────────────

function SectionIdentity({ userName, tone, verbosity, language, useEmoji, customPersonality,
  onUserNameChange, onToneChange, onVerbosityChange, onLanguageChange, onUseEmojiChange, onCustomPersonalityChange }: any) {
  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <SectionHeader title="Identity" description="Customize how Harbor speaks to you." />

      <FormField label="Your Name">
        <input
          type="text"
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder="Optional — for personalized greetings"
          className="harbor-input text-xs"
          maxLength={40}
        />
      </FormField>

      <FormField label="Communication Tone">
        <div className="flex flex-col gap-1.5">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => onToneChange(t.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all"
              style={{
                borderColor: tone === t.id ? 'rgb(var(--harbor-accent) / 0.5)' : 'rgb(var(--harbor-border))',
                background: tone === t.id ? 'rgb(var(--harbor-accent-light))' : 'transparent',
              }}
            >
              <div
                className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                style={{
                  borderColor: tone === t.id ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border-2))',
                  background: tone === t.id ? 'rgb(var(--harbor-accent))' : 'transparent',
                }}
              />
              <span className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Response Length">
        <div className="flex flex-col gap-1.5">
          {VERBOSITY.map((v) => (
            <button
              key={v.id}
              onClick={() => onVerbosityChange(v.id)}
              className="flex items-start gap-2.5 px-3 py-2 rounded-lg border text-left transition-all"
              style={{
                borderColor: verbosity === v.id ? 'rgb(var(--harbor-accent) / 0.5)' : 'rgb(var(--harbor-border))',
                background: verbosity === v.id ? 'rgb(var(--harbor-accent-light))' : 'transparent',
              }}
            >
              <div
                className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5"
                style={{
                  borderColor: verbosity === v.id ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border-2))',
                  background: verbosity === v.id ? 'rgb(var(--harbor-accent))' : 'transparent',
                }}
              />
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{v.label}</p>
                <p className="text-[11px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{v.description}</p>
              </div>
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Language">
        <select
          value={language}
          onChange={(e) => {
            console.log('[SectionIdentity] Dropdown changed to:', e.target.value)
            onLanguageChange(e.target.value)
          }}
          className="harbor-input text-xs"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </FormField>

      <ToggleRow
        label="Use Emoji"
        description="Include emoji in responses"
        value={useEmoji}
        onChange={onUseEmojiChange}
      />

      <FormField label="Custom Personality">
        <textarea
          value={customPersonality}
          onChange={(e) => onCustomPersonalityChange(e.target.value)}
          placeholder="Add extra instructions for Harbor (optional)…"
          className="harbor-input text-xs resize-none min-h-[80px]"
          maxLength={500}
        />
        <p className="text-[10px] mt-1 text-right" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          {customPersonality.length}/500
        </p>
      </FormField>
    </div>
  )
}

// ─── Section: Models (advanced) ───────────────────────────────────────────────

function SectionModels({ provider, model, customModel, apiKey, baseUrl, showKey,
  models, needsKey, needsUrl, keyLink,
  onProviderChange, onModelChange, onCustomModelChange, onApiKeyChange, onBaseUrlChange, onShowKeyToggle }: any) {
  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <SectionHeader title="Models" description="Configure AI provider and model settings." />
      <SectionGeneral
        provider={provider} model={model} customModel={customModel}
        apiKey={apiKey} baseUrl={baseUrl} maxTokens={8192} enableMemory={false} showKey={showKey}
        models={models} needsKey={needsKey} needsUrl={needsUrl} keyLink={keyLink}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange} onCustomModelChange={onCustomModelChange}
        onApiKeyChange={onApiKeyChange} onBaseUrlChange={onBaseUrlChange}
        onMaxTokensChange={() => {}} onEnableMemoryChange={() => {}}
        onShowKeyToggle={onShowKeyToggle}
      />
    </div>
  )
}

// ─── Section: Memory ──────────────────────────────────────────────────────────

function SectionMemory({ enableMemory, onEnableMemoryChange }: { enableMemory: boolean; onEnableMemoryChange: (v: boolean) => void }) {
  const [memoryCount, setMemoryCount] = useState(0)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    chrome.storage.local.get('harbor_memory_entries', (data) => {
      setMemoryCount((data.harbor_memory_entries as unknown[])?.length ?? 0)
    })
  }, [])

  const clearMemory = () => {
    chrome.storage.local.remove('harbor_memory_entries', () => {
      setMemoryCount(0)
      setShowClearConfirm(false)
    })
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <SectionHeader title="Memory" description="Control how Harbor remembers things." />

      <ToggleRow
        label="Enable Memory"
        description="Remember context across conversations"
        value={enableMemory}
        onChange={onEnableMemoryChange}
      />

      <div
        className="flex items-center justify-between px-3 py-3 rounded-xl border"
        style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}
      >
        <div>
          <p className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>Stored memories</p>
          <p className="text-[11px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            {memoryCount} entr{memoryCount === 1 ? 'y' : 'ies'}
          </p>
        </div>
        {memoryCount > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs px-2.5 py-1 rounded-lg"
            style={{ color: '#ef4444', border: '1px solid rgb(239 68 68 / 0.3)' }}
          >
            Clear all
          </button>
        )}
      </div>
      {showClearConfirm && (
        <ConfirmDialog
          title="Clear all memories"
          description="All stored memories will be permanently deleted. This cannot be undone."
          confirmText="Clear memories"
          isDangerous
          onConfirm={clearMemory}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  )
}

// ─── Section: Notifications ───────────────────────────────────────────────────

function SectionNotifications({ enabled, agentComplete, errors, onEnabledChange, onAgentCompleteChange, onErrorsChange }: any) {
  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <SectionHeader title="Notifications" />
      <ToggleRow label="Enable Notifications" description="Show in-app alerts" value={enabled} onChange={onEnabledChange} />
      {enabled && (
        <>
          <ToggleRow label="Task Complete" description="When an agent task finishes" value={agentComplete} onChange={onAgentCompleteChange} />
          <ToggleRow label="Errors" description="When something goes wrong" value={errors} onChange={onErrorsChange} />
        </>
      )}
    </div>
  )
}

// ─── Section: Privacy ─────────────────────────────────────────────────────────

function SectionPrivacy() {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const clearAll = () => {
    chrome.storage.local.clear(() => window.location.reload())
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <SectionHeader title="Privacy" />
      <InfoBox>
        Harbor processes everything locally or via the AI API you configure.
        No data is sent to Harbor's servers. Your conversations and memories stay in your browser.
      </InfoBox>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="text-xs px-3 py-2.5 rounded-xl border font-medium"
          style={{ color: '#ef4444', borderColor: 'rgb(239 68 68 / 0.3)', background: 'rgb(239 68 68 / 0.05)' }}
        >
          Reset all data
        </button>
      </div>
      {showResetConfirm && (
        <ConfirmDialog
          title="Reset all Harbor data"
          description="This will permanently erase your settings, memory entries, and all conversations. This cannot be undone."
          confirmText="Reset everything"
          isDangerous
          onConfirm={clearAll}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}

// ─── Section: Help ────────────────────────────────────────────────────────────

function SectionHelp() {
  const shortcuts = [
    { keys: ['Ctrl', 'Shift', 'Y'], mac: ['Cmd', 'Shift', 'Y'], action: 'Open Harbor' },
    { keys: ['Enter'], mac: ['Enter'], action: 'Send message' },
    { keys: ['Shift', 'Enter'], mac: ['Shift', 'Enter'], action: 'New line' },
    { keys: ['Escape'], mac: ['Escape'], action: 'Close dialog' },
  ]

  const tips = [
    { title: 'Agent vs Chat', desc: 'Use Agent mode to automate tasks, Chat mode for discussions.' },
    { title: 'Memory System', desc: 'Link conversations to your memory for better context across chats.' },
    { title: 'Model Presets', desc: 'Save your favorite model configs for instant switching in Settings.' },
    { title: 'Pin Important Chats', desc: 'Keep important conversations at the top for quick access.' },
    { title: 'Export Conversations', desc: 'Download any chat as Markdown for archiving or sharing.' },
  ]

  return (
    <div className="px-4 py-4 flex flex-col gap-6">
      <SectionHeader title="Help & Tips" description="Keyboard shortcuts and usage tips" />

      {/* Keyboard Shortcuts */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          Keyboard Shortcuts
        </p>
        <div className="space-y-2">
          {shortcuts.map(({ keys, mac, action }) => (
            <div key={action} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgb(var(--harbor-surface))' }}>
              <span className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>{action}</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                      style={{
                        borderColor: 'rgb(var(--harbor-border))',
                        background: 'rgb(var(--harbor-surface-2))',
                        color: 'rgb(var(--harbor-text-faint))',
                      }}
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          Pro Tips
        </p>
        <div className="space-y-2">
          {tips.map(({ title, desc }) => (
            <div key={title} className="p-3 rounded-lg border" style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}>
              <p className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{title}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation Link */}
      <a
        href="https://docs.harborbrowser.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-colors"
        style={{
          borderColor: 'rgb(var(--harbor-border))',
          color: 'rgb(var(--harbor-accent))',
          background: 'rgb(var(--harbor-surface-2))',
        }}
      >
        <Info size={13} /> Read Full Documentation
      </a>
    </div>
  )
}

// ─── Section: About ───────────────────────────────────────────────────────────

function SectionAbout() {
  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <SectionHeader title="About" />
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl border"
          style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}
        >
          <img src="/icons/logo.png" alt="Harbor" className="w-10 h-10 rounded-xl" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>Harbor</p>
            <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>v1.24.0 — AI Browser Agent</p>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          An open-source AI browser agent. Licensed under MIT.
        </p>
        <a
          href="https://github.com/owenawsong/Harbor-Extension"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs"
          style={{ color: 'rgb(var(--harbor-accent))' }}
        >
          <ExternalLink size={11} /> View on GitHub
        </a>
      </div>
    </div>
  )
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>{title}</h3>
      {description && (
        <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{description}</p>
      )}
    </div>
  )
}

function FormField({ label, children, rightSlot }: {
  label: React.ReactNode
  children: React.ReactNode
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          {label}
        </label>
        {rightSlot}
      </div>
      {children}
    </div>
  )
}

function ToggleRow({ label, description, value, onChange }: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>{label}</p>
        {description && (
          <p className="text-[11px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="harbor-toggle flex-shrink-0"
        style={{ background: value ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border-2))' }}
      >
        <div
          className="harbor-toggle-thumb"
          style={{ transform: value ? 'translateX(16px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-2 px-3 py-2.5 rounded-xl border"
      style={{
        background: 'rgb(var(--harbor-accent-light))',
        borderColor: 'rgb(var(--harbor-accent) / 0.25)',
      }}
    >
      <Info size={12} style={{ color: 'rgb(var(--harbor-accent))', flexShrink: 0, marginTop: 1 }} />
      <p className="text-[11px] leading-relaxed" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
        {children}
      </p>
    </div>
  )
}
