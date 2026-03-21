import React from 'react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export default function LoadingSpinner({ size = 'md', text, className = '' }: Props) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-2 border-harbor-600 border-t-transparent rounded-full animate-spin`}
        style={{
          borderTopColor: 'transparent',
        }}
      />
      {text && <span className="text-xs text-[rgb(var(--harbor-text-faint))]">{text}</span>}
    </div>
  )
}
