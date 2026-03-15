import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { UIMessage, UIThinkingBlock } from '../hooks/useChat'
import ToolCallDisplay from './ToolCallDisplay'

interface ChatMessageProps {
  message: UIMessage
  onToggleThinking?: (messageId: string, blockId: string) => void
}

function ThinkingBlock({ block, isOpen, onToggle }: { block: UIThinkingBlock; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="bg-[rgb(var(--harbor-surface))] border border-[rgb(var(--harbor-border))] rounded-lg overflow-hidden text-xs">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[rgb(var(--harbor-border))] transition-colors"
      >
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-[rgb(var(--harbor-text-muted))] font-medium">Thinking</span>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-3 py-2 border-t border-[rgb(var(--harbor-border))] text-[rgb(var(--harbor-text-muted))] max-h-32 overflow-y-auto harbor-scrollbar">
          <p className="leading-relaxed whitespace-pre-wrap">{block.text}</p>
        </div>
      )}
    </div>
  )
}

export default function ChatMessage({ message, onToggleThinking }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-harbor-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-bold text-xs">
          H
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* User message bubble */}
        {isUser && (
          <div className="bg-harbor-600 text-white px-3 py-2 rounded-lg text-sm leading-relaxed">
            {message.text}
          </div>
        )}

        {/* Assistant message */}
        {!isUser && (
          <>
            {/* Thinking blocks */}
            {message.thinkingBlocks.length > 0 && (
              <div className="flex flex-col gap-1.5 w-full">
                {message.thinkingBlocks.map((block) => (
                  <ThinkingBlock
                    key={block.id}
                    block={block}
                    isOpen={block.isOpen}
                    onToggle={() => onToggleThinking?.(message.id, block.id)}
                  />
                ))}
              </div>
            )}

            {/* Tool calls */}
            {message.toolCalls.length > 0 && (
              <div className="flex flex-col gap-1.5 w-full">
                {message.toolCalls.map((tc) => (
                  <ToolCallDisplay key={tc.id} toolCall={tc} />
                ))}
              </div>
            )}

            {/* Text content */}
            {(message.text || message.isStreaming) && (
              <div className="text-sm text-[rgb(var(--harbor-text))] leading-relaxed">
                {message.text ? (
                  <div className="harbor-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : null}
                {message.isStreaming && !message.text && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-harbor-500 typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-harbor-500 typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-harbor-500 typing-dot" />
                  </div>
                )}
                {message.isStreaming && message.text && (
                  <span className="inline-block w-0.5 h-4 bg-harbor-500 ml-0.5 animate-pulse align-text-bottom" />
                )}
              </div>
            )}

            {/* Error */}
            {message.error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
                {message.error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
