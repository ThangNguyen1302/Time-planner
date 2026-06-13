"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export interface TTSOptions {
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

export interface TTSState {
  isSpeaking: boolean
  isPaused: boolean
  isSupported: boolean
  voices: SpeechSynthesisVoice[]
}

export interface UseTTSReturn extends TTSState {
  speak: (text: string, options?: TTSOptions) => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
  setVoice: (voiceName: string) => void
}

const DEFAULT_OPTIONS: TTSOptions = {
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: "vi-VN",
}

export function useTTS(defaultOptions: TTSOptions = {}): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const optionsRef = useRef<TTSOptions>({ ...DEFAULT_OPTIONS, ...defaultOptions })

  const isSupported = typeof window !== "undefined" && !!window.speechSynthesis

  // Initialize and load voices
  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)

      // Try to find Vietnamese voice
      const vietnameseVoice = availableVoices.find(
        (v) => v.lang.includes("vi") || v.lang.includes("VI")
      )
      if (vietnameseVoice && !selectedVoice) {
        setSelectedVoice(vietnameseVoice.name)
      }
    }

    // Load voices immediately if available
    loadVoices()

    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [isSupported, selectedVoice])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = useCallback(
    async (text: string, options?: TTSOptions): Promise<void> => {
      if (!isSupported || !text.trim()) {
        return
      }

      return new Promise((resolve, reject) => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        // Merge options
        const mergedOptions = { ...optionsRef.current, ...options }

        // Set voice
        const voiceName = mergedOptions.voice || selectedVoice
        if (voiceName) {
          const voice = voices.find((v) => v.name === voiceName)
          if (voice) {
            utterance.voice = voice
          }
        }

        // Set other properties
        utterance.rate = mergedOptions.rate || 1
        utterance.pitch = mergedOptions.pitch || 1
        utterance.volume = mergedOptions.volume || 1
        utterance.lang = mergedOptions.lang || "vi-VN"

        // Event handlers
        utterance.onstart = () => {
          setIsSpeaking(true)
          setIsPaused(false)
        }

        utterance.onend = () => {
          setIsSpeaking(false)
          setIsPaused(false)
          utteranceRef.current = null
          resolve()
        }

        utterance.onerror = (event) => {
          setIsSpeaking(false)
          setIsPaused(false)
          utteranceRef.current = null
          if (event.error !== "canceled") {
            reject(new Error(`TTS Error: ${event.error}`))
          } else {
            resolve()
          }
        }

        utterance.onpause = () => {
          setIsPaused(true)
        }

        utterance.onresume = () => {
          setIsPaused(false)
        }

        // Speak
        window.speechSynthesis.speak(utterance)
      })
    },
    [isSupported, voices, selectedVoice]
  )

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    utteranceRef.current = null
  }, [isSupported])

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return
    window.speechSynthesis.pause()
    setIsPaused(true)
  }, [isSupported, isSpeaking])

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return
    window.speechSynthesis.resume()
    setIsPaused(false)
  }, [isSupported, isPaused])

  const setVoice = useCallback((voiceName: string) => {
    setSelectedVoice(voiceName)
  }, [])

  return {
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    speak,
    stop,
    pause,
    resume,
    setVoice,
  }
}
