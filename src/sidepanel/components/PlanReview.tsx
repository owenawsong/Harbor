import React, { useState, useMemo } from 'react'
import { CheckCircle2, X, Edit2, Globe } from 'lucide-react'

interface PlanReviewProps {
  plan: string
  onAccept: () => void
  onDecline: () => void
  onModify: (newPlan: string) => void
}

// Parse plan text to extract sites and steps
function parsePlan(text: string): { sites: string[]; steps: string[] } {
  const sites = new Set<string>()
  const steps: string[] = []

  // Extract URLs/domains
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g
  let match
  while ((match = urlRegex.exec(text)) !== null) {
    sites.add(match[1])
  }

  // Extract numbered steps
  const stepLines = text.split('\n')
  for (const line of stepLines) {
    const stepMatch = line.trim().match(/^(\d+\.?\s+)(.+)/)
    if (stepMatch) {
      steps.push(stepMatch[2].trim())
    } else if (line.trim() && !line.includes('http') && !line.includes('visit')) {
      // Also capture non-numbered lines that look like steps
      const cleaned = line.trim()
      if (cleaned.length > 5 && !steps.includes(cleaned)) {
        steps.push(cleaned)
      }
    }
  }

  return {
    sites: Array.from(sites).slice(0, 5), // Limit to 5 sites for display
    steps: steps.slice(0, 8), // Limit to 8 steps for display
  }
}

export default function PlanReview({ plan, onAccept, onDecline, onModify }: PlanReviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlan, setEditedPlan] = useState(plan)
  const { sites, steps } = useMemo(() => parsePlan(plan), [plan])

  const handleModifyClick = () => {
    if (isEditing) {
      onModify(editedPlan)
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

  return (
    <div className="mx-3 mt-3 p-4 rounded-xl border-2 bg-[rgb(var(--harbor-surface-2))] border-[rgb(var(--harbor-accent) / 0.4)] animate-scale-in">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'rgb(var(--harbor-accent))' }}>
          ≡ Harbor's plan
        </h3>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          Review the plan before Harbor takes any actions
        </p>
      </div>

      {isEditing ? (
        <textarea
          value={editedPlan}
          onChange={(e) => setEditedPlan(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-xs text-[rgb(var(--harbor-text))] resize-none mb-4"
          rows={8}
          placeholder="Edit plan here..."
        />
      ) : (
        <>
          {/* Sites Section */}
          {sites.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium mb-2" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                Allow actions on these sites
              </h4>
              <div className="space-y-1.5">
                {sites.map((site) => (
                  <div
                    key={site}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[rgb(var(--harbor-surface))] border border-[rgb(var(--harbor-border))]"
                  >
                    <Globe size={12} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
                    <span className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>
                      {site}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps Section */}
          {steps.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium mb-2" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                Approach to follow
              </h4>
              <ol className="space-y-2">
                {steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 text-xs"
                    style={{ color: 'rgb(var(--harbor-text))' }}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: 'rgb(var(--harbor-accent) / 0.2)',
                        color: 'rgb(var(--harbor-accent))',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Full Plan Text */}
          <div
            className="p-3 rounded-lg bg-[rgb(var(--harbor-surface))] border border-[rgb(var(--harbor-border))] text-xs whitespace-pre-wrap"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            {plan}
          </div>
        </>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onAccept}
          disabled={isEditing}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-medium text-xs transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{
            backgroundColor: 'rgb(var(--harbor-accent))',
          }}
        >
          <CheckCircle2 size={14} />
          Approve plan
        </button>
        <button
          onClick={handleModifyClick}
          className="flex-1 px-3 py-2.5 rounded-lg border font-medium text-xs transition"
          style={{
            borderColor: 'rgb(var(--harbor-border))',
            color: 'rgb(var(--harbor-text-muted))',
          }}
        >
          <Edit2 size={12} className="inline mr-1" />
          {isEditing ? 'Done' : 'Make changes'}
        </button>
        <button
          onClick={onDecline}
          disabled={isEditing}
          className="flex-1 px-3 py-2.5 rounded-lg border font-medium text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: 'rgb(var(--harbor-border))',
            color: 'rgb(var(--harbor-text-muted))',
          }}
        >
          <X size={12} className="inline mr-1" />
          Decline
        </button>
      </div>
    </div>
  )
}
