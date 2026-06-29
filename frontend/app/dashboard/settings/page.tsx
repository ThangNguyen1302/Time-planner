"use client"

import type React from "react"
import { useState } from "react"
import useSWR from "swr"
import { CalendarDays, Loader2, RefreshCw, Save, Unlink } from "lucide-react"
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
  const preferences = data ? unwrapData(data as UserPreference | { data: UserPreference }) : null
  const googleConnected = googleStatus.data
    ? unwrapData(googleStatus.data as GoogleStatus | { data: GoogleStatus }).connected
    : false

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
    mutate()
  }

  const connectGoogleCalendar = async () => {
    const payload = await backendRequest<{ data: { url: string } }>("/api/v1/integrations/google/auth-url")
    const data = unwrapData(payload)
    window.location.href = data.url
  }

  const syncGoogleCalendar = async () => {
    setGoogleMessage(null)
    const range = getCurrentWeekRange()
    const payload = await backendRequest<unknown>(
      `/api/v1/integrations/google/events?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(
        range.to,
      )}&timezone=Asia/Ho_Chi_Minh`,
    )
    const events = Array.isArray(unwrapData(payload as { data: unknown[] })) ? unwrapData(payload as { data: unknown[] }) : []
    setGoogleMessage(`Đã đồng bộ ${events.length} sự kiện Google trong tuần này.`)
  }

  const disconnectGoogleCalendar = async () => {
    setGoogleMessage(null)
    await backendRequest("/api/v1/integrations/google/disconnect", { method: "DELETE" })
    googleStatus.mutate()
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt</CardTitle>
          <CardDescription>Cấu hình các tùy chọn tài khoản và múi giờ.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          {preferences && (
            <form onSubmit={handleSave} className="grid max-w-2xl gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="wakeTime">Giờ thức giấc</Label>
                <Input id="wakeTime" name="wakeTime" type="time" defaultValue={preferences.wake_time} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="sleepTime">Giờ đi ngủ</Label>
                <Input id="sleepTime" name="sleepTime" type="time" defaultValue={preferences.sleep_time} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="workStart">Bắt đầu làm việc</Label>
                <Input id="workStart" name="workStart" type="time" defaultValue={preferences.work_start} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="workEnd">Kết thúc làm việc</Label>
                <Input id="workEnd" name="workEnd" type="time" defaultValue={preferences.work_end} />
              </div>
              <div className="grid gap-1 md:col-span-2">
                <Label htmlFor="timezone">Múi giờ</Label>
                <Input id="timezone" name="timezone" defaultValue={preferences.timezone || "Asia/Ho_Chi_Minh"} />
              </div>
              <Button type="submit" className="md:col-span-2 md:w-fit">
                <Save className="mr-2 h-4 w-4" />
                Lưu
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>Quản lý kết nối và đồng bộ lịch Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {googleStatus.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {googleStatus.error && <p className="text-sm text-destructive">{googleStatus.error.message}</p>}
          {!googleStatus.isLoading && (
            <div className="flex flex-wrap items-center gap-2">
              {googleConnected ? (
                <>
                  <Button type="button" variant="outline" onClick={syncGoogleCalendar}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Đồng bộ Google
                  </Button>
                  <Button type="button" variant="ghost" onClick={disconnectGoogleCalendar}>
                    <Unlink className="mr-2 h-4 w-4" />
                    Ngắt kết nối
                  </Button>
                </>
              ) : (
                <Button type="button" variant="outline" onClick={connectGoogleCalendar}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Kết nối Google
                </Button>
              )}
            </div>
          )}
          {googleMessage && <p className="text-sm text-muted-foreground">{googleMessage}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
