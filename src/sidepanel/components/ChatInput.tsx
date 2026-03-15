import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Square, ArrowUp } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string, attachedTabId?: number) => void
  onStop: () => void
  isRunning: boolean
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, onStop, isRunning, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || disabled || isRunning) return
    setInput('')
    onSend(text)
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, disabled, isRunning, onSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  useEffect(() => {
    if (!isRunning) {
      textareaRef.current?.focus()
    }
  }, [isRunning])

  return (
    <div className="px-3 pb-3 pt-2 border-t border-[rgb(var(--harbor-border))]">
      <div className="flex items-end gap-2 bg-[rgb(var(--harbor-surface))] rounded-xl border border-[rgb(var(--harbor-border))] px-3 py-2 focus-within:border-harbor-400 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Ask Harbor to do anything...'}
          disabled={disabled || isRunning}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-muted))] disabled:opacity-50 min-h-[24px] max-h-[160px] leading-6"
        />

        <div className="flex-shrink-0 mb-0.5">
          {isRunning ? (
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
              title="Stop"
            >
              <Square size={14} className="text-white fill-white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className="w-8 h-8 rounded-lg bg-harbor-600 hover:bg-harbor-700 disabled:bg-[rgb(var(--harbor-border))] disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              title="Send (Enter)"
            >
              <ArrowUp size={15} className="text-white" />
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-[rgb(var(--harbor-text-muted))] mt-1.5">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
