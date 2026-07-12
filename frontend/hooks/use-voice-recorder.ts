"use client"

import { useState, useRef, useCallback } from "react"

export interface UseVoiceRecorderReturn {
  isRecording: boolean
  audioBlob: Blob | null
  error: string | null
  volume: number
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  clearBlob: () => void
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startMetering = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        setVolume(Math.min(100, Math.round((avg / 128) * 100)))
        animationFrameRef.current = requestAnimationFrame(updateVolume)
      }
      updateVolume()
    } catch (e) {
      console.warn("Could not start audio volume metering:", e)
    }
  }, [])

  const stopMetering = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {})
    }
    audioContextRef.current = null
    analyserRef.current = null
    setVolume(0)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setAudioBlob(null)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      startMetering(stream)

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4"

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.start(200) // Collect chunks every 200ms
      setIsRecording(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Microphone access denied or unavailable"
      setError(msg)
      setIsRecording(false)
    }
  }, [startMetering])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false)
        stopMetering()
        resolve(audioBlob)
        return
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm"
        const finalBlob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(finalBlob)
        setIsRecording(false)
        stopMetering()

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        resolve(finalBlob)
      }

      recorder.stop()
    })
  }, [audioBlob, stopMetering])

  const clearBlob = useCallback(() => {
    setAudioBlob(null)
  }, [])

  return {
    isRecording,
    audioBlob,
    error,
    volume,
    startRecording,
    stopRecording,
    clearBlob,
  }
}
