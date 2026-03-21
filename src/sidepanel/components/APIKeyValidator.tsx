import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react'
import type { ProviderName } from '../../shared/types'

interface Props {
  provider: ProviderName
  apiKey: string
  onValidationChange?: (isValid: boolean | null) => void
}

export default function APIKeyValidator({ provider, apiKey, onValidationChange }: Props) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null)

  const validateKey = async () => {
    if (!apiKey || !apiKey.trim()) {
      setValidationResult('invalid')
      onValidationChange?.(false)
      return
    }

    setIsValidating(true)
    try {
      // Send validation request to background
      chrome.runtime.sendMessage(
        { type: 'validate_api_key', provider, apiKey },
        (response) => {
          const isValid = response?.success ?? false
          setValidationResult(isValid ? 'valid' : 'invalid')
          onValidationChange?.(isValid)
          setIsValidating(false)
        }
      )
    } catch (error) {
      setValidationResult('invalid')
      onValidationChange?.(false)
      setIsValidating(false)
    }
  }

  if (!apiKey) return null

  return (
    <button
      onClick={validateKey}
      disabled={isValidating}
      className="flex items-center gap-1.5 text-xs font-medium mt-2 transition-all"
    >
      {isValidating ? (
        <>
          <Loader size={12} className="animate-spin text-blue-500" />
          <span className="text-blue-600">Testing…</span>
        </>
      ) : validationResult === 'valid' ? (
        <>
          <CheckCircle2 size={12} className="text-green-500" />
          <span className="text-green-600">Valid</span>
        </>
      ) : validationResult === 'invalid' ? (
        <>
          <AlertCircle size={12} className="text-red-500" />
          <span className="text-red-600">Invalid key</span>
        </>
      ) : (
        <span className="text-[rgb(var(--harbor-text-faint))]">Validate key</span>
      )}
    </button>
  )
}
