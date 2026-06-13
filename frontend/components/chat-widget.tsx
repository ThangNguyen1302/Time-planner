"use client"

import { useState, useRef, useEffect } from "react"
import { useSWRConfig } from "swr"
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { backendRequest } from "@/lib/client"
import type { Message, Avatar } from "@/lib/types"

interface ChatWidgetProps {
  avatar?: Avatar
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
        if (actionTypes.includes("create_task") || actionTypes.includes("update_task")) {
          mutate("/api/v1/tasks")
          mutate((key) => typeof key === "string" && key.startsWith("/api/v1/time-blocks"))
        }
        if (actionTypes.includes("create_event") || actionTypes.includes("update_event")) {
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

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case "happy":
        return "bg-green-100 border-green-300"
      case "serious":
        return "bg-orange-100 border-orange-300"
      case "encouraging":
        return "bg-blue-100 border-blue-300"
      case "warning":
        return "bg-red-100 border-red-300"
      default:
        return "bg-muted border-border"
    }
  }

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
        <div className="fixed bottom-6 right-6 w-96 h-128 bg-background border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {avatar?.avatar_url ? (
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
                <p className="font-medium text-sm">{avatar?.name || "Trợ lý"}</p>
                <p className="text-xs text-muted-foreground">Sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRootRef} className="flex-1 min-h-0">
            <ScrollArea className="h-full p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mb-4 text-primary/30" />
                <p className="text-sm font-medium">Xin chào!</p>
                <p className="text-xs mt-1">Tôi có thể giúp bạn quản lý lịch trình, tạo task, và nhiều hơn nữa.</p>
                <div className="flex flex-wrap gap-2 mt-4">
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
                            Đã thực hiện: {msg.actions.map((a) => a.type).join(", ")}
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

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage(input)
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
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
