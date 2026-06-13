"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export interface VoiceInputOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

export interface VoiceInputState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  error: string | null
}

export interface UseVoiceInputReturn extends VoiceInputState {
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

// SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

const DEFAULT_OPTIONS: VoiceInputOptions = {
  lang: "vi-VN",
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
}

export function useVoiceInput(
  options: VoiceInputOptions = {},
  onFinalTranscript?: (transcript: string) => void
): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const optionsRef = useRef<VoiceInputOptions>({ ...DEFAULT_OPTIONS, ...options })

  const isSupported =
    typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = optionsRef.current.continuous || false
    recognition.interimResults = optionsRef.current.interimResults || true
    recognition.lang = optionsRef.current.lang || "vi-VN"
    recognition.maxAlternatives = optionsRef.current.maxAlternatives || 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      switch (event.error) {
        case "no-speech":
          setError("Không phát hiện giọng nói")
          break
        case "audio-capture":
          setError("Không thể truy cập microphone")
          break
        case "not-allowed":
          setError("Quyền truy cập microphone bị từ chối")
          break
        case "network":
          setError("Lỗi kết nối mạng")
          break
        default:
          setError(`Lỗi: ${event.error}`)
      }
    }

    recognition.onresult = (event) => {
      let finalTranscript = ""
      let interim = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript)
        setInterimTranscript("")
        onFinalTranscript?.(finalTranscript)
      } else {
        setInterimTranscript(interim)
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [onFinalTranscript])

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError("Speech recognition không được hỗ trợ")
      return
    }

    setError(null)
    setInterimTranscript("")

    try {
      recognitionRef.current.start()
    } catch (err) {
      // Recognition might already be started
      console.warn("Recognition already started:", err)
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
    } catch (err) {
      console.warn("Recognition stop error:", err)
    }
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    setInterimTranscript("")
    setError(null)
  }, [])

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
