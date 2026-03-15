import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowUp, Square } from 'lucide-react'

interface Props {
  onSend: (text: string) => void
  onStop: () => void
  isRunning: boolean
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, onStop, isRunning, disabled, placeholder }: Props) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const canSend = value.trim().length > 0 && !disabled && !isRunning

  const send = useCallback(() => {
    const text = value.trim()
    if (!text || !canSend) return
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
    onSend(text)
  }, [value, canSend, onSend])

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

  useEffect(() => {
    if (!isRunning) ref.current?.focus()
  }, [isRunning])

  return (
    <div className="px-3 pb-3 pt-2 border-t border-[rgb(var(--harbor-border))]">
      <div className="flex items-end gap-2 rounded-xl border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] px-3 py-2.5 focus-within:border-harbor-400">
        <textarea
          ref={ref}
          value={value}
          onChange={onInput}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? 'Ask Harbor anything…'}
          disabled={disabled || isRunning}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm leading-6 min-h-[24px] max-h-[160px] disabled:opacity-40 text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-faint))]"
        />

        <div className="flex-shrink-0">
          {isRunning ? (
            <button
              onClick={onStop}
              title="Stop"
              className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center"
            >
              <Square size={12} className="text-white fill-white" />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!canSend}
              title="Send (Enter)"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-harbor-600 hover:bg-harbor-700 disabled:bg-[rgb(var(--harbor-border))] disabled:cursor-not-allowed"
            >
              <ArrowUp size={14} className="text-white" />
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] mt-1.5 text-[rgb(var(--harbor-text-faint))]">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
