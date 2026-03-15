/**
 * Harbor Logo Component
 * Displays the Harbor branding with the lighthouse icon
 * Can be configured to show just the icon or with text
 */

import React from 'react'

interface HarborLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: { container: 'w-5 h-5', text: 'text-xs' },
  md: { container: 'w-7 h-7', text: 'text-sm' },
  lg: { container: 'w-16 h-16', text: 'text-2xl' },
}

export default function HarborLogo({ size = 'md', showText = false, className = '' }: HarborLogoProps) {
  const sizes = sizeMap[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo - H in a circle */}
      <div className={`${sizes.container} rounded-lg bg-harbor-600 flex items-center justify-center flex-shrink-0`}>
        <span className={`${sizes.text} text-white font-bold`}>H</span>
      </div>

      {/* Text - optional */}
      {showText && (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-[rgb(var(--harbor-text))]">Harbor</span>
          <span className="text-xs text-[rgb(var(--harbor-text-muted))]">AI Agent</span>
        </div>
      )}
    </div>
  )
}
