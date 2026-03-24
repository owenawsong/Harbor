import { useCallback, useState } from 'react'
import type { ToastMessage } from '../components/Toast'

export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const show = useCallback((
    title: string,
    options?: { type?: 'success' | 'error' | 'info' | 'warning'; description?: string; duration?: number }
  ) => {
    const id = Math.random().toString(36).slice(2, 11)
    const message: ToastMessage = {
      id,
      type: options?.type ?? 'info',
      title,
      description: options?.description,
      duration: options?.duration ?? 3000,
    }
    setMessages((prev) => [...prev, message])
    return id
  }, [])

  const success = useCallback((title: string, description?: string) => {
    return show(title, { type: 'success', description, duration: 4500 })
  }, [show])

  const error = useCallback((title: string, description?: string) => {
    return show(title, { type: 'error', description })
  }, [show])

  const info = useCallback((title: string, description?: string) => {
    return show(title, { type: 'info', description })
  }, [show])

  const warning = useCallback((title: string, description?: string) => {
    return show(title, { type: 'warning', description })
  }, [show])

  const dismiss = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return { messages, show, success, error, info, warning, dismiss }
}
