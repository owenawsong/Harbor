import React, { useState } from 'react'
import { Send, X, AlertCircle } from 'lucide-react'

interface AddInformationDialogProps {
  onSubmit: (info: string) => void
  onCancel: () => void
  currentStep?: string
}

export default function AddInformationDialog({
  onSubmit,
  onCancel,
  currentStep = 'browsing',
}: AddInformationDialogProps) {
  const [info, setInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!info.trim()) return
    setIsSubmitting(true)
    try {
      onSubmit(info)
      setInfo('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(var(--harbor-surface))] rounded-2xl shadow-2xl max-w-lg w-full border border-[rgb(var(--harbor-border))]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgb(var(--harbor-border))] flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>
            Add Information
          </h2>
          <button
            onClick={onCancel}
            className="text-[rgb(var(--harbor-text-faint))] hover:text-[rgb(var(--harbor-text))]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgb(var(--harbor-surface-2))]">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'rgb(var(--harbor-accent))' }} />
            <div>
              <p className="text-xs font-medium" style={{ color: 'rgb(var(--harbor-text))' }}>
                Provide additional context or correction
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                The agent will restart from a checkpoint and incorporate your information.
              </p>
            </div>
          </div>

          {currentStep && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                Current Step
              </p>
              <p className="text-xs px-3 py-2 rounded-lg bg-[rgb(var(--harbor-surface-2))]" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
                {currentStep}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'rgb(var(--harbor-text))' }}>
              Add information:
            </label>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              placeholder="E.g., 'The password is 12345' or 'Skip this step, try logging in instead'"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] text-xs text-[rgb(var(--harbor-text))] placeholder:text-[rgb(var(--harbor-text-faint))] resize-none focus:border-[rgb(var(--harbor-accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--harbor-accent) / 0.2)]"
              rows={4}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgb(var(--harbor-border))] flex gap-2">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg border border-[rgb(var(--harbor-border))] text-xs font-medium hover:bg-[rgb(var(--harbor-surface-2))] disabled:opacity-50 transition"
            style={{ color: 'rgb(var(--harbor-text-muted))' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!info.trim() || isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg bg-harbor-600 hover:bg-harbor-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center justify-center gap-1.5 transition"
          >
            <Send size={13} />
            Restart with Info
          </button>
        </div>
      </div>
    </div>
  )
}
