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

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
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
            onTranscribed(transcript)
            localInterim = ''
          } else {
            localInterim += transcript + ' '
          }
        }
        setInterimTranscript(localInterim)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        setInterimTranscript('')
      }

      recognitionRef.current = recognition
    }
  }, [language, onTranscribed])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  return {
    isListening,
    isSupported,
    interimTranscript,
    startListening,
    stopListening,
  }
}
