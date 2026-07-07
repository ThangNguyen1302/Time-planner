"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/header"
import { ChatWidgetLive2D } from "@/components/chat-widget-live2d"
import { useAuth } from "@/lib/auth-context"

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton animate-shimmer rounded-md ${className ?? ""}`} />
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar skeleton (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col">
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border">
          <div className="size-9 rounded-xl skeleton animate-shimmer" />
          <div className="h-4 w-24 rounded skeleton animate-shimmer" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-6">
          {[0, 1].map((section) => (
            <div key={section} className="space-y-2">
              <div className="h-3 w-12 rounded skeleton animate-shimmer mx-3" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                  <div className="size-[1.15rem] rounded skeleton animate-shimmer" />
                  <div className="h-3.5 flex-1 max-w-[100px] rounded skeleton animate-shimmer" />
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="size-9 rounded-full skeleton animate-shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded skeleton animate-shimmer" />
              <div className="h-2.5 w-20 rounded skeleton animate-shimmer" />
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Header skeleton */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded skeleton animate-shimmer" />
              <div className="hidden sm:block h-2.5 w-36 rounded skeleton animate-shimmer" />
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5">
              <div className="size-8 rounded-full skeleton animate-shimmer" />
              <div className="hidden sm:flex flex-col gap-1">
                <div className="h-2.5 w-24 rounded skeleton animate-shimmer" />
                <div className="h-2 w-12 rounded skeleton animate-shimmer" />
              </div>
            </div>
          </div>
        </header>

        {/* Content skeleton */}
        <main className="p-4 lg:p-6 space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded skeleton animate-shimmer" />
            <div className="h-4 w-72 rounded skeleton animate-shimmer" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl skeleton animate-shimmer" />
                  <div className="h-3 w-12 rounded skeleton animate-shimmer" />
                </div>
                <div className="h-7 w-20 rounded skeleton animate-shimmer" />
                <div className="h-3 w-24 rounded skeleton animate-shimmer" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="h-5 w-40 rounded skeleton animate-shimmer" />
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-4 rounded skeleton animate-shimmer" />
                  <div className="h-3.5 flex-1 max-w-[60%] rounded skeleton animate-shimmer" />
                  <div className="h-5 w-16 rounded-full skeleton animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isReady && !user) router.replace("/auth/login")
  }, [isReady, user, router])

  if (!isReady || !user) {
    return <DashboardSkeleton />
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
