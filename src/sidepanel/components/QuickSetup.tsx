import React, { useState } from 'react'
import { Zap, ExternalLink, X, Check, Eye, EyeOff } from 'lucide-react'
import type { ProviderName } from '../../shared/types'
import { PROVIDER_LABELS } from '../../shared/constants'

interface Props {
  onSetupComplete: (provider: ProviderName, apiKey: string) => void
  onDismiss: () => void
}

const QUICK_PROVIDERS = [
  { id: 'anthropic' as const, label: 'Claude', color: 'from-blue-600 to-blue-700' },
  { id: 'openai' as const, label: 'GPT-4', color: 'from-green-600 to-green-700' },
  { id: 'google' as const, label: 'Gemini', color: 'from-blue-500 to-red-500' },
  { id: 'ollama' as const, label: 'Local', color: 'from-purple-600 to-purple-700' },
]

const KEY_LINKS: Partial<Record<ProviderName, string>> = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
  google: 'https://aistudio.google.com/app/apikey',
}

export default function QuickSetup({ onSetupComplete, onDismiss }: Props) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderName | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  const keyLink = selectedProvider && KEY_LINKS[selectedProvider]

  const handleSetup = () => {
    if (!selectedProvider || !apiKey.trim()) return
    onSetupComplete(selectedProvider, apiKey.trim())
  }

  if (!selectedProvider) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-scale-in"
          style={{
            background: 'rgb(var(--harbor-surface))',
            borderColor: 'rgb(var(--harbor-border))',
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-5 border-b flex items-start justify-between"
            style={{ borderColor: 'rgb(var(--harbor-border))' }}
          >
            <div className="flex items-center gap-2">
              <Zap size={20} style={{ color: 'rgb(var(--harbor-accent))' }} />
              <h2 className="font-semibold text-base" style={{ color: 'rgb(var(--harbor-text))' }}>
                Get Started with Harbor
              </h2>
            </div>
            <button
              onClick={onDismiss}
              className="text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text))] focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))] rounded p-1"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm" style={{ color: 'rgb(var(--harbor-text))' }}>
              Choose your AI provider to start chatting:
            </p>

            {/* Provider Grid */}
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROVIDERS.map(({ id, label, color }) => (
                <button
                  key={id}
                  onClick={() => setSelectedProvider(id)}
                  className={`p-3 rounded-lg border-2 transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))] ${
                    selectedProvider === id
                      ? 'border-blue-500 scale-105'
                      : 'border-transparent hover:border-[rgb(var(--harbor-border))]'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${
                      selectedProvider === id
                        ? 'rgb(var(--harbor-surface-2))'
                        : 'rgb(var(--harbor-surface))'
                    })`,
                  }}
                  title={`Select ${label}`}
                >
                  <div className="text-xs font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>
                    {label}
                  </div>
                  <div className="text-[10px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                    {id === 'ollama' ? 'Local' : 'API key'}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[11px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
              Don't have an API key? Get one for free from your provider.
            </p>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-3 border-t flex gap-2"
            style={{ borderColor: 'rgb(var(--harbor-border))' }}
          >
            <button
              onClick={onDismiss}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
              style={{
                color: 'rgb(var(--harbor-text-muted))',
                borderColor: 'rgb(var(--harbor-border))',
                border: '1px solid',
                background: 'transparent',
              }}
            >
              Skip
            </button>
            <button
              disabled
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
              style={{ background: 'rgb(var(--harbor-accent))' }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-scale-in"
        style={{
          background: 'rgb(var(--harbor-surface))',
          borderColor: 'rgb(var(--harbor-border))',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b flex items-start justify-between"
          style={{ borderColor: 'rgb(var(--harbor-border))' }}
        >
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'rgb(var(--harbor-text))' }}>
              {PROVIDER_LABELS[selectedProvider]} API Key
            </h2>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
              Paste your API key below
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text))] focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))] rounded p-1"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* API Key Input */}
          <div>
            <label className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
              API Key
            </label>
            <div className="relative mt-1.5">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-[rgb(var(--harbor-accent))] focus:shadow-[0_0_0_3px_rgb(var(--harbor-accent)_/_0.12)] transition-shadow"
                style={{
                  background: 'rgb(var(--harbor-surface))',
                  borderColor: 'rgb(var(--harbor-border))',
                  color: 'rgb(var(--harbor-text))',
                }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))] rounded p-0.5"
                style={{ color: 'rgb(var(--harbor-text-faint))' }}
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Get API Key Link */}
          {keyLink && (
            <a
              href={keyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
              style={{
                color: 'rgb(var(--harbor-accent))',
                background: 'rgb(var(--harbor-surface-2))',
              }}
              title="Open API key page in new tab"
            >
              Get API Key <ExternalLink size={12} />
            </a>
          )}

          <p className="text-[11px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Your API key is stored securely in your browser and never shared with third parties.
          </p>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t flex gap-2"
          style={{ borderColor: 'rgb(var(--harbor-border))' }}
        >
          <button
            onClick={() => {
              setSelectedProvider(null)
              setApiKey('')
            }}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
            style={{
              color: 'rgb(var(--harbor-text-muted))',
              borderColor: 'rgb(var(--harbor-border))',
              border: '1px solid',
              background: 'transparent',
            }}
          >
            Back
          </button>
          <button
            onClick={handleSetup}
            disabled={!apiKey.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgb(var(--harbor-accent))]"
            style={{ background: 'rgb(var(--harbor-accent))' }}
          >
            <Check size={14} /> Set Up
          </button>
        </div>
      </div>
    </div>
  )
}
