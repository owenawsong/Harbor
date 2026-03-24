import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ChevronDown, Brain, Pencil, Check, X, Copy, MoreVertical } from 'lucide-react'
import 'katex/dist/katex.min.css'
import type { UIMessage, UIThinkingBlock } from '../hooks/useChat'
import { useGlobalToast } from '../contexts/ToastContext'
import ToolCallDisplay from './ToolCallDisplay'

// ─── Thinking Block ───────────────────────────────────────────────────────────

function ThinkingBlock({
  block,
  onToggle,
}: {
  block: UIThinkingBlock
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border border-[rgb(var(--harbor-border))] overflow-hidden text-xs animate-fade-in">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 w-full px-2.5 py-1.5 bg-[rgb(var(--harbor-surface-2))] hover:bg-[rgb(var(--harbor-border))] text-left transition-colors duration-150"
      >
        <Brain size={11} className="flex-shrink-0 text-[rgb(var(--harbor-text-faint))]" />
        <span className="font-medium text-[rgb(var(--harbor-text-muted))] flex-1">{t('chat.agent_thinking')}</span>
        <ChevronDown
          size={11}
          className="text-[rgb(var(--harbor-text-faint))] flex-shrink-0"
          style={{
            transform: block.isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </button>
      {/* Animated expand/collapse via max-height */}
      <div
        style={{
          maxHeight: block.isOpen ? '144px' : '0',
          transition: 'max-height 220ms cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
      >
        <div className="px-3 py-2 border-t border-[rgb(var(--harbor-border))] max-h-36 overflow-y-auto harbor-scroll">
          <p className="text-[rgb(var(--harbor-text-muted))] leading-relaxed whitespace-pre-wrap">
            {block.text}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Message ──────────────────────────────────────────────────────────────────

interface Props {
  message: UIMessage
  onToggleThinking?: (messageId: string, blockId: string) => void
  onEditMessage?: (messageId: string, newText: string) => void
}

export default function ChatMessage({ message, onToggleThinking, onEditMessage }: Props) {
  const { t } = useTranslation()
  const { success } = useGlobalToast()
  const isUser = message.role === 'user'
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.text || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea on edit
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      textareaRef.current.focus()
      // Move cursor to end
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== message.text) {
      onEditMessage?.(message.id, trimmed)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(message.text || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleCopyMessage = () => {
    const text = message.text || ''
    navigator.clipboard.writeText(text).then(() => {
      success('Copied to clipboard')
    }).catch(() => {
      // Fallback if clipboard API fails
    })
  }

  const handleSaveToMemory = () => {
    const text = message.text || ''
    if (!text) return

    chrome.storage.local.get('harbor_memory_entries', (data) => {
      const entries = data.harbor_memory_entries || []
      const newEntry = {
        id: Math.random().toString(36).slice(2, 11),
        category: 'general',
        content: text,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
      }
      chrome.storage.local.set({
        harbor_memory_entries: [newEntry, ...entries],
      })
    })
  }

  if (isUser) {
    return (
      <div
        className="flex justify-end animate-fade-up"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-end gap-1 max-w-[85%]">
          {/* Action buttons — fixed position, always space */}
          {!isEditing && (
            <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 transition-opacity" style={{ opacity: isHovered ? 1 : 0 }}>
              <button
                onClick={handleCopyMessage}
                className="p-1 rounded-lg hover:bg-[rgb(var(--harbor-surface-2))] transition-colors"
                style={{ color: 'rgb(var(--harbor-text-faint))' }}
                title="Copy message"
              >
                <Copy size={11} />
              </button>
              {onEditMessage && (
                <button
                  onClick={() => {
                    setEditValue(message.text || '')
                    setIsEditing(true)
                  }}
                  className="p-1 rounded-lg hover:bg-[rgb(var(--harbor-surface-2))] transition-colors"
                  style={{ color: 'rgb(var(--harbor-text-faint))' }}
                  title={t('common.edit')}
                >
                  <Pencil size={11} />
                </button>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-1.5 w-full">
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value)
                  e.currentTarget.style.height = 'auto'
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
                }}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white resize-none outline-none"
                style={{
                  background: 'rgb(79 95 232)',
                  minHeight: '40px',
                  maxHeight: '200px',
                  overflow: 'hidden',
                }}
                rows={1}
              />
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors"
                  style={{
                    color: 'rgb(var(--harbor-text-faint))',
                    background: 'rgb(var(--harbor-surface-2))',
                  }}
                >
                  <X size={10} /> {t('memory.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-white transition-colors"
                  style={{ background: 'rgb(var(--harbor-accent))' }}
                >
                  <Check size={10} /> {t('memory.save')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-1">
              <div
                className="px-3 py-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white select-text"
                style={{ background: 'rgb(79 95 232)' }}
              >
                {message.text}
              </div>
              {/* Status indicator */}
              <div className="text-[10px] mb-0.5 opacity-60 flex-shrink-0">✓</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Assistant message
  const hasContent =
    message.text || message.thinkingBlocks.length > 0 || message.toolCalls.length > 0 || message.error

  if (!hasContent && !message.isStreaming) return null

  return (
    <div className="flex items-start gap-2.5 animate-fade-up" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Avatar */}
      <img src="/icons/logo.png" alt="Harbor" className="w-6 h-6 rounded-sm flex-shrink-0 mt-0.5 select-none" />

      {/* Content with action buttons */}
      <div className="flex-1 min-w-0 flex flex-col gap-2 select-text relative group">
        {/* Thinking blocks and tool calls, interleaved by sequence */}
        {(() => {
          const events: Array<{ type: 'thinking' | 'tool'; sequence: number; block?: UIThinkingBlock; toolCall?: typeof message.toolCalls[0]; index?: number }> = []

          message.thinkingBlocks.forEach((block) => {
            events.push({ type: 'thinking', sequence: block.sequence, block })
          })

          message.toolCalls.forEach((tc, i) => {
            events.push({ type: 'tool', sequence: tc.sequence, toolCall: tc, index: i })
          })

          // Sort by sequence (order events were emitted)
          events.sort((a, b) => a.sequence - b.sequence)

          return events.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {events.map((event) => (
                event.type === 'thinking' && event.block ? (
                  <ThinkingBlock
                    key={event.block.id}
                    block={event.block}
                    onToggle={() => onToggleThinking?.(message.id, event.block!.id)}
                  />
                ) : event.type === 'tool' && event.toolCall ? (
                  <div key={event.toolCall.id} className="animate-fade-in" style={{ animationDelay: `${event.index! * 40}ms` }}>
                    <ToolCallDisplay toolCall={event.toolCall} />
                  </div>
                ) : null
              ))}
            </div>
          ) : null
        })()}

        {/* Text content */}
        {(message.text || (message.isStreaming && !message.toolCalls.length)) && (
          <div className={`text-sm text-[rgb(var(--harbor-text))] ${message.isStreaming && message.text ? 'streaming-cursor' : ''}`}>
            {message.text ? (
              <div className="md">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            ) : message.isStreaming ? (
              <div className="flex items-center gap-1 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-harbor-500 typing-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-harbor-500 typing-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-harbor-500 typing-dot" />
              </div>
            ) : null}
          </div>
        )}

        {/* Error */}
        {message.error && (
          <div className="text-xs px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
            {message.error}
          </div>
        )}
      </div>

      {/* Action buttons for assistant messages */}
      {message.text && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ opacity: isHovered ? 1 : 0 }}>
          <button
            onClick={handleCopyMessage}
            className="p-1 rounded-lg hover:bg-[rgb(var(--harbor-surface-2))] transition-colors"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
            title="Copy message"
          >
            <Copy size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
