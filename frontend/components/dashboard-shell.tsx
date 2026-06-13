"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/header"
import { ChatWidgetLive2D } from "@/components/chat-widget-live2d"
import { useAuth } from "@/lib/auth-context"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isReady && !user) router.replace("/auth/login")
  }, [isReady, user, router])

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar user={user} />
      <div className="lg:pl-64">
        <DashboardHeader user={user} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
      <ChatWidgetLive2D avatar={undefined} />
    </div>
  )
}
