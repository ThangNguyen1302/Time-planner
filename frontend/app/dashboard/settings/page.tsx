"use client"

import type React from "react"
import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { CalendarDays, Check, Clock, Link2, Loader2, Moon, RefreshCw, Save, Sun, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { backendRequest, unwrapData } from "@/lib/client"
import type { UserPreference } from "@/lib/types"

const fetcher = (path: string) => backendRequest<unknown>(path)

type GoogleStatus = {
  connected: boolean
}

function getCurrentWeekRange() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 7)

  return { from: start.toISOString(), to: end.toISOString() }
}

export default function SettingsPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/v1/preferences", fetcher)
  const googleStatus = useSWR("/api/v1/integrations/google/status", fetcher)
  const [googleMessage, setGoogleMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const preferences = data ? unwrapData(data as UserPreference | { data: UserPreference }) : null
  const googleConnected = googleStatus.data
    ? unwrapData(googleStatus.data as GoogleStatus | { data: GoogleStatus }).connected
    : false

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const form = new FormData(event.currentTarget)
      await backendRequest("/api/v1/preferences", {
        method: "PUT",
        body: JSON.stringify({
          wakeTime: form.get("wakeTime"),
          sleepTime: form.get("sleepTime"),
          workStart: form.get("workStart"),
          workEnd: form.get("workEnd"),
          timezone: form.get("timezone"),
        }),
      })
      await mutate()
      toast.success("Đã lưu cài đặt", { description: "Tùy chọn của bạn đã được cập nhật." })
    } catch (err) {
      toast.error("Không thể lưu cài đặt", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsSaving(false)
    }
  }

  const connectGoogleCalendar = async () => {
    try {
      const payload = await backendRequest<{ data: { url: string } }>("/api/v1/integrations/google/auth-url")
      const data = unwrapData(payload)
      window.location.href = data.url
    } catch (err) {
      toast.error("Không thể kết nối Google", { description: err instanceof Error ? err.message : undefined })
    }
  }

  const syncGoogleCalendar = async () => {
    setGoogleMessage(null)
    setIsSyncing(true)
    try {
      const range = getCurrentWeekRange()
      const payload = await backendRequest<unknown>(
        `/api/v1/integrations/google/events?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(
          range.to,
        )}&timezone=Asia/Ho_Chi_Minh`,
      )
      const events = Array.isArray(unwrapData(payload as { data: unknown[] })) ? unwrapData(payload as { data: unknown[] }) : []
      setGoogleMessage(`Đã đồng bộ ${events.length} sự kiện Google trong tuần này.`)
      toast.success("Đã đồng bộ Google Calendar", {
        description: `Đã lấy ${events.length} sự kiện trong tuần này.`,
      })
    } catch (err) {
      toast.error("Đồng bộ thất bại", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsSyncing(false)
    }
  }

  const disconnectGoogleCalendar = async () => {
    setGoogleMessage(null)
    setIsDisconnecting(true)
    try {
      await backendRequest("/api/v1/integrations/google/disconnect", { method: "DELETE" })
      await googleStatus.mutate()
      toast.success("Đã ngắt kết nối Google Calendar")
    } catch (err) {
      toast.error("Không thể ngắt kết nối", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">Cấu hình tùy chọn tài khoản, lịch trình và tích hợp.</p>
      </div>

      <Card>
        <CardHeader className="py-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-primary" />
            Lịch trình hàng ngày
          </CardTitle>
          <CardDescription>Thiết lập khung giờ thức giấc và làm việc để tối ưu tự động sắp xếp.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải...
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          {preferences && (
            <form onSubmit={handleSave} className="grid gap-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Sun className="size-4 text-amber-500" />
                    Giờ thức giấc
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="wakeTime">Thức giấc</Label>
                    <Input id="wakeTime" name="wakeTime" type="time" defaultValue={preferences.wake_time} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Moon className="size-4 text-indigo-500" />
                    Giờ đi ngủ
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="sleepTime">Đi ngủ</Label>
                    <Input id="sleepTime" name="sleepTime" type="time" defaultValue={preferences.sleep_time} />
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="size-4 text-emerald-500" />
                    Giờ làm việc
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="workStart">Bắt đầu</Label>
                    <Input id="workStart" name="workStart" type="time" defaultValue={preferences.work_start} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Check className="size-4 text-emerald-500" />
                    Kết thúc
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="workEnd">Kết thúc làm việc</Label>
                    <Input id="workEnd" name="workEnd" type="time" defaultValue={preferences.work_end} />
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="grid gap-1.5 md:max-w-md">
                <Label htmlFor="timezone">Múi giờ</Label>
                <Input id="timezone" name="timezone" defaultValue={preferences.timezone || "Asia/Ho_Chi_Minh"} />
              </div>

              <Button type="submit" disabled={isSaving} className="md:w-fit">
                {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            Google Calendar
          </CardTitle>
          <CardDescription>Quản lý kết nối và đồng bộ lịch Google của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleStatus.isLoading && (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải trạng thái...
            </div>
          )}
          {googleStatus.error && <p className="text-sm text-destructive">{googleStatus.error.message}</p>}
          {!googleStatus.isLoading && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  googleConnected
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                    : "border-muted bg-muted/40 text-muted-foreground"
                }`}
              >
                <span className={`size-2 rounded-full ${googleConnected ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                {googleConnected ? "Đã kết nối với Google Calendar" : "Chưa kết nối với Google Calendar"}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {googleConnected ? (
                  <>
                    <Button type="button" variant="outline" onClick={syncGoogleCalendar} disabled={isSyncing}>
                      {isSyncing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
                      {isSyncing ? "Đang đồng bộ..." : "Đồng bộ Google"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={disconnectGoogleCalendar}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Unlink className="mr-2 size-4" />}
                      {isDisconnecting ? "Đang ngắt..." : "Ngắt kết nối"}
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="outline" onClick={connectGoogleCalendar}>
                    <Link2 className="mr-2 size-4" />
                    Kết nối Google
                  </Button>
                )}
              </div>
              {googleMessage && <p className="text-sm text-muted-foreground">{googleMessage}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
