import React, { useEffect, useRef } from 'react'
import type { UIMessage } from '../hooks/useChat'
import ChatMessage from './ChatMessage'

interface ChatMessagesProps {
  messages: UIMessage[]
  isRunning: boolean
}

export default function ChatMessages({ messages, isRunning }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-full overflow-y-auto harbor-scrollbar">
      <div className="flex flex-col gap-2 p-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isRunning && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-harbor-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <div className="flex items-center gap-1 pt-2">
              <div className="w-2 h-2 rounded-full bg-harbor-500 typing-dot" />
              <div className="w-2 h-2 rounded-full bg-harbor-500 typing-dot" />
              <div className="w-2 h-2 rounded-full bg-harbor-500 typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
