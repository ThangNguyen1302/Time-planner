"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSWRConfig } from "swr"
import { toast } from "sonner"
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, Maximize2, Minimize2, Mic, MicOff, Square, Trash2, ArrowUp, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Live2DAvatar, type Live2DExpression } from "@/components/live2d"
import { backendRequest, undoAssistantAction } from "@/lib/client"
import type { Message, Avatar, AssistantAction } from "@/lib/types"
import { useSpeech } from "@/hooks/use-speech"
import { TaskCardList, EventCardList, type TaskCardData, type EventCardData } from "@/components/assistant-query-cards"

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
  shy: "shy",
  scared: "scared",
}

// Mood → accent token for bubble left border + subtle tint
const moodAccent: Record<string, { bar: string; tint: string }> = {
  happy: { bar: "before:bg-emerald-500", tint: "dark:bg-emerald-500/5" },
  serious: { bar: "before:bg-orange-500", tint: "dark:bg-orange-500/5" },
  encouraging: { bar: "before:bg-blue-500", tint: "dark:bg-blue-500/5" },
  warning: { bar: "before:bg-rose-500", tint: "dark:bg-rose-500/5" },
  sad: { bar: "before:bg-sky-500", tint: "dark:bg-sky-500/5" },
  surprised: { bar: "before:bg-violet-500", tint: "dark:bg-violet-500/5" },
  thinking: { bar: "before:bg-amber-500", tint: "dark:bg-amber-500/5" },
  shy: { bar: "before:bg-pink-500", tint: "dark:bg-pink-500/5" },
  neutral: { bar: "before:bg-primary", tint: "" },
}

function formatActionLabel(action: AssistantAction): string {
  const typeMap: Record<string, string> = {
    create_task: "Tạo công việc",
    update_task: "Cập nhật công việc",
    delete_task: "Xóa công việc",
    create_event: "Tạo sự kiện",
    update_event: "Cập nhật sự kiện",
    delete_event: "Xóa sự kiện",
    query_task: "Tìm kiếm công việc",
    query_event: "Tìm kiếm sự kiện",
    query_schedule: "Danh sách lịch trình",
    query_stats: "Thống kê tiến độ",
  }
  const label = typeMap[action.type] || action.type
  const title = (action.result?.title || action.data?.title || action.data?.keyword) as string | undefined
  return title ? `${label}: "${title}"` : label
}

