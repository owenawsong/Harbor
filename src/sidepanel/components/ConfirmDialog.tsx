import React from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[rgb(var(--harbor-surface))] border border-[rgb(var(--harbor-border))] rounded-xl shadow-xl w-full max-w-sm animate-scale-in">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-[rgb(var(--harbor-border))]">
          {isDangerous && <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm" style={{ color: 'rgb(var(--harbor-text))' }}>
              {title}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
              {description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-surface))] hover:bg-[rgb(var(--harbor-surface-2))] text-sm font-medium text-[rgb(var(--harbor-text))] disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-harbor-600 hover:bg-harbor-700'
            }`}
          >
            {isLoading ? '…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
