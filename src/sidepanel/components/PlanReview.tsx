import React, { useState } from 'react'
import { CheckCircle2, X, Edit2 } from 'lucide-react'

interface PlanReviewProps {
  plan: string
  onAccept: () => void
  onDecline: () => void
  onModify: (newPlan: string) => void
}

export default function PlanReview({ plan, onAccept, onDecline, onModify }: PlanReviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlan, setEditedPlan] = useState(plan)

  const handleModifyClick = () => {
    if (isEditing) {
      onModify(editedPlan)
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

  return (
    <div className="mx-3 mt-3 p-4 rounded-xl border-2 bg-[rgb(var(--harbor-surface-2))] border-[rgb(var(--harbor-accent) / 0.4)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--harbor-accent))' }}>
            📋 Agent Plan
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Review and approve the agent's plan before execution
          </p>
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editedPlan}
          onChange={(e) => setEditedPlan(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-xs text-[rgb(var(--harbor-text))] resize-none mb-3"
          rows={5}
          placeholder="Edit plan here..."
        />
      ) : (
        <div className="mb-3 p-3 rounded-lg bg-[rgb(var(--harbor-surface))] border border-[rgb(var(--harbor-border))] text-xs whitespace-pre-wrap" style={{ color: 'rgb(var(--harbor-text))' }}>
          {plan}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          disabled={isEditing}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition"
        >
          <CheckCircle2 size={14} />
          Approve Plan
        </button>
        <button
          onClick={handleModifyClick}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] hover:bg-[rgb(var(--harbor-surface))] text-xs font-medium transition"
          style={{ color: 'rgb(var(--harbor-text-muted))' }}
        >
          <Edit2 size={14} />
          {isEditing ? 'Done Editing' : 'Modify'}
        </button>
        <button
          onClick={onDecline}
          disabled={isEditing}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-500 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition"
          style={{ color: 'rgb(var(--harbor-text-muted))' }}
        >
          <X size={14} />
          Decline
        </button>
      </div>
    </div>
  )
}
