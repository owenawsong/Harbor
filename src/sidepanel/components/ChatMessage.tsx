import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ChevronDown, ChevronRight, Brain } from 'lucide-react'
import 'katex/dist/katex.min.css'
import type { UIMessage, UIThinkingBlock } from '../hooks/useChat'
import ToolCallDisplay from './ToolCallDisplay'

// ─── Thinking Block ───────────────────────────────────────────────────────────

function ThinkingBlock({
  block,
  onToggle,
}: {
  block: UIThinkingBlock
  onToggle: () => void
}) {
  return (
    <div className="rounded-lg border border-[rgb(var(--harbor-border))] overflow-hidden text-xs animate-fade-in">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 w-full px-2.5 py-1.5 bg-[rgb(var(--harbor-surface-2))] hover:bg-[rgb(var(--harbor-border))] text-left"
      >
        <Brain size={11} className="flex-shrink-0 text-[rgb(var(--harbor-text-faint))]" />
        <span className="font-medium text-[rgb(var(--harbor-text-muted))] flex-1">Reasoning</span>
        {block.isOpen
          ? <ChevronDown size={11} className="text-[rgb(var(--harbor-text-faint))]" />
          : <ChevronRight size={11} className="text-[rgb(var(--harbor-text-faint))]" />
        }
      </button>
      {block.isOpen && (
        <div className="px-3 py-2 border-t border-[rgb(var(--harbor-border))] max-h-36 overflow-y-auto harbor-scroll">
          <p className="text-[rgb(var(--harbor-text-muted))] leading-relaxed whitespace-pre-wrap">
            {block.text}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Message ──────────────────────────────────────────────────────────────────

interface Props {
  message: UIMessage
  onToggleThinking?: (messageId: string, blockId: string) => void
}

export default function ChatMessage({ message, onToggleThinking }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div
          className="max-w-[82%] px-3 py-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white"
          style={{ background: 'rgb(79 95 232)' }}
        >
          {message.text}
        </div>
      </div>
    )
  }

  // Assistant message
  const hasContent =
    message.text || message.thinkingBlocks.length > 0 || message.toolCalls.length > 0 || message.error

  if (!hasContent && !message.isStreaming) return null

  return (
    <div className="flex items-start gap-2.5 animate-fade-up">
      {/* Avatar */}
      <img src="/icons/harbor-logo.svg" alt="Harbor" className="w-6 h-6 rounded-sm flex-shrink-0 mt-0.5" />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Thinking blocks */}
        {message.thinkingBlocks.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {message.thinkingBlocks.map((block) => (
              <ThinkingBlock
                key={block.id}
                block={block}
                onToggle={() => onToggleThinking?.(message.id, block.id)}
              />
            ))}
          </div>
        )}

        {/* Tool calls */}
        {message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {message.toolCalls.map((tc) => (
              <ToolCallDisplay key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

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
    </div>
  )
}
