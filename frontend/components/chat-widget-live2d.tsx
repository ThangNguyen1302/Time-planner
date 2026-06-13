"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSWRConfig } from "swr"
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, Volume2, VolumeX, Mic, MicOff, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Live2DAvatar, type Live2DExpression } from "@/components/live2d"
import { useTTS } from "@/hooks/use-tts"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { backendRequest } from "@/lib/client"
import type { Message, Avatar } from "@/lib/types"

interface ChatWidgetProps {
  avatar?: Avatar
}

type AssistantChatMessage = Message & {
  emotion_intensity?: number
}

// Map mood to Live2D expression
const moodToExpression: Record<string, Live2DExpression> = {
  neutral: "neutral",
  happy: "happy",
  encouraging: "happy",
  serious: "thinking",
  warning: "sad",
  sad: "sad",
  angry: "angry",
  surprised: "surprised",
  thinking: "thinking",
  shy: "shy",       // Huohuo: khi được khen hoặc xấu hổ
  scared: "scared", // Huohuo: khi gặp khó khăn
}

export function ChatWidgetLive2D({ avatar }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentExpression, setCurrentExpression] = useState<Live2DExpression>("neutral")
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(false)
  const [live2dError, setLive2dError] = useState(false)
  const [triggerMotion, setTriggerMotion] = useState<string | null>(null)
  const [emotionIntensity, setEmotionIntensity] = useState(0.5)
  const { mutate } = useSWRConfig()
  
  const scrollRootRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    const root = scrollRootRef.current
    const viewport = root?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement | null
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight
  }, [])
  
  // TTS hook
  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useTTS({
    lang: "vi-VN",
    rate: 1,
    pitch: 1,
  })

  // Voice input hook
  const { 
    isListening, 
    isSupported: voiceSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error: voiceError,
  } = useVoiceInput({ lang: "vi-VN" }, (text) => {
    // When final transcript is received, add to input
    setInput((prev) => prev + text + " ")
  })

  // Auto scroll
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle voice input toggle
  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening()
      // Send message if we have transcript
      if (input.trim()) {
        sendMessage(input.trim())
        setInput("")
        resetTranscript()
      }
    } else {
      setInput("")
      resetTranscript()
      startListening()
    }
    setVoiceInputEnabled(!isListening)
  }, [isListening, input, stopListening, startListening, resetTranscript])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    // Stop any ongoing speech
    if (isSpeaking) {
      stopSpeaking()
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || "",
      user_id: "",
      role: "user",
      content,
      actions: [],
      quick_replies: [],
      is_proactive: false,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setCurrentExpression("thinking")

    try {
      const data = await backendRequest<{
        conversationId?: string
        message?: AssistantChatMessage
        actions?: { type: string }[]
      }>("/api/v1/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          message: content,
          conversationId,
        }),
      })

      if (data.conversationId) {
        setConversationId(data.conversationId)
      }

      const assistantMessage = data.message
      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage])
        
        // Update expression based on mood
        const mood = assistantMessage.mood || "neutral"
        setCurrentExpression(moodToExpression[mood] || "neutral")
        
        // Update emotion intensity from response
        const intensity = typeof assistantMessage.emotion_intensity === "number" 
          ? assistantMessage.emotion_intensity 
          : 0.5
        setEmotionIntensity(intensity)
        
        // Trigger contextual motion based on actions performed
        const actions = data.actions ?? []
        if (actions.length > 0) {
          const actionTypes = actions.map((a: { type: string }) => a.type)
          if (actionTypes.includes("create_task") || actionTypes.includes("update_task")) {
            mutate("/api/v1/tasks")
            mutate((key) => typeof key === "string" && key.startsWith("/api/v1/time-blocks"))
          }
          if (actionTypes.includes("create_event") || actionTypes.includes("update_event")) {
            mutate("/api/v1/events")
            mutate((key) => typeof key === "string" && key.startsWith("/api/v1/time-blocks"))
          }
          
          if (
            actionTypes.includes("create_task") ||
            actionTypes.includes("create_event") ||
            actionTypes.includes("update_task") ||
            actionTypes.includes("update_event")
          ) {
            // Huohuo happy when successfully helping
            setTriggerMotion("Happy")
          } else if (actionTypes.includes("mark_done")) {
            // Celebrate completion
            setTriggerMotion("Happy")
          } else if (actionTypes.includes("reschedule")) {
            // Acknowledgment motion
            setTriggerMotion("Tap")
          }
        } else if (mood === "warning" || mood === "scared") {
          // Worried reaction
          setTriggerMotion("Sad")
        } else if (mood === "surprised") {
          // Startled reaction  
          setTriggerMotion("Tap")
        }

        // Speak response if TTS enabled
        if (ttsEnabled && ttsSupported && assistantMessage.content) {
          await speak(assistantMessage.content)
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      setCurrentExpression("scared")  // Huohuo scared when error occurs
      setTriggerMotion("Sad")
    } finally {
      setIsLoading(false)
      // Reset motion trigger after a short delay
      setTimeout(() => setTriggerMotion(null), 500)
      // Reset to neutral after a while
      setTimeout(() => setCurrentExpression("neutral"), 3000)
    }
  }

  const handleQuickReply = (reply: string) => {
    sendMessage(reply)
  }

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case "happy":
        return "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700"
      case "serious":
        return "bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700"
      case "encouraging":
        return "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
      case "warning":
        return "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700"
      default:
        return "bg-muted border-border"
    }
  }

  const handleLive2DError = useCallback(() => {
    setLive2dError(true)
  }, [])

  // Widget dimensions based on expanded state
  const widgetWidth = isExpanded ? "w-[420px]" : "w-96"
  const widgetHeight = isExpanded ? "h-[520px]" : "h-[32rem]"

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90",
          isOpen && "hidden",
        )}
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat panel */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 bg-background border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300",
          widgetWidth,
          widgetHeight
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {avatar?.avatar_url && !live2dError ? (
                  <img
                    src={avatar.avatar_url || "/placeholder.svg"}
                    alt={avatar.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <Bot className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{avatar?.name || "Trợ lý AI"}</p>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Đang suy nghĩ..." : isSpeaking ? "Đang nói..." : "Sẵn sàng hỗ trợ"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* TTS Toggle */}
              {ttsSupported && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking()
                    setTtsEnabled(!ttsEnabled)
                  }}
                  className="h-8 w-8"
                  title={ttsEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              )}
              {/* Expand Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              {/* Close */}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Live2D Avatar Section (kept mounted to avoid reloading) */}
          {!live2dError && (
            <div
              className={cn(
                "relative bg-linear-to-b from-primary/5 to-transparent flex items-center justify-center border-b border-border/50 overflow-hidden transition-all duration-300",
                isExpanded ? "h-64 opacity-100" : "h-0 opacity-0"
              )}
              aria-hidden={!isExpanded}
            >
              <Live2DAvatar
                modelPath="/live2d/hiyori/huohuo/huohuo.model3.json"
                width={360}
                height={240}
                expression={currentExpression}
                isSpeaking={isSpeaking}
                fitMode="cover"
                // Shift model down a bit so the visible area focuses on head/upper body.
                focusY={0.1}
                motionPreload="IDLE"
                triggerMotion={triggerMotion}
                emotionIntensity={emotionIntensity}
                onError={handleLive2DError}
                onMotionTriggered={() => setTriggerMotion(null)}
                className="cursor-pointer"
              />
              {/* Expression indicator */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 rounded-full text-xs">
                {currentExpression === "thinking" && "🤔"}
                {currentExpression === "happy" && "😊"}
                {currentExpression === "sad" && "😢"}
                {currentExpression === "neutral" && "😌"}
                {currentExpression === "surprised" && "😮"}
                {currentExpression === "angry" && "😠"}
                {currentExpression === "shy" && "😳"}
                {currentExpression === "scared" && "😰"}
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRootRef} className="flex-1 min-h-0">
            <ScrollArea className="h-full p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mb-4 text-primary/30" />
                <p className="text-sm font-medium">Xin chào! 👋</p>
                <p className="text-xs mt-1 max-w-62.5">
                  Tôi là trợ lý AI của bạn. Hãy nói chuyện với tôi bằng giọng nói hoặc tin nhắn!
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {["Lịch hôm nay?", "Tạo task mới", "Thống kê tuần"].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent"
                      onClick={() => sendMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : cn("border", getMoodColor(msg.mood)),
                      )}
                    >
                      <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>

                      {/* Quick replies */}
                      {msg.role === "assistant" && msg.quick_replies && msg.quick_replies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {msg.quick_replies.map((reply, i) => (
                            <Button
                              key={i}
                              variant="ghost"
                              size="sm"
                              className="h-auto py-1 px-2 text-xs bg-background/50 hover:bg-background"
                              onClick={() => handleQuickReply(reply)}
                            >
                              {reply}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Actions taken indicator */}
                      {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            ✅ Đã thực hiện: {msg.actions.map((a) => a.type).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
            </ScrollArea>
          </div>

          {/* Voice indicator */}
          {isListening && (
            <div className="px-4 py-2 bg-primary/10 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  {interimTranscript || "Đang nghe..."}
                </span>
              </div>
            </div>
          )}

          {/* Voice error */}
          {voiceError && (
            <div className="px-4 py-2 bg-red-100 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
              <span className="text-xs text-red-600 dark:text-red-400">{voiceError}</span>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (isListening) {
                  stopListening()
                }
                sendMessage(input)
              }}
              className="flex gap-2"
            >
              {/* Voice input button */}
              {voiceSupported && (
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                  className="shrink-0"
                  title={isListening ? "Dừng nghe" : "Nói"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Đang nghe..." : "Nhập tin nhắn..."}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
