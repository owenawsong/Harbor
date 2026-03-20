import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowUp, Square, Paperclip, X, Zap, CheckCircle2 } from 'lucide-react'
import type { AgentSettings } from '../../shared/types'

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

export default function ChatInput({ onSend, onStop, isRunning, disabled, placeholder, agentMode = true, onToggleAgentMode, settings }: Props) {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [enablePlanning, setEnablePlanning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((a) => (
            <div
              key={a.name}
              className="flex items-center gap-1 px-2 py-1 rounded-md border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface-2))] text-xs text-[rgb(var(--harbor-text-muted))] max-w-[180px]"
            >
              <span className="truncate">{a.name}</span>
              <button
                onClick={() => removeAttachment(a.name)}
                className="flex-shrink-0 text-[rgb(var(--harbor-text-faint))] hover:text-red-500"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Top line: Text input */}
      <div className="flex items-stretch gap-2 rounded-xl border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] px-3 py-2.5 focus-within:border-harbor-400 mb-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onInput}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? 'Ask Harbor anything…'}
          disabled={disabled || isRunning}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm leading-6 min-h-[24px] max-h-[160px] disabled:opacity-40 text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-faint))]"
        />
      </div>

      {/* Bottom line: Controls */}
      <div className="flex items-center gap-2">
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isRunning}
          title="Attach file"
          className="flex-shrink-0 p-1.5 rounded-lg text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text-muted))] hover:bg-[rgb(var(--harbor-surface-2))] disabled:opacity-40"
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

        {/* Mode Pill Button */}
        <button
          onClick={onToggleAgentMode}
          disabled={disabled || isRunning}
          title={agentMode ? 'Switch to Chat Mode' : 'Switch to Agent Mode'}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface-2))] text-[rgb(var(--harbor-text))] hover:bg-[rgb(var(--harbor-surface))] disabled:opacity-40"
        >
          <Zap size={14} />
          <span>{agentMode ? 'Agent' : 'Chat'}</span>
        </button>

        {/* Model Name Display */}
        {settings?.provider && (
          <div className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-[rgb(var(--harbor-surface-2))] text-xs text-[rgb(var(--harbor-text-muted))] max-w-[140px] truncate">
            {settings.provider.model}
          </div>
        )}

        {/* Plan Toggle (Agent Mode only) */}
        {agentMode && (
          <button
            onClick={() => setEnablePlanning(!enablePlanning)}
            disabled={disabled || isRunning}
            title={enablePlanning ? 'Planning enabled' : 'Enable planning'}
            className="flex-shrink-0 p-1.5 rounded-lg text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text-muted))] hover:bg-[rgb(var(--harbor-surface-2))] disabled:opacity-40"
            style={enablePlanning ? { color: 'rgb(34, 197, 94)' } : {}}
          >
            <CheckCircle2 size={16} />
          </button>
        )}

        <div className="flex-1" />

        {/* Send / Stop button */}
        {isRunning ? (
          <button
            onClick={onStop}
            title="Stop"
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center"
          >
            <Square size={14} className="text-white fill-white" />
          </button>
        ) : (
          <button
            onClick={send}
            disabled={!canSend}
            title="Send"
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-harbor-600 hover:bg-harbor-700 disabled:bg-[rgb(var(--harbor-border))] disabled:cursor-not-allowed"
          >
            <ArrowUp size={16} className="text-white" />
          </button>
        )}
      </div>
    </div>
  )
}
