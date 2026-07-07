import { useState, useEffect, useRef, useCallback } from "react"

export function useSpeech(onResult: (text: string) => void, onInterimResult?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [hasSupport, setHasSupport] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptRef = useRef("")
  // Tracks whether we deliberately stopped (vs. natural end / error)
  const manualStopRef = useRef(false)
  // Tracks whether autoVoiceMode is active for restart-on-no-speech
  const autoVoiceActiveRef = useRef(false)

  const onResultRef = useRef(onResult)
  const onInterimResultRef = useRef(onInterimResult)
  useEffect(() => {
    onResultRef.current = onResult
    onInterimResultRef.current = onInterimResult
  }, [onResult, onInterimResult])

  const restartListening = useCallback(() => {
    if (!recognitionRef.current || !autoVoiceActiveRef.current) return
    // Small delay to allow browser to reset the recognition engine
    setTimeout(() => {
      if (!autoVoiceActiveRef.current) return
      try {
        transcriptRef.current = ""
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        // Already running or not available — ignore
      }
    }, 300)
  }, [])

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false   // Let it end naturally; we restart manually
        recognition.interimResults = true
        recognition.lang = "vi-VN"

        recognition.onresult = (event: any) => {
          let interimTranscript = ""
          let finalTranscript = ""

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
            } else {
              interimTranscript += result[0].transcript
            }
          }

          const displayText = finalTranscript || interimTranscript
          transcriptRef.current = displayText

          if (onInterimResultRef.current) {
            onInterimResultRef.current(displayText)
          }

          if (finalTranscript.trim()) {
            // Final result ready — send immediately
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            onResultRef.current(finalTranscript.trim())
            transcriptRef.current = ""
          } else {
            // Interim only — set a fallback timeout in case isFinal never fires
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
              const text = transcriptRef.current.trim()
              if (text) {
                onResultRef.current(text)
                transcriptRef.current = ""
              }
            }, 2000)
          }
        }

        recognition.onerror = (event: any) => {
          if (event.error === "no-speech") {
            // Silence timeout — restart automatically in auto-voice mode
            setIsListening(false)
            if (!manualStopRef.current) {
              restartListening()
            }
          } else if (event.error === "aborted") {
            // Intentional abort — do nothing extra
            setIsListening(false)
          } else {
            console.error("Speech recognition error:", event.error)
            setIsListening(false)
          }
        }

        recognition.onend = () => {
          setIsListening(false)
          // If we ended naturally (result processed) and auto-voice is on, restart
          if (!manualStopRef.current && autoVoiceActiveRef.current) {
            restartListening()
          }
        }

        recognitionRef.current = recognition
      }

      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis
      }

      setHasSupport(!!SpeechRecognition && !!window.speechSynthesis)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startListening = useCallback((autoVoice = false) => {
    if (!recognitionRef.current) return
    autoVoiceActiveRef.current = autoVoice
    manualStopRef.current = false
    transcriptRef.current = ""
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (e: any) {
      // "already started" — state is fine, ignore
      if (e?.name !== "InvalidStateError") {
        console.error("startListening error:", e)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    manualStopRef.current = true
    autoVoiceActiveRef.current = false
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    try {
      recognitionRef.current.stop()
    } catch { /* ignore */ }
    setIsListening(false)
  }, [])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    if (!text) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "vi-VN"
    utterance.rate = 1.0

    // Try to find a Vietnamese voice, fallback to default
    const loadVoiceAndSpeak = () => {
      const voices = synthRef.current!.getVoices()
      const viVoice = voices.find(v => v.lang.startsWith("vi"))
      if (viVoice) utterance.voice = viVoice

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        if (onEnd) onEnd()
      }
      utterance.onerror = () => setIsSpeaking(false)

      synthRef.current!.speak(utterance)
    }

    // Voices may not be loaded yet on first call
    if (synthRef.current.getVoices().length === 0) {
      synthRef.current.onvoiceschanged = () => {
        loadVoiceAndSpeak()
        synthRef.current!.onvoiceschanged = null
      }
    } else {
      loadVoiceAndSpeak()
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    setIsSpeaking(false)
  }, [])

  return {
    isListening,
    isSpeaking,
    hasSupport,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
