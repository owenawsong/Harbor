import React, { useState, useEffect } from 'react'
import { ChevronDown, Plus, Trash2, Save, X } from 'lucide-react'
import type { AgentSettings } from '../../shared/types'

export interface ModelPreset {
  id: string
  name: string
  provider: string
  model: string
  apiKey?: string
  baseUrl?: string
  enableMemory?: boolean
  timestamp: number
}

interface Props {
  currentSettings: AgentSettings
  onSelectPreset: (settings: AgentSettings) => void
  onClose: () => void
}

export default function ModelPresets({ currentSettings, onSelectPreset, onClose }: Props) {
  const [presets, setPresets] = useState<ModelPreset[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [loading, setLoading] = useState(true)

  // Load presets from storage
  useEffect(() => {
    chrome.storage.local.get('harbor_model_presets', (data) => {
      const loadedPresets = (data.harbor_model_presets || []) as ModelPreset[]
      setPresets(loadedPresets)
      setLoading(false)
    })
  }, [])

  const savePreset = () => {
    if (!presetName.trim()) return

    const newPreset: ModelPreset = {
      id: `preset_${Date.now()}`,
      name: presetName.trim(),
      provider: currentSettings.provider.provider,
      model: currentSettings.provider.model,
      apiKey: currentSettings.provider.apiKey,
      baseUrl: currentSettings.provider.baseUrl,
      enableMemory: currentSettings.enableMemory,
      timestamp: Date.now(),
    }

    const updated = [...presets, newPreset]
    setPresets(updated)
    chrome.storage.local.set({ harbor_model_presets: updated })
    setPresetName('')
    setShowCreateForm(false)
  }

  const deletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id)
    setPresets(updated)
    chrome.storage.local.set({ harbor_model_presets: updated })
  }

  const applyPreset = (preset: ModelPreset) => {
    const newSettings: AgentSettings = {
      ...currentSettings,
      provider: {
        provider: preset.provider as any,
        model: preset.model,
        apiKey: preset.apiKey,
        baseUrl: preset.baseUrl,
      },
      enableMemory: preset.enableMemory ?? currentSettings.enableMemory,
    }
    onSelectPreset(newSettings)
    onClose()
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block w-4 h-4 border-2 border-harbor-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="absolute bottom-full right-0 mb-2 w-80 max-h-96 bg-[rgb(var(--harbor-surface))] border border-[rgb(var(--harbor-border))] rounded-xl shadow-lg overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--harbor-border))]">
        <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--harbor-text))' }}>
          Model Presets
        </h3>
        <button
          onClick={onClose}
          className="text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text))] transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto harbor-scroll">
        {/* Create Form */}
        {showCreateForm && (
          <div className="p-3 border-b border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface-2))]">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name…"
              className="w-full px-2.5 py-1.5 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-xs text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-faint))] mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') savePreset()
                if (e.key === 'Escape') setShowCreateForm(false)
              }}
              autoFocus
            />
            <div className="flex gap-1.5">
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-harbor-600 hover:bg-harbor-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition"
              >
                <Save size={12} />
                Save
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-2 py-1.5 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] hover:bg-[rgb(var(--harbor-surface-2))] text-xs font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Presets List */}
        {presets.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
              No presets yet
            </p>
          </div>
        ) : (
          <div className="p-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="w-full flex items-start justify-between gap-2 p-2.5 rounded-lg hover:bg-[rgb(var(--harbor-surface-2))] transition group"
              >
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>
                    {preset.name}
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                    {preset.provider} • {preset.model}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePreset(preset.id)
                  }}
                  className="flex-shrink-0 text-[rgb(var(--harbor-text-faint))] hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full px-4 py-2.5 border-t border-[rgb(var(--harbor-border))] flex items-center justify-center gap-1.5 text-xs font-medium text-harbor-600 hover:bg-[rgb(var(--harbor-surface-2))] transition"
        >
          <Plus size={14} />
          Save Current
        </button>
      )}
    </div>
  )
}
