"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useVoiceRecorder } from "./use-voice-recorder"
import { transcribeAudio } from "@/lib/client"

export function useSpeech(onResult: (text: string) => void, onInterimResult?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [hasSupport, setHasSupport] = useState(false)
  const [useBackendAsr, setUseBackendAsr] = useState(false)

  const voiceRecorder = useVoiceRecorder()
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptRef = useRef("")
  const manualStopRef = useRef(false)
  const autoVoiceActiveRef = useRef(false)

  const onResultRef = useRef(onResult)
  const onInterimResultRef = useRef(onInterimResult)
  useEffect(() => {
    onResultRef.current = onResult
    onInterimResultRef.current = onInterimResult
  }, [onResult, onInterimResult])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
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
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            onResultRef.current(finalTranscript.trim())
            transcriptRef.current = ""
          } else {
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
            setIsListening(false)
          } else if (event.error !== "aborted") {
            console.error("Speech recognition error:", event.error)
            setIsListening(false)
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      } else {
        setUseBackendAsr(true)
      }

      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis
      }

      setHasSupport(true) // We always have support via MediaRecorder or Web Speech
    }
  }, [])

  const startListening = useCallback(async (autoVoice = false) => {
    autoVoiceActiveRef.current = autoVoice
    manualStopRef.current = false
    transcriptRef.current = ""

    if (useBackendAsr) {
      try {
        await voiceRecorder.startRecording()
        setIsListening(true)
        if (onInterimResultRef.current) {
          onInterimResultRef.current("🎤 Đang ghi âm...")
        }
        return
      } catch (err) {
        console.warn("Backend ASR recording failed, falling back to Web Speech:", err)
        setUseBackendAsr(false)
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e: any) {
        if (e?.name !== "InvalidStateError") {
          console.error("startListening error:", e)
        }
      }
    }
  }, [useBackendAsr, voiceRecorder])

  const stopListening = useCallback(async () => {
    manualStopRef.current = true
    autoVoiceActiveRef.current = false
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (voiceRecorder.isRecording) {
      setIsListening(false)
      if (onInterimResultRef.current) {
        onInterimResultRef.current("⏳ Đang nhận diện giọng nói...")
      }
      const blob = await voiceRecorder.stopRecording()
      if (blob && blob.size > 0) {
        try {
          const res = await transcribeAudio(blob, "vi")
          if (res?.text && res.text.trim()) {
            onResultRef.current(res.text.trim())
          } else if (res?.engine === "browser-fallback" && recognitionRef.current) {
            setUseBackendAsr(false)
            recognitionRef.current.start()
            setIsListening(true)
          } else if (onInterimResultRef.current) {
            onInterimResultRef.current("")
          }
        } catch (err) {
          console.error("Error transcribing audio:", err)
          if (onInterimResultRef.current) onInterimResultRef.current("")
        }
      } else if (onInterimResultRef.current) {
        onInterimResultRef.current("")
      }
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch { /* ignore */ }
    }
    setIsListening(false)
  }, [voiceRecorder])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    if (!text) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "vi-VN"
    utterance.rate = 1.0

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
    volume: voiceRecorder.volume,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
