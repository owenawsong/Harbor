import React from 'react'
import { CheckCircle2, AlertCircle, Zap, Loader } from 'lucide-react'

export type StatusType = 'success' | 'error' | 'warning' | 'loading' | 'neutral'

interface Props {
  status: StatusType
  label: string
  icon?: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    icon: <CheckCircle2 size={14} />,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    icon: <AlertCircle size={14} />,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    icon: <AlertCircle size={14} />,
  },
  loading: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    icon: <Loader size={14} className="animate-spin" />,
  },
  neutral: {
    bg: 'bg-[rgb(var(--harbor-surface-2))]',
    text: 'text-[rgb(var(--harbor-text-muted))]',
    icon: <Zap size={14} />,
  },
}

export default function StatusBadge({
  status,
  label,
  icon,
  size = 'sm',
  className = '',
}: Props) {
  const config = statusConfig[status]
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full ${config.bg} ${config.text} ${sizeClass} ${className}`}
    >
      {icon ?? config.icon}
      <span className="font-medium">{label}</span>
    </div>
  )
}
