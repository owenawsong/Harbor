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
    // Check for SpeechRecognition API availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('[Voice Input] SpeechRecognition API not available in this browser/context')
      setIsSupported(false)
      return
    }

    console.log('[Voice Input] SpeechRecognition API detected, initializing...')

    // Test if we can actually create an instance
    let recognition: any
    try {
      recognition = new SpeechRecognition()
    } catch (err) {
      console.error('[Voice Input] Failed to create SpeechRecognition instance:', err)
      setIsSupported(false)
      setPermissionError('Voice input requires microphone permission. Please enable it in your browser settings.')
      return
    }

    try {
      setIsSupported(true)
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

    // Try direct SpeechRecognition first (works in most cases for extensions)
    try {
      console.log('[Voice Input] Attempting to start speech recognition directly...')
      startListening()
      return
    } catch (err) {
      console.log('[Voice Input] Direct start failed, will try with getUserMedia...')
    }

    // Fallback: Try to request microphone permission explicitly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop())
      // Now try speech recognition
      try {
        startListening()
      } catch (speechErr) {
        console.error('[Voice Input] Speech recognition failed after permission:', speechErr)
        setPermissionError('Voice input failed. Please check your browser settings.')
      }
    } catch (err) {
      const error = err as Error
      console.error('[Voice Input] Permission request failed:', error)

      if (error.name === 'NotAllowedError') {
        setPermissionError('Microphone permission denied. Please click the microphone icon in your address bar to enable access.')
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No microphone found. Please check your audio device is connected.')
      } else if (error.name === 'NotSupportedError') {
        setPermissionError('Your browser does not support microphone access in extensions.')
      } else {
        setPermissionError(`Microphone access failed: ${error.message}`)
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
