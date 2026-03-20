import React, { useEffect, useState } from 'react'
import { Check, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface Props {
  messages: ToastMessage[]
  onDismiss: (id: string) => void
}

const iconMap = {
  success: <Check size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
  warning: <AlertCircle size={16} />,
}

const colorMap = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-600 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
  },
}

function ToastItem({
  message,
  onDismiss,
}: {
  message: ToastMessage
  onDismiss: () => void
}) {
  const [isExiting, setIsExiting] = useState(false)
  const colors = colorMap[message.type]
  const duration = message.duration ?? 4000

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onDismiss(), 200)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border ${colors.bg} ${colors.border} ${colors.text} animate-fade-up ${isExiting ? 'animate-fade-out opacity-0' : ''} transition-opacity`}
    >
      <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>{iconMap[message.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{message.title}</p>
        {message.description && (
          <p className="text-xs mt-0.5 opacity-90">{message.description}</p>
        )}
      </div>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(onDismiss, 200)
        }}
        className={`flex-shrink-0 ${colors.icon} hover:opacity-70 transition-opacity focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-current rounded`}
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer({ messages, onDismiss }: Props) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {messages.map((msg) => (
        <div key={msg.id} className="pointer-events-auto">
          <ToastItem message={msg} onDismiss={() => onDismiss(msg.id)} />
        </div>
      ))}
    </div>
  )
}
