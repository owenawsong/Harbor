import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from '../hooks/useChat'
import ToolCallDisplay from './ToolCallDisplay'

interface ChatMessageProps {
  message: UIMessage
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-harbor-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">H</span>
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* User message bubble */}
        {isUser && (
          <div className="bg-harbor-600 text-white px-3 py-2 rounded-2xl rounded-tr-sm text-sm">
            {message.text}
          </div>
        )}

        {/* Assistant message */}
        {!isUser && (
          <>
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
              <div className="text-sm text-[rgb(var(--harbor-text))]">
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
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
                {message.error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
