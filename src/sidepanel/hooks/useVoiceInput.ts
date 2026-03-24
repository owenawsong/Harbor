import { useCallback, useState, useRef, useEffect } from 'react'

interface UseVoiceInputOptions {
  onTranscribed: (text: string) => void
  language?: string
}

export function useVoiceInput({ onTranscribed, language = 'en-US' }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const onTranscribedRef = useRef(onTranscribed)

  // Keep onTranscribed ref up to date
  useEffect(() => {
    onTranscribedRef.current = onTranscribed
  }, [onTranscribed])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('[Voice Input] SpeechRecognition API not available in this browser/context')
      // Try to enable it if available through different means
      console.log('[Voice Input] Available window properties:', Object.keys(window).filter(k => k.includes('Speech') || k.includes('speech')))
      return
    }

    console.log('[Voice Input] SpeechRecognition API detected, initializing...')

    try {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.language = language

      let localInterim = ''

      recognition.onstart = () => {
        console.log('[Voice Input] Listening started')
        setIsListening(true)
        setInterimTranscript('')
        localInterim = ''
      }

      recognition.onresult = (event: any) => {
        localInterim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            console.log('[Voice Input] Final transcript:', transcript)
            onTranscribedRef.current(transcript)
            localInterim = ''
          } else {
            localInterim += transcript + ' '
          }
        }
        setInterimTranscript(localInterim)
      }

      recognition.onerror = (event: any) => {
        console.error('[Voice Input] Speech recognition error:', event.error)
        setIsListening(false)

        // Handle different error types
        if (event.error === 'no-speech') {
          setPermissionError('No speech detected. Please try again.')
        } else if (event.error === 'network') {
          setPermissionError('Network error. Please check your connection.')
        } else if (event.error === 'permission-denied') {
          setPermissionError('Microphone permission denied. Please allow access in browser settings.')
        } else if (event.error === 'not-allowed') {
          setPermissionError('Microphone access not allowed.')
        } else {
          setPermissionError(`Speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        console.log('[Voice Input] Listening ended')
        setIsListening(false)
        setInterimTranscript('')
      }

      recognitionRef.current = recognition
      console.log('[Voice Input] Initialization complete')
    } catch (err) {
      console.error('[Voice Input] Failed to initialize:', err)
      setPermissionError(`Failed to initialize voice input: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [language])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.warn('[Voice Input] Recognition not initialized yet')
      setPermissionError('Voice input is not available on this browser')
      return
    }
    try {
      console.log('[Voice Input] Starting listening...')
      recognitionRef.current.start()
    } catch (e) {
      console.error('[Voice Input] Error starting listening:', e)
      if (e instanceof Error) {
        setPermissionError(`Error: ${e.message}`)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      console.log('[Voice Input] Stopping listening...')
      recognitionRef.current.stop()
    } catch (e) {
      console.error('[Voice Input] Error stopping listening:', e)
    }
  }, [])

  const startListeningWithPermission = useCallback(async () => {
    setPermissionError(null)
    try {
      // For Chrome extensions, we can request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop())
      startListening()
    } catch (err) {
      const error = err as Error
      if (error.name === 'NotAllowedError') {
        setPermissionError('Microphone permission denied. Please allow access in browser settings.')
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No microphone found. Please check your audio device.')
      } else {
        setPermissionError(`Failed to access microphone: ${error.message}`)
      }
    }
  }, [startListening])

  return {
    isListening,
    isSupported,
    interimTranscript,
    permissionError,
    startListening: startListeningWithPermission,
    stopListening,
  }
}
