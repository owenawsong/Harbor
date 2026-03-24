import React, { createContext, useContext } from 'react'
import { useToast } from '../hooks/useToast'

interface ToastContextType {
  messages: any[]
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  )
}

export function useGlobalToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useGlobalToast must be used within ToastProvider')
  }
  return context
}
