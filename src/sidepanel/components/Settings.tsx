import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye, EyeOff, ExternalLink, Info, Check } from 'lucide-react'
import type { AgentSettings, ProviderName } from '../../shared/types'
import { DEFAULT_MODELS, PROVIDER_LABELS } from '../../shared/constants'

interface Props {
  settings: AgentSettings
  theme: 'light' | 'dark' | 'system'
  onSave: (settings: AgentSettings, theme: 'light' | 'dark' | 'system') => void
  onBack: () => void
}

const KEY_LINKS: Partial<Record<ProviderName, string>> = {
  anthropic:  'https://console.anthropic.com/settings/keys',
  openai:     'https://platform.openai.com/api-keys',
  google:     'https://aistudio.google.com/app/apikey',
  openrouter: 'https://openrouter.ai/settings/keys',
}

const THEME_OPTIONS = [
  { value: 'light' as const,  label: 'Light' },
  { value: 'dark' as const,   label: 'Dark' },
  { value: 'system' as const, label: 'Auto' },
]

export default function Settings({ settings, theme, onSave, onBack }: Props) {
  const [provider, setProvider]       = useState<ProviderName>(settings.provider.provider as ProviderName)
  const initialModels = DEFAULT_MODELS[settings.provider.provider as ProviderName] ?? []
  const isCustomModel = !initialModels.includes(settings.provider.model)
  const [model, setModel]             = useState(isCustomModel ? (initialModels[0] ?? '') : settings.provider.model)
  const [customModel, setCustomModel] = useState(isCustomModel ? settings.provider.model : '')
  const [apiKey, setApiKey]           = useState(settings.provider.apiKey ?? '')
  const [baseUrl, setBaseUrl]         = useState(settings.provider.baseUrl ?? '')
  const [maxTokens, setMaxTokens]     = useState(settings.maxTokens ?? 8192)
  const [enableMemory, setEnableMemory] = useState(settings.enableMemory ?? false)
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(theme)
  const [showKey, setShowKey]         = useState(false)
  const [status, setStatus]           = useState<'idle' | 'saving' | 'saved'>('idle')

  const models = DEFAULT_MODELS[provider] ?? []
  const needsKey = provider !== 'ollama'
  const needsUrl = provider === 'ollama' || provider === 'openai-compatible'
  const keyLink  = KEY_LINKS[provider]

  useEffect(() => {
    if (provider === 'ollama' && !baseUrl)             setBaseUrl('http://localhost:11434')
    else if (provider === 'openai-compatible' && !baseUrl) setBaseUrl('http://localhost:1234/v1')
  }, [provider])

  const handleProviderChange = (p: ProviderName) => {
    setProvider(p)
    const m = DEFAULT_MODELS[p]
    if (m?.length) setModel(m[0])
    setCustomModel('')
  }

  const handleSave = async () => {
    setStatus('saving')
    const effectiveModel = customModel.trim() || model
    const newSettings: AgentSettings = {
      provider: { provider, model: effectiveModel, apiKey: apiKey || undefined, baseUrl: baseUrl || undefined },
      maxTokens,
      enableMemory,
      enableScreenshots: true,
    }
    await chrome.runtime.sendMessage({ type: 'save_settings', settings: newSettings, theme: currentTheme })
    onSave(newSettings, currentTheme)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-[rgb(var(--harbor-border))]">
        <button onClick={onBack} className="icon-btn">
          <ArrowLeft size={15} />
        </button>
        <h2 className="font-semibold text-sm text-[rgb(var(--harbor-text))]">Settings</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto harbor-scroll">
        <div className="flex flex-col divide-y divide-[rgb(var(--harbor-border))]">

          {/* ── AI Provider ───────────────────────────────────────────────── */}
          <section className="px-4 py-4 flex flex-col gap-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--harbor-text-faint))]">
              AI Provider
            </h3>

            {/* Provider */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[rgb(var(--harbor-text-muted))]">Provider</span>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as ProviderName)}
                className="w-full px-2.5 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-sm text-[rgb(var(--harbor-text))] outline-none focus:border-harbor-400"
              >
                {Object.entries(PROVIDER_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>

            {/* Model */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[rgb(var(--harbor-text-muted))]">Model</span>
              {models.length > 0 && (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-sm text-[rgb(var(--harbor-text))] outline-none focus:border-harbor-400"
                >
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder={models.length ? 'Override with custom model…' : 'Enter model name (e.g. llama3.2)'}
                className="w-full px-2.5 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-sm text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-faint))] outline-none focus:border-harbor-400 font-mono"
              />
            </div>

            {/* API Key */}
            {needsKey && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[rgb(var(--harbor-text-muted))]">API Key</span>
                  {keyLink && (
                    <a href={keyLink} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-harbor-500 hover:text-harbor-600 flex items-center gap-1">
                      Get key <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`${PROVIDER_LABELS[provider] ?? provider} API key`}
                    className="w-full px-2.5 py-2 pr-9 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-sm text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-faint))] outline-none focus:border-harbor-400 font-mono"
                  />
                  <button
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text-muted))]"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-[rgb(var(--harbor-text-faint))]">
                  Stored locally, never shared.
                </p>
              </div>
            )}

            {/* Base URL */}
            {needsUrl && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-[rgb(var(--harbor-text-muted))]">Base URL</span>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1'}
                  className="w-full px-2.5 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-sm text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-faint))] outline-none focus:border-harbor-400 font-mono"
                />
              </label>
            )}

            {/* Ollama hint */}
            {provider === 'ollama' && (
              <div className="flex gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  Run Ollama with{' '}
                  <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">OLLAMA_ORIGINS=*</code>{' '}
                  for browser access.
                </p>
              </div>
            )}
          </section>

          {/* ── Advanced ──────────────────────────────────────────────────── */}
          <section className="px-4 py-4 flex flex-col gap-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--harbor-text-faint))]">
              Advanced
            </h3>

            {/* Max tokens */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[rgb(var(--harbor-text-muted))]">Max Tokens</span>
                <span className="text-xs font-mono text-[rgb(var(--harbor-text-muted))]">{maxTokens.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={1024} max={32768} step={1024}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full accent-harbor-600"
              />
              <div className="flex justify-between text-[11px] text-[rgb(var(--harbor-text-faint))]">
                <span>1K</span>
                <span>32K</span>
              </div>
            </div>

            {/* Memory toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[rgb(var(--harbor-text))]">Memory</p>
                <p className="text-[11px] text-[rgb(var(--harbor-text-faint))]">Remember context across sessions</p>
              </div>
              <button
                onClick={() => setEnableMemory((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${enableMemory ? 'bg-harbor-600' : 'bg-[rgb(var(--harbor-border-2))]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enableMemory ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </section>

          {/* ── Appearance ────────────────────────────────────────────────── */}
          <section className="px-4 py-4 flex flex-col gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--harbor-text-faint))]">
              Appearance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCurrentTheme(value)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 ${
                    currentTheme === value
                      ? 'border-harbor-500 bg-harbor-500/10 text-harbor-600 dark:text-harbor-400'
                      : 'border-[rgb(var(--harbor-border))] text-[rgb(var(--harbor-text-muted))] hover:border-harbor-400'
                  }`}
                >
                  {currentTheme === value && <Check size={11} />}
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* ── About ─────────────────────────────────────────────────────── */}
          <section className="px-4 py-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--harbor-text-faint))] mb-2">
              About
            </h3>
            <div className="text-xs text-[rgb(var(--harbor-text-faint))] space-y-1">
              <p>Harbor v1.0.0 — AI Browser Agent</p>
              <p>Inspired by BrowserOS · AGPL-3.0</p>
            </div>
          </section>
        </div>
      </div>

      {/* Save button */}
      <div className="px-3 py-3 border-t border-[rgb(var(--harbor-border))]">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
            status === 'saved'
              ? 'bg-emerald-600 text-white'
              : status === 'saving'
                ? 'bg-harbor-500/70 text-white cursor-not-allowed'
                : 'bg-harbor-600 hover:bg-harbor-700 text-white'
          }`}
        >
          {status === 'saved' && <Check size={15} />}
          {status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
