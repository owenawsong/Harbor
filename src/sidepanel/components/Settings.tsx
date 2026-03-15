import React, { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, ExternalLink, Info } from 'lucide-react'
import type { AgentSettings, ProviderName } from '../../shared/types'
import { DEFAULT_MODELS, PROVIDER_LABELS, API_ENDPOINTS } from '../../shared/constants'

interface SettingsProps {
  settings: AgentSettings
  theme: 'light' | 'dark' | 'system'
  onSave: (settings: AgentSettings, theme: 'light' | 'dark' | 'system') => void
  onBack: () => void
}

const PROVIDER_API_KEY_LINKS: Partial<Record<ProviderName, string>> = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
  google: 'https://aistudio.google.com/app/apikey',
  openrouter: 'https://openrouter.ai/settings/keys',
}

export default function Settings({ settings, theme, onSave, onBack }: SettingsProps) {
  const [provider, setProvider] = useState(settings.provider.provider as ProviderName)
  const [model, setModel] = useState(settings.provider.model)
  const [apiKey, setApiKey] = useState(settings.provider.apiKey ?? '')
  const [baseUrl, setBaseUrl] = useState(settings.provider.baseUrl ?? '')
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens ?? 8192)
  const [enableMemory, setEnableMemory] = useState(settings.enableMemory ?? false)
  const [currentTheme, setCurrentTheme] = useState(theme)
  const [showApiKey, setShowApiKey] = useState(false)
  const [customModel, setCustomModel] = useState('')

  const availableModels = DEFAULT_MODELS[provider] ?? []
  const apiKeyLink = PROVIDER_API_KEY_LINKS[provider]
  const needsApiKey = provider !== 'ollama'
  const needsBaseUrl = provider === 'openai-compatible' || provider === 'ollama'

  const handleProviderChange = (newProvider: ProviderName) => {
    setProvider(newProvider)
    const models = DEFAULT_MODELS[newProvider]
    if (models && models.length > 0) {
      setModel(models[0])
    }
    // Set default base URLs
    if (newProvider === 'ollama') {
      setBaseUrl('http://localhost:11434')
    } else if (newProvider === 'openai-compatible') {
      setBaseUrl('http://localhost:1234/v1')
    }
  }

  const handleSave = () => {
    const effectiveModel = customModel || model
    onSave(
      {
        provider: {
          provider,
          model: effectiveModel,
          apiKey: apiKey || undefined,
          baseUrl: baseUrl || undefined,
        },
        maxTokens,
        enableMemory,
        enableScreenshots: true,
      },
      currentTheme
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgb(var(--harbor-border))]">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-[rgb(var(--harbor-surface))] text-[rgb(var(--harbor-text-muted))] hover:text-[rgb(var(--harbor-text))] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-semibold text-[rgb(var(--harbor-text))]">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto harbor-scrollbar">
        <div className="p-4 flex flex-col gap-5">

          {/* AI Provider */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--harbor-text-muted))] mb-3">
              AI Provider
            </h3>

            <div className="flex flex-col gap-3">
              {/* Provider Select */}
              <div>
                <label className="text-xs font-medium text-[rgb(var(--harbor-text))] block mb-1.5">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value as ProviderName)}
                  className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-bg))] text-sm text-[rgb(var(--harbor-text))] focus:outline-none focus:border-harbor-400 transition-colors"
                >
                  {Object.entries(PROVIDER_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Model Select */}
              <div>
                <label className="text-xs font-medium text-[rgb(var(--harbor-text))] block mb-1.5">Model</label>
                {availableModels.length > 0 ? (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-bg))] text-sm text-[rgb(var(--harbor-text))] focus:outline-none focus:border-harbor-400 transition-colors"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : null}
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder={availableModels.length > 0 ? 'Or type a custom model name...' : 'Enter model name (e.g., llama3.2)'}
                  className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-bg))] text-sm text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-muted))] focus:outline-none focus:border-harbor-400 transition-colors mt-2"
                />
              </div>

              {/* API Key */}
              {needsApiKey && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[rgb(var(--harbor-text))]">API Key</label>
                    {apiKeyLink && (
                      <a
                        href={apiKeyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-harbor-500 hover:text-harbor-600 flex items-center gap-1 transition-colors"
                      >
                        Get key <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Enter your ${PROVIDER_LABELS[provider]} API key`}
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-bg))] text-sm text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-muted))] focus:outline-none focus:border-harbor-400 transition-colors font-mono"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[rgb(var(--harbor-text-muted))] hover:text-[rgb(var(--harbor-text))] transition-colors"
                    >
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-[rgb(var(--harbor-text-muted))] mt-1">
                    Your API key is stored locally and never shared.
                  </p>
                </div>
              )}

              {/* Base URL */}
              {needsBaseUrl && (
                <div>
                  <label className="text-xs font-medium text-[rgb(var(--harbor-text))] block mb-1.5">Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1'}
                    className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-bg))] text-sm text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-muted))] focus:outline-none focus:border-harbor-400 transition-colors font-mono"
                  />
                </div>
              )}

              {/* Ollama hint */}
              {provider === 'ollama' && (
                <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Make sure Ollama is running locally with{' '}
                    <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">OLLAMA_ORIGINS=*</code>{' '}
                    set for browser access.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Advanced */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--harbor-text-muted))] mb-3">
              Advanced
            </h3>

            <div className="flex flex-col gap-3">
              {/* Max Tokens */}
              <div>
                <label className="text-xs font-medium text-[rgb(var(--harbor-text))] block mb-1.5">
                  Max Tokens: {maxTokens.toLocaleString()}
                </label>
                <input
                  type="range"
                  min={1024}
                  max={32768}
                  step={1024}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full accent-harbor-600"
                />
                <div className="flex justify-between text-xs text-[rgb(var(--harbor-text-muted))] mt-1">
                  <span>1K</span>
                  <span>32K</span>
                </div>
              </div>

              {/* Memory */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium text-[rgb(var(--harbor-text))]">Enable Memory</label>
                  <p className="text-xs text-[rgb(var(--harbor-text-muted))]">Remember context across sessions</p>
                </div>
                <button
                  onClick={() => setEnableMemory(!enableMemory)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${enableMemory ? 'bg-harbor-600' : 'bg-[rgb(var(--harbor-border))]'}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enableMemory ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--harbor-text-muted))] mb-3">
              Appearance
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCurrentTheme(t)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all capitalize ${
                    currentTheme === t
                      ? 'border-harbor-500 bg-harbor-50 dark:bg-harbor-950/50 text-harbor-700 dark:text-harbor-300'
                      : 'border-[rgb(var(--harbor-border))] text-[rgb(var(--harbor-text-muted))] hover:border-harbor-300'
                  }`}
                >
                  {t === 'system' ? '⚙️ Auto' : t === 'light' ? '☀️ Light' : '🌙 Dark'}
                </button>
              ))}
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--harbor-text-muted))] mb-3">
              About
            </h3>
            <div className="text-xs text-[rgb(var(--harbor-text-muted))] space-y-1">
              <p>Harbor v1.0.0 — AI Browser Agent</p>
              <p>Inspired by BrowserOS · AGPL-3.0</p>
              <a
                href="https://github.com/owenawsong/Harbor-Extension"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-harbor-500 hover:text-harbor-600 transition-colors"
              >
                GitHub <ExternalLink size={10} />
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* Save Button */}
      <div className="px-4 py-3 border-t border-[rgb(var(--harbor-border))]">
        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-harbor-600 hover:bg-harbor-700 text-white font-medium rounded-xl transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}