/**
 * Lightweight markdown-lite renderer for chat messages.
 * Supports fenced ```lang code blocks (with header + copy button) and `inline code`.
 * Pure UI — does not touch backend/state.
 */
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const body = part.slice(3, -3)
          const nl = body.indexOf("\n")
          const lang = nl >= 0 ? body.slice(0, nl).trim() : ""
          const code = nl >= 0 ? body.slice(nl + 1) : body
          return (
            <div className="chat-code-block" key={i}>
              <div className="chat-code-block__header">
                <span>{lang || "code"}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(code).catch(() => {})}
                  className="text-[0.65rem] uppercase tracking-wide text-current/70 hover:text-current transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="chat-code-block__pre">
                <code>{code}</code>
              </pre>
            </div>
          )
        }
        // inline code
        const inline = part.split(/(`[^`]+`)/g)
        return (
          <span key={i}>
            {inline.map((seg, j) =>
              seg.startsWith("`") && seg.endsWith("`") ? (
                <code key={j} className="chat-code-inline">{seg.slice(1, -1)}</code>
              ) : (
                <span key={j}>{seg}</span>
              )
            )}
          </span>
        )
      })}
    </>
  )
}

export function ChatWidgetLive2D({ avatar }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentExpression, setCurrentExpression] = useState<Live2DExpression>("neutral")
  const [live2dError, setLive2dError] = useState(false)
  const [triggerMotion, setTriggerMotion] = useState<string | null>(null)
  const [emotionIntensity, setEmotionIntensity] = useState(0.5)
  const [autoVoiceMode, setAutoVoiceMode] = useState(false)
  const autoVoiceModeRef = useRef(autoVoiceMode)

  useEffect(() => {
    autoVoiceModeRef.current = autoVoiceMode
  }, [autoVoiceMode])

  const { mutate } = useSWRConfig()

  const [pendingVoiceText, setPendingVoiceText] = useState("")

  const { isListening, isSpeaking, hasSupport, volume, startListening, stopListening, speak, stopSpeaking } = useSpeech(
    (text) => {
      setInput(text)
      setPendingVoiceText(text)
    },
    (text) => {
      setInput(text)
    }
  )

  const sendMessageRef = useRef<((content: string) => Promise<void>) | null>(null)

  useEffect(() => {
    if (pendingVoiceText && sendMessageRef.current) {
      sendMessageRef.current(pendingVoiceText)
      setPendingVoiceText("")
    }
  }, [pendingVoiceText])

  useEffect(() => {
    sendMessageRef.current = sendMessage
  })

  const scrollRootRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    const root = scrollRootRef.current
    const viewport = root?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement | null
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!isOpen) return
    const storedConvId = localStorage.getItem("timeplanner_assistant_conversation_id")
    if (storedConvId && !conversationId && messages.length === 0) {
      setConversationId(storedConvId)
      setIsLoading(true)
      backendRequest<Message[]>(`/api/v1/assistant/conversations/${storedConvId}/messages`)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setMessages(data)
          }
        })
        .catch((err) => {
          console.error("Failed to load history:", err)
          localStorage.removeItem("timeplanner_assistant_conversation_id")
          setConversationId(null)
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen])

  const handleUndoAction = async (logId: string, messageId: string, actionIndex: number) => {
    try {
      await undoAssistantAction(logId)
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m
          const updatedActions = [...(m.actions || [])]
          if (updatedActions[actionIndex]) {
            updatedActions[actionIndex] = {
              ...updatedActions[actionIndex],
              canUndo: false,
              undoneAt: new Date().toISOString(),
            }
          }
          return { ...m, actions: updatedActions }
        })
      )
      mutate("/api/v1/tasks")
      mutate("/api/v1/events")
      mutate((key) => typeof key === "string" && key.startsWith("/api/v1/time-blocks"))
      toast.success("Đã hoàn tác hành động!")
    } catch (error: any) {
      console.error("Undo error:", error)
      toast.error("Không thể hoàn tác hành động. Vui lòng thử lại.")
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || "",
      user_id: "",
      role: "user",
      content: content.trim(),
      actions: [],
      quick_replies: [],
      is_proactive: false,
      created_at: new Date().toISOString(),
    }

    const assistantMsgId = crypto.randomUUID()
    const placeholderMsg: Message = {
      id: assistantMsgId,
      conversation_id: conversationId || "",
      user_id: "",
      role: "assistant",
      content: "",
      mood: "thinking",
      actions: [],
      quick_replies: [],
      is_proactive: false,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage, placeholderMsg])
    setInput("")
    setIsLoading(true)
    setCurrentExpression("thinking")
    stopSpeaking()

    try {
      const token = localStorage.getItem("timeplanner_auth_token") || ""
      const res = await fetch("http://localhost:8080/api/v1/assistant/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: content.trim(),
          conversationId,
        }),
      })

      if (!res.ok || !res.body) {
        const data = await backendRequest<{
          conversationId?: string
          message?: AssistantChatMessage
          actions?: { type: string }[]
        }>("/api/v1/assistant/chat", {
          method: "POST",
          body: JSON.stringify({
            message: content.trim(),
            conversationId,
          }),
        })

        if (data.conversationId) {
          setConversationId(data.conversationId)
          localStorage.setItem("timeplanner_assistant_conversation_id", data.conversationId)
        }

        const assistantMessage = data.message
        if (assistantMessage) {
          setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? assistantMessage : m)))

          const mood = assistantMessage.mood || "neutral"
          setCurrentExpression(moodToExpression[mood] || "neutral")

          const intensity = typeof assistantMessage.emotion_intensity === "number"
            ? assistantMessage.emotion_intensity
            : 0.5
          setEmotionIntensity(intensity)

          const actions = data.actions ?? []
          if (actions.length > 0) {
            const actionTypes = actions.map((a: { type: string }) => a.type)
            if (actionTypes.some((t) => t.includes("task"))) mutate("/api/v1/tasks")
            if (actionTypes.some((t) => t.includes("event"))) mutate("/api/v1/events")
            mutate((key) => typeof key === "string" && key.startsWith("/api/v1/time-blocks"))
          }

          if (autoVoiceModeRef.current) {
            speak(assistantMessage.content, () => {
              if (autoVoiceModeRef.current) {
                startListening(true)
              }
            })
          }
        }
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        let currentEvent = ""
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim()
            if (!dataStr) continue
            try {
              const dataObj = JSON.parse(dataStr)
              if (currentEvent === "conversation" && dataObj.conversationId) {
                setConversationId(dataObj.conversationId)
                localStorage.setItem("timeplanner_assistant_conversation_id", dataObj.conversationId)
              } else if (currentEvent === "chunk" && dataObj.content !== undefined) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + (m.content ? " " : "") + dataObj.content }
                      : m
                  )
                )
              } else if (currentEvent === "done" && dataObj.message) {
                const finalMessage = dataObj.message as AssistantChatMessage
                setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? finalMessage : m)))

                const mood = finalMessage.mood || "neutral"
                setCurrentExpression(moodToExpression[mood] || "neutral")

                const intensity = typeof finalMessage.emotion_intensity === "number"
                  ? finalMessage.emotion_intensity
                  : 0.5
                setEmotionIntensity(intensity)

                const actions = dataObj.actions ?? []
                if (actions.length > 0) {
                  const actionTypes = actions.map((a: AssistantAction) => a.type)
                  if (actionTypes.some((t: string) => t.includes("task"))) mutate("/api/v1/tasks")
                  if (actionTypes.some((t: string) => t.includes("event"))) mutate("/api/v1/events")
                  mutate((key) => typeof key === "string" && key.startsWith("/api/v1/time-blocks"))

                  if (actionTypes.some((t: string) => t.includes("create") || t.includes("update") || t.includes("delete") || t.includes("mark_done"))) {
                    setTriggerMotion("Happy")
                  } else if (actionTypes.includes("reschedule")) {
                    setTriggerMotion("Tap")
                  }
                } else if (mood === "warning" || mood === "scared") {
                  setTriggerMotion("Sad")
                } else if (mood === "surprised") {
                  setTriggerMotion("Tap")
                }

                if (autoVoiceModeRef.current) {
                  speak(finalMessage.content, () => {
                    if (autoVoiceModeRef.current) {
                      startListening(true)
                    }
                  })
                }
              } else if (currentEvent === "error" && dataObj.error) {
                toast.error(dataObj.error)
              }
            } catch (e) {
              // ignore partial json
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error)
      setCurrentExpression("scared")
      setTriggerMotion("Sad")
      const errorMsg = error instanceof Error ? error.message : (error?.message || "Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.")
      toast.error(errorMsg)
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId))
    } finally {
      setIsLoading(false)
      setTimeout(() => setTriggerMotion(null), 500)
      setTimeout(() => setCurrentExpression("neutral"), 3000)
    }
  }

  const handleQuickReply = (reply: string) => {
    sendMessage(reply)
  }

  const handleLive2DError = useCallback(() => {
    setLive2dError(true)
  }, [])

  const widgetWidth = isExpanded ? "w-[440px]" : "w-[380px]"
  const widgetHeight = isExpanded ? "h-[560px]" : "h-[600px]"

  const suggestions = [
    { label: "Lịch hôm nay?", hint: "Xem sự kiện & task" },
    { label: "Tạo task mới", hint: "Thêm công việc" },
    { label: "Thống kê tuần", hint: "Tổng hợp tiến độ" },
  ]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 grid place-items-center",
          "w-14 h-14 rounded-full text-primary-foreground",
          "bg-primary hover:bg-primary/95 transition-all duration-300",
          "hover:scale-105 active:scale-95",
          "animate-chat-fab",
          isOpen && "pointer-events-none opacity-0 scale-90",
        )}
        aria-label="Mở trợ lý AI"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-background" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden",
            "bg-background/95 backdrop-blur-xl",
            "border border-border/70 rounded-[1.25rem] shadow-2xl shadow-black/10",
            "animate-chat-panel-in transition-all duration-300",
            widgetWidth, widgetHeight,
            "max-[440px]:left-3 max-[440px]:right-3 max-[440px]:w-auto max-[440px]:bottom-3 max-[440px]:top-3 max-[440px]:h-auto",
          )}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-to-r from-primary/[0.04] to-transparent">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9 rounded-full bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center overflow-hidden shrink-0">
                {avatar?.avatar_url && !live2dError ? (
                  <img
                    src={avatar.avatar_url || "/placeholder.svg"}
                    alt={avatar.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <Bot className="w-5 h-5 text-primary" />
                )}
                <span className={cn(
                  "absolute -bottom-0 -right-0 w-2.5 h-2.5 rounded-full ring-2 ring-background",
                  isLoading ? "bg-amber-400" : "bg-emerald-400"
                )} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[0.825rem] leading-tight truncate">
                  {avatar?.name || "Trợ lý AI"}
                </p>
                <p className="text-[0.7rem] text-muted-foreground truncate flex items-center gap-1">
                  {isLoading ? (
                    <>
                      <span className="chat-typing-dot !w-1 !h-1 text-amber-500" />
                      <span className="chat-typing-dot !w-1 !h-1 text-amber-500" />
                      <span className="chat-typing-dot !w-1 !h-1 text-amber-500" />
                      <span className="ml-1">Đang suy nghĩ</span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Sẵn sàng hỗ trợ
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setMessages([])
                    setConversationId(null)
                    localStorage.removeItem("timeplanner_assistant_messages")
                    localStorage.removeItem("timeplanner_assistant_conversation_id")
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Xóa lịch sử chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 text-muted-foreground"
                title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Live2D Avatar Section (kept mounted to avoid reloading) */}
          {!live2dError && (
            <div
              className={cn(
                "relative bg-gradient-to-b from-primary/[0.06] to-transparent flex items-center justify-center border-b border-border/40 overflow-hidden transition-all duration-300",
                isExpanded ? "h-56 opacity-100" : "h-0 opacity-0"
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
                focusY={0.1}
                motionPreload="IDLE"
                triggerMotion={triggerMotion}
                emotionIntensity={emotionIntensity}
                onError={handleLive2DError}
                onMotionTriggered={() => setTriggerMotion(null)}
                className="cursor-pointer"
              />
              
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRootRef} className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="px-4 py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 animate-chat-msg-in">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full" />
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Sparkles className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </div>
                    <p className="text-base font-semibold tracking-tight">Xin chào! 👋</p>
                    <p className="text-[0.8rem] mt-1.5 text-muted-foreground max-w-[16rem] leading-relaxed">
                      Tôi là trợ lý AI của bạn. Hãy nhắn tin để mình hỗ trợ quản lý lịch trình.
                    </p>
                    <div className="grid gap-2 mt-6 w-full max-w-[17rem]">
                      {suggestions.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => sendMessage(s.label)}
                          className="group text-left rounded-xl border border-border/70 bg-card hover:bg-accent/60 hover:border-primary/30 px-3.5 py-2.5 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[0.8rem] font-medium truncate">{s.label}</p>
                              <p className="text-[0.7rem] text-muted-foreground truncate">{s.hint}</p>
                            </div>
                            <ArrowUp className="w-3.5 h-3.5 text-muted-foreground rotate-45 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((msg) => {
                      const isUser = msg.role === "user"
                      const accent = moodAccent[msg.mood || "neutral"] || moodAccent.neutral
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex gap-2.5 animate-chat-msg-in",
                            isUser ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isUser && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 ring-1 ring-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div className={cn("flex flex-col gap-1.5 max-w-[82%]", isUser && "items-end")}>
                            <div
                              className={cn(
                                "rounded-2xl px-3.5 py-2.5 text-[0.825rem] leading-relaxed",
                                "shadow-sm",
                                isUser
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : cn(
                                      "bg-card border border-border/70 rounded-bl-md relative before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
                                      accent.bar, accent.tint
                                    )
                              )}
                            >
                              <div className="whitespace-pre-wrap break-words">
                                <MessageContent content={msg.content} />
                              </div>

                              {msg.role === "assistant" && msg.quick_replies && msg.quick_replies.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-border/50">
                                  {msg.quick_replies.map((reply, i) => (
                                    <button
                                      key={i}
                                      onClick={() => handleQuickReply(reply)}
                                      className="text-[0.72rem] font-medium px-2.5 py-1 rounded-full border border-border/70 bg-background/60 hover:bg-accent hover:border-primary/30 text-foreground/80 hover:text-foreground transition-all"
                                    >
                                      {reply}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {msg.role === "assistant" && msg.actions && msg.actions.filter((a) => {
                                if (a.type === "query_stats") return false
                                if (a.type === "query_schedule" && (!Array.isArray(a.result?.tasks) || a.result.tasks.length === 0) && (!Array.isArray(a.result?.events) || a.result.events.length === 0)) return false
                                return true
                              }).length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-border/50 space-y-2">
                                  {msg.actions.filter((a) => {
                                    if (a.type === "query_stats") return false
                                    if (a.type === "query_schedule" && (!Array.isArray(a.result?.tasks) || a.result.tasks.length === 0) && (!Array.isArray(a.result?.events) || a.result.events.length === 0)) return false
                                    return true
                                  }).map((action, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                      <div className="flex items-center justify-between gap-2 bg-background/50 rounded-lg px-2 py-1 border border-border/40">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0", action.undoneAt ? "text-muted-foreground" : "text-emerald-500")} />
                                          <span className={cn("text-[0.72rem] truncate font-medium", action.undoneAt && "line-through text-muted-foreground")}>
                                            {formatActionLabel(action)}
                                          </span>
                                        </div>
                                        {action.canUndo && !action.undoneAt && action.logId && (
                                          <button
                                            type="button"
                                            onClick={() => handleUndoAction(action.logId!, msg.id, idx)}
                                            className="text-[0.68rem] px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors shrink-0 font-medium"
                                          >
                                            Hoàn tác
                                          </button>
                                        )}
                                        {action.undoneAt && (
                                          <span className="text-[0.65rem] text-muted-foreground italic shrink-0">Đã hoàn tác</span>
                                        )}
                                      </div>

                                      {(action.type === "query_task" || action.type === "query_schedule") && Array.isArray(action.result?.tasks) ? (
                                        <TaskCardList tasks={action.result!.tasks as unknown as TaskCardData[]} />
                                      ) : null}
                                      {(action.type === "query_event" || action.type === "query_schedule") && Array.isArray(action.result?.events) ? (
                                        <EventCardList events={action.result!.events as unknown as EventCardData[]} />
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {isUser && (
                            <div className="w-8 h-8 rounded-full bg-muted ring-1 ring-border/50 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {isLoading && (
                      <div className="flex gap-2.5 animate-chat-msg-in">
                        <div className="w-8 h-8 rounded-full bg-primary/10 ring-1 ring-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="bg-card border border-border/70 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="chat-typing-dot" />
                            <span className="chat-typing-dot" />
                            <span className="chat-typing-dot" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border/60 bg-background/80 backdrop-blur">
            {isListening && (
              <div className="flex items-center justify-between gap-3 px-3 py-2 mb-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-pulse">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-destructive animate-bounce" />
                  <span className="text-[0.78rem] font-medium">Đang ghi âm & lắng nghe...</span>
                </div>
                <div className="flex items-center gap-1 h-4">
                  {[...Array(6)].map((_, i) => {
                    const barHeight = Math.max(4, Math.min(16, Math.round((volume / 100) * 16 * (0.5 + ((i % 3) * 0.3)))))
                    return (
                      <span
                        key={i}
                        className="w-1 bg-destructive rounded-full transition-all duration-75"
                        style={{ height: `${barHeight}px` }}
                      />
                    )
                  })}
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage(input)
              }}
              className="flex items-end gap-2"
            >
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn cho trợ lý..."
                  className={cn(
                    "flex-1 h-11 pr-11 rounded-xl text-[0.85rem]",
                    "bg-muted/40 border-border/60",
                    "focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-primary/20",
                    "transition-colors"
                  )}
                  disabled={isLoading}
                />
              </div>
              {hasSupport && (
                <Button
                  type="button"
                  size="icon"
                  variant={autoVoiceMode ? "destructive" : "outline"}
                  onClick={() => {
                    if (autoVoiceMode) {
                      stopListening()
                      stopSpeaking()
                      setAutoVoiceMode(false)
                    } else {
                      setAutoVoiceMode(true)
                      startListening(true)
                    }
                  }}
                  disabled={isLoading}
                  className="h-11 w-11 rounded-xl shrink-0"
                  title={autoVoiceMode ? "Dừng hội thoại giọng nói" : "Bật hội thoại giọng nói"}
                >
                  {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : (autoVoiceMode ? <Square className="w-4 h-4 fill-current" /> : <MicOff className="w-4 h-4 text-muted-foreground" />)}
                </Button>
              )}
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "h-11 w-11 rounded-xl shrink-0",
                  "bg-primary hover:bg-primary/90",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "transition-all duration-200 hover:scale-105 active:scale-95",
                  input.trim() && !isLoading && "shadow-md shadow-primary/25"
                )}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-[0.65rem] text-muted-foreground/70 text-center mt-1.5">
              Trợ lý AI · có thể mắc lỗi. Kiểm tra thông tin quan trọng.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
