import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp, Square, Paperclip, X, Zap, CheckCircle2, ChevronDown, Mic, MicOff } from 'lucide-react'
import type { AgentSettings } from '../../shared/types'
import { useVoiceInput } from '../hooks/useVoiceInput'
import ModelPresets from './ModelPresets'

interface Attachment {
  name: string
  dataUrl: string
  mimeType: string
}

interface Props {
  onSend: (text: string, attachments?: Attachment[], options?: { enablePlanning?: boolean; chatModeOnly?: boolean }) => void
  onStop: () => void
  isRunning: boolean
  disabled?: boolean
  placeholder?: string
  agentMode?: boolean
  onToggleAgentMode?: () => void
  settings?: AgentSettings
}

interface ChatInputHandle {
  focus: () => void
}

const ChatInput = forwardRef<ChatInputHandle, Props>(({ onSend, onStop, isRunning, disabled, placeholder, agentMode = true, onToggleAgentMode, settings }, ref) => {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [enablePlanning, setEnablePlanning] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modelButtonRef = useRef<HTMLDivElement>(null)

  // Voice input
  const { isListening, isSupported: isVoiceSupported, interimTranscript, permissionError, startListening, stopListening } = useVoiceInput({
    onTranscribed: (text) => {
      if (text.trim()) {
        setValue((prev) => (prev ? prev + ' ' + text : text))
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
        }
      }
    },
  })

  // Show permission error if voice input fails
  useEffect(() => {
    if (permissionError) {
      console.warn('Voice input error:', permissionError)
    }
  }, [permissionError])

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }))

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !disabled && !isRunning

  const send = useCallback(() => {
    const text = value.trim()
    if ((!text && attachments.length === 0) || !canSend) return
    setValue('')
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onSend(text, attachments.length > 0 ? attachments : undefined, {
      enablePlanning: agentMode && enablePlanning,
      chatModeOnly: !agentMode,
    })
  }, [value, attachments, canSend, onSend, agentMode, enablePlanning])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        setAttachments((prev) => [...prev, { name: file.name, dataUrl, mimeType: file.type }])
      }
      reader.readAsDataURL(file)
    })
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name))
  }

  useEffect(() => {
    if (!isRunning) textareaRef.current?.focus()
  }, [isRunning])

  return (
    <div className="px-3 pb-3 pt-2 border-t border-[rgb(var(--harbor-border))]">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((a) => {
            const isImage = a.mimeType.startsWith('image/')
            return (
              <div
                key={a.name}
                className="relative group rounded-lg overflow-hidden border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface-2))]"
              >
                {isImage ? (
                  <div className="relative">
                    <img
                      src={a.dataUrl}
                      alt={a.name}
                      className="h-16 w-16 object-cover"
                    />
                    <button
                      onClick={() => removeAttachment(a.name)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 text-xs text-[rgb(var(--harbor-text-muted))] max-w-[180px]">
                    <span className="truncate">{a.name}</span>
                    <button
                      onClick={() => removeAttachment(a.name)}
                      className="flex-shrink-0 text-[rgb(var(--harbor-text-faint))] hover:text-red-500"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Top line: Text input */}
      <div className="flex items-stretch gap-2 rounded-xl border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] px-3 py-2.5 focus-within:border-harbor-400 mb-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onInput}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? t('chat.placeholder')}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm leading-6 min-h-[24px] max-h-[160px] disabled:opacity-40 text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-faint))]"
        />
      </div>

      {/* Bottom line: Controls */}
      <div className="flex items-center gap-2 relative">
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isRunning}
          title={t('chat.attach_file')}
          className="flex-shrink-0 p-1.5 rounded-lg text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text-muted))] hover:bg-[rgb(var(--harbor-surface-2))] disabled:opacity-40 transition-colors"
        >
          <Paperclip size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onFileChange}
          accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm,text/*,.pdf,.csv,.json,.md"
        />

        {/* Plan Toggle (Agent Mode only) - MOVED LEFT */}
        {agentMode && (
          <button
            onClick={() => setEnablePlanning(!enablePlanning)}
            disabled={disabled || isRunning}
            title={enablePlanning ? t('chat.planning_enabled') : t('chat.enable_planning')}
            className="flex-shrink-0 p-1.5 rounded-lg text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text-muted))] hover:bg-[rgb(var(--harbor-surface-2))] disabled:opacity-40 transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              color: enablePlanning ? 'rgb(34, 197, 94)' : 'rgb(var(--harbor-text-faint))',
              boxShadow: enablePlanning ? '0 0 8px rgb(34, 197, 94 / 0.3)' : 'none',
              transitionProperty: 'all',
              transitionDuration: '300ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <CheckCircle2 size={16} style={{
              transform: enablePlanning ? 'scale(1.2) rotate(0deg)' : 'scale(1) rotate(0deg)',
              transitionProperty: 'transform',
              transitionDuration: '300ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </button>
        )}

        {/* Mode Pill Button */}
        <button
          onClick={onToggleAgentMode}
          disabled={disabled || isRunning}
          title={agentMode ? t('chat.switch_chat_mode') : t('chat.switch_agent_mode')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface-2))] text-[rgb(var(--harbor-text))] hover:bg-[rgb(var(--harbor-surface))] disabled:opacity-40 transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            borderColor: agentMode ? 'rgb(var(--harbor-accent))' : 'rgb(var(--harbor-border))',
            boxShadow: agentMode ? '0 0 0 2px rgb(var(--harbor-accent) / 0.1)' : 'none',
            transitionProperty: 'all',
            transitionDuration: '300ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <Zap
            size={14}
            style={{
              color: agentMode ? 'rgb(var(--harbor-accent))' : 'currentColor',
              transform: agentMode ? 'rotate(0deg)' : 'rotate(-20deg)',
              transitionProperty: 'transform, color',
              transitionDuration: '300ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          <span style={{
            opacity: 1,
            transitionProperty: 'opacity',
            transitionDuration: '300ms',
          }}>
            {agentMode ? t('chat.agent_mode') : t('chat.chat_mode')}
          </span>
        </button>

        <div className="flex-1" />

        {/* Model Selector Button - NOW CLICKABLE & RIGHT ALIGNED */}
        {settings?.provider && (
          <div ref={modelButtonRef} className="relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              disabled={disabled || isRunning}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-[rgb(var(--harbor-surface-2))] hover:bg-[rgb(var(--harbor-surface))] text-xs text-[rgb(var(--harbor-text-muted))] max-w-[140px] truncate flex items-center gap-1.5 disabled:opacity-40 transition-colors"
              title={t('settings.save_preset_tooltip')}
            >
              <span className="truncate">{settings.provider.model}</span>
              <ChevronDown size={12} className={`flex-shrink-0 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </button>
            {showPresets && (
              <ModelPresets
                currentSettings={settings}
                onSelectPreset={(newSettings) => {
                  // Send message to background to save new settings
                  chrome.runtime.sendMessage({
                    type: 'save_settings',
                    settings: newSettings,
                    theme: 'system',
                  })
                }}
                onClose={() => setShowPresets(false)}
              />
            )}
          </div>
        )}

        {/* Send / Stop / Voice button */}
        {isRunning ? (
          <button
            onClick={onStop}
            title={t('common.close')}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <Square size={14} className="text-white fill-white" />
          </button>
        ) : canSend ? (
          <button
            onClick={send}
            title={t('chat.send')}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-harbor-600 hover:bg-harbor-700 transition-all shadow-lg shadow-harbor-600/60 animate-pulse"
            style={{ animationDuration: '3s' }}
          >
            <ArrowUp size={16} className="text-white" />
          </button>
        ) : isVoiceSupported ? (
          <button
            onClick={handleVoiceToggle}
            disabled={disabled}
            title={isListening ? 'Stop listening' : 'Start voice input'}
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/60 animate-pulse'
                : 'bg-harbor-600 hover:bg-harbor-700'
            }`}
          >
            {isListening ? <Mic size={16} className="text-white" /> : <Mic size={16} className="text-white opacity-50" />}
          </button>
        ) : null}
      </div>
    </div>
  )
})

export default ChatInput
