"use client"

import { useState, useRef, useEffect } from "react"
import { useSWRConfig } from "swr"
import { MessageCircle, X, Bot, User, Sparkles, Trash2, ArrowUp, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { backendRequest } from "@/lib/client"
import type { Message, Avatar } from "@/lib/types"

interface ChatWidgetProps {
  avatar?: Avatar
}

const moodAccent: Record<string, { bar: string; tint: string }> = {
  happy: { bar: "before:bg-emerald-500", tint: "dark:bg-emerald-500/5" },
  serious: { bar: "before:bg-orange-500", tint: "dark:bg-orange-500/5" },
  encouraging: { bar: "before:bg-blue-500", tint: "dark:bg-blue-500/5" },
  warning: { bar: "before:bg-rose-500", tint: "dark:bg-rose-500/5" },
  sad: { bar: "before:bg-sky-500", tint: "dark:bg-sky-500/5" },
  surprised: { bar: "before:bg-violet-500", tint: "dark:bg-violet-500/5" },
  neutral: { bar: "before:bg-primary", tint: "" },
}

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
                  className="text-[0.65rem] uppercase tracking-wide opacity-70 hover:opacity-100 transition-opacity"
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

export function ChatWidget({ avatar }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const { mutate } = useSWRConfig()
  const scrollRootRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    const root = scrollRootRef.current
    const viewport = root?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement | null
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

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

    try {
      const data = await backendRequest<{
        conversationId?: string
        message?: Message
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
        const actionTypes = assistantMessage.actions?.map((action) => action.type) ?? []
        if (actionTypes.includes("create_task") || actionTypes.includes("update_task") || actionTypes.includes("delete_task")) {
          mutate("/api/v1/tasks")
          mutate((key) => typeof key === "string" && key.startsWith("/api/v1/time-blocks"))
        }
        if (actionTypes.includes("create_event") || actionTypes.includes("update_event") || actionTypes.includes("delete_event")) {
          mutate("/api/v1/events")
          mutate((key) => typeof key === "string" && key.startsWith("/api/v1/time-blocks"))
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    sendMessage(reply)
  }

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
            "w-[380px] h-[600px]",
            "max-[440px]:left-3 max-[440px]:right-3 max-[440px]:w-auto max-[440px]:bottom-3 max-[440px]:top-3 max-[440px]:h-auto",
          )}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-to-r from-primary/[0.04] to-transparent">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9 rounded-full bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center overflow-hidden shrink-0">
                {avatar?.avatar_url ? (
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
                  {avatar?.name || "Trợ lý"}
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
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

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
                      Tôi có thể giúp bạn quản lý lịch trình, tạo task, và nhiều hơn nữa.
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
                                "rounded-2xl px-3.5 py-2.5 text-[0.825rem] leading-relaxed shadow-sm",
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

                              {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-border/50 flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <p className="text-[0.7rem] text-muted-foreground">
                                    Đã thực hiện: {msg.actions.map((a) => a.type).join(", ")}
                                  </p>
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
                    "flex-1 h-11 rounded-xl text-[0.85rem]",
                    "bg-muted/40 border-border/60",
                    "focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-primary/20",
                    "transition-colors"
                  )}
                  disabled={isLoading}
                />
              </div>
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
