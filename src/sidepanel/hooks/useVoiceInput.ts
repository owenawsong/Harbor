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
    if (!SpeechRecognition) return

    setIsSupported(true)
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.language = language

    let localInterim = ''

    recognition.onstart = () => {
      setIsListening(true)
      setInterimTranscript('')
      localInterim = ''
    }

    recognition.onresult = (event: any) => {
      localInterim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          onTranscribedRef.current(transcript)
          localInterim = ''
        } else {
          localInterim += transcript + ' '
        }
      }
      setInterimTranscript(localInterim)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
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
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
  }, [language])

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.error('Error starting listening:', e)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.error('Error stopping listening:', e)
      }
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
