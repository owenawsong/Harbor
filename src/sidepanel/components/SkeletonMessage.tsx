import React from 'react'

export default function SkeletonMessage() {
  return (
    <div className="mb-4 space-y-2 animate-fade-in">
      {/* Avatar placeholder */}
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-lg bg-[rgb(var(--harbor-surface-2))] animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          {/* Text lines */}
          <div className="h-3 bg-[rgb(var(--harbor-surface-2))] rounded-md animate-pulse max-w-xs" />
          <div className="h-3 bg-[rgb(var(--harbor-surface-2))] rounded-md animate-pulse max-w-sm" />
          <div className="h-3 bg-[rgb(var(--harbor-surface-2))] rounded-md animate-pulse max-w-[80%]" />
        </div>
      </div>
    </div>
  )
}
