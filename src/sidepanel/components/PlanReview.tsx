import React, { useState } from 'react'
import { CheckCircle2, X, Edit2, Globe, Lightbulb } from 'lucide-react'

interface PlanReviewProps {
  plan: string
  onAccept: () => void
  onDecline: () => void
  onModify: (newPlan: string) => void
}

// Parse plan from markdown format
function parsePlan(text: string): { sites: string[]; steps: string[] } {
  const sites: string[] = []
  const steps: string[] = []

  // Split by section headers (## format)
  const sections = text.split(/^##\s+/m)

  for (const section of sections) {
    const lines = section.split('\n')
    const header = lines[0]?.trim().toLowerCase() || ''

    if (header.includes('allow actions') && header.includes('sites')) {
      // Extract bulleted domains from this section
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        // Match lines starting with - (markdown bullet)
        const match = line.match(/^-\s+(.+)$/)
        if (match) {
          const domain = match[1].trim()
          // Extract just the domain without http/https/www
          const cleanDomain = domain
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0] // Remove path if present
          if (cleanDomain && !sites.includes(cleanDomain)) {
            sites.push(cleanDomain)
          }
        }
      }
    } else if (header.includes('approach') && header.includes('follow')) {
      // Extract numbered steps from this section
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        // Match lines starting with number (1. 2. etc.)
        const match = line.match(/^\d+\.\s+(.+)$/)
        if (match) {
          steps.push(match[1].trim())
        }
      }
    }
  }

  // Fallback: if no structured sections found, try to extract domains and steps the old way
  if (sites.length === 0 || steps.length === 0) {
    // Extract URLs/domains as fallback
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g
    let match
    while ((match = urlRegex.exec(text)) !== null) {
      const domain = match[1]
      if (!sites.includes(domain)) {
        sites.push(domain)
      }
    }

    // Extract numbered steps if not already found
    if (steps.length === 0) {
      const stepLines = text.split('\n')
      for (const line of stepLines) {
        const stepMatch = line.trim().match(/^(\d+\.?\s+)(.+)/)
        if (stepMatch) {
          steps.push(stepMatch[2].trim())
        }
      }
    }
  }

  return {
    sites: sites.slice(0, 6),
    steps: steps.slice(0, 8),
  }
}

export default function PlanReview({ plan, onAccept, onDecline, onModify }: PlanReviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlan, setEditedPlan] = useState(plan)
  const { sites, steps } = React.useMemo(() => parsePlan(plan), [plan])

  const handleModifyClick = () => {
    if (isEditing) {
      onModify(editedPlan)
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

  return (
    <div className="mx-3 mt-3 rounded-xl border-2 overflow-hidden animate-scale-in"
      style={{
        background: 'rgb(var(--harbor-surface-2))',
        borderColor: 'rgb(var(--harbor-accent) / 0.4)',
      }}>

      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'rgb(var(--harbor-accent))' }}>
          <Lightbulb size={16} />
          Harbor's plan
        </h3>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <textarea
            value={editedPlan}
            onChange={(e) => setEditedPlan(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-xs text-[rgb(var(--harbor-text))] resize-none mb-4"
            rows={10}
            placeholder="Edit plan here..."
          />
        ) : (
          <>
            {/* Sites Section */}
            {sites.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-medium mb-3" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                  Allow actions on these sites
                </h4>
                <div className="space-y-2">
                  {sites.map((site) => (
                    <div
                      key={site}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{
                        background: 'rgb(var(--harbor-surface))',
                      }}
                    >
                      <Globe size={14} style={{ color: 'rgb(var(--harbor-text-faint))', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: 'rgb(var(--harbor-text))' }}>
                        {site}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Steps Section */}
            {steps.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-medium mb-3" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                  Approach to follow
                </h4>
                <ol className="space-y-2.5">
                  {steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3"
                      style={{ color: 'rgb(var(--harbor-text))' }}
                    >
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{
                          backgroundColor: 'rgb(var(--harbor-accent) / 0.15)',
                          color: 'rgb(var(--harbor-accent))',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Full plan for reference */}
            {!isEditing && (
              <div
                className="p-3 rounded-lg text-xs border whitespace-pre-wrap"
                style={{
                  background: 'rgb(var(--harbor-surface))',
                  borderColor: 'rgb(var(--harbor-border))',
                  color: 'rgb(var(--harbor-text-faint))',
                  fontSize: '11px',
                  maxHeight: '120px',
                  overflow: 'auto',
                }}
              >
                {plan}
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
        <button
          onClick={onAccept}
          disabled={isEditing}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{
            backgroundColor: 'rgb(var(--harbor-accent))',
          }}
        >
          <CheckCircle2 size={16} />
          Approve plan
        </button>
        <button
          onClick={handleModifyClick}
          className="flex-1 px-3 py-2.5 rounded-lg border font-medium text-sm transition"
          style={{
            borderColor: 'rgb(var(--harbor-border))',
            color: 'rgb(var(--harbor-text-muted))',
          }}
        >
          <Edit2 size={14} className="inline mr-1.5" />
          {isEditing ? 'Save' : 'Make changes'}
        </button>
      </div>

      {/* Info text */}
      <div className="px-4 py-2.5 text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
        Harbor will only use the sites listed. You'll be asked before accessing anything else.
      </div>
    </div>
  )
}
