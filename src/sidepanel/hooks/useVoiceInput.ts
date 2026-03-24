import { useCallback, useState, useRef, useEffect } from 'react'

interface UseVoiceInputOptions {
  onTranscribed: (text: string) => void
  language?: string
}

export function useVoiceInput({ onTranscribed, language = 'en-US' }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
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

  return {
    isListening,
    isSupported,
    interimTranscript,
    startListening,
    stopListening,
  }
}
