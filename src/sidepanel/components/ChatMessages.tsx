import React, { useEffect, useRef } from 'react'
import type { UIMessage } from '../hooks/useChat'
import ChatMessage from './ChatMessage'

interface Props {
  messages: UIMessage[]
  isRunning: boolean
  onToggleThinking?: (messageId: string, blockId: string) => void
}

export default function ChatMessages({ messages, isRunning, onToggleThinking }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Show typing indicator only when running and last message was from user
  const showTyping = isRunning && messages[messages.length - 1]?.role === 'user'

  return (
    <div className="h-full overflow-y-auto harbor-scroll">
      <div className="flex flex-col gap-4 px-3 py-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onToggleThinking={onToggleThinking} />
        ))}

        {showTyping && (
          <div className="flex items-start gap-2.5 animate-fade-up">
            <img src="/icons/icon48.png" alt="Harbor" className="w-6 h-6 rounded-sm flex-shrink-0" />
            <div className="flex items-center gap-1 pt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-harbor-500 typing-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-harbor-500 typing-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-harbor-500 typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
