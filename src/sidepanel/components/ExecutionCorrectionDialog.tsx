import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Send } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (correction: string) => void
  isSubmitting?: boolean
}

export default function ExecutionCorrectionDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim())
      setText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 animate-fade-in">
      <div
        className="bg-[rgb(var(--harbor-bg))] rounded-2xl border border-[rgb(var(--harbor-border))] shadow-xl max-w-sm w-[90%] animate-scale-in"
        style={{
          '--scale-in-from': '0.95',
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--harbor-border))]">
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>
            {t('chat.correction_title')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[rgb(var(--harbor-surface-2))] transition-colors"
            title={t('common.close')}
          >
            <X size={16} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            {t('chat.correction_description')}
          </p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.correction_placeholder')}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none border border-[rgb(var(--harbor-border))] outline-none transition-colors focus:border-[rgb(var(--harbor-accent))]"
            style={{
              background: 'rgb(var(--harbor-surface))',
              color: 'rgb(var(--harbor-text))',
              minHeight: '100px',
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[rgb(var(--harbor-border))]">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgb(var(--harbor-border))] transition-colors hover:bg-[rgb(var(--harbor-surface-2))] disabled:opacity-50"
            style={{ color: 'rgb(var(--harbor-text-muted))' }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50"
            style={{ background: 'rgb(var(--harbor-accent))' }}
          >
            <Send size={12} />
            {t('chat.send_correction')}
          </button>
        </div>
      </div>
    </div>
  )
}
