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
      setPermissionError('Voice input is not available in this browser. Please try a different browser like Chrome or Edge.')
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
      setPermissionError(`Voice input setup failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return
    }

    try {
      setIsSupported(true)
      recognition.continuous = true
      recognition.interimResults = true
      recognition.language = language
      // For extension context, ensure max alternatives is set
      recognition.maxAlternatives = 1

      let localInterim = ''

      recognition.onstart = () => {
        console.log('[Voice Input] Listening started successfully')
        setIsListening(true)
        setInterimTranscript('')
        setPermissionError(null) // Clear any previous errors
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

        // Handle different error types with helpful messages
        if (event.error === 'no-speech') {
          setPermissionError('No speech detected. Please try speaking again.')
        } else if (event.error === 'network') {
          setPermissionError('Network error. Please check your internet connection.')
        } else if (event.error === 'permission-denied' || event.error === 'not-allowed') {
          setPermissionError('Microphone access denied. Click the microphone icon in your browser\'s address bar to enable access.')
        } else if (event.error === 'service-not-allowed') {
          setPermissionError('Voice input service is not available. Please check browser settings.')
        } else if (event.error === 'bad-grammar') {
          setPermissionError('Language settings issue. Please try again.')
        } else {
          setPermissionError(`Voice input error: ${event.error}. Please try again or check browser permissions.`)
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
      setIsSupported(false)
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

  const startListeningWithPermission = useCallback(() => {
    setPermissionError(null)

    // In extension context, directly start speech recognition
    // The browser will prompt for permission if needed
    console.log('[Voice Input] Starting speech recognition (browser will prompt for permission if needed)...')
    startListening()
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
