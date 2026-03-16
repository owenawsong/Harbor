import React from 'react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { box: 'w-5 h-5 rounded', text: 'text-[10px]' },
  md: { box: 'w-7 h-7 rounded-md', text: 'text-xs' },
  lg: { box: 'w-14 h-14 rounded-xl', text: 'text-2xl' },
}

export default function HarborLogo({ size = 'md', showText = false, className = '' }: Props) {
  const s = sizes[size]
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${s.box} bg-harbor-600 flex items-center justify-center flex-shrink-0`}>
        <span className={`${s.text} text-white font-bold tracking-tight`}>H</span>
      </div>
      {showText && (
        <div className="flex flex-col leading-none gap-0.5">
          <span className="font-semibold text-sm text-[rgb(var(--harbor-text))]">Harbor</span>
          <span className="text-[11px] text-[rgb(var(--harbor-text-muted))]">AI Agent</span>
        </div>
      )}
    </div>
  )
}
