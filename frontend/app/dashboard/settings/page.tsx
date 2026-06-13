"use client"

import type React from "react"
import useSWR from "swr"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { backendRequest, unwrapData } from "@/lib/client"
import type { UserPreference } from "@/lib/types"

const fetcher = (path: string) => backendRequest<unknown>(path)

export default function SettingsPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/v1/preferences", fetcher)
  const preferences = data ? unwrapData(data as UserPreference | { data: UserPreference }) : null

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Preferences are loaded from /api/v1/preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {preferences && (
          <form onSubmit={handleSave} className="grid max-w-2xl gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="wakeTime">Wake time</Label>
              <Input id="wakeTime" name="wakeTime" type="time" defaultValue={preferences.wake_time} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="sleepTime">Sleep time</Label>
              <Input id="sleepTime" name="sleepTime" type="time" defaultValue={preferences.sleep_time} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="workStart">Work start</Label>
              <Input id="workStart" name="workStart" type="time" defaultValue={preferences.work_start} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="workEnd">Work end</Label>
              <Input id="workEnd" name="workEnd" type="time" defaultValue={preferences.work_end} />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" name="timezone" defaultValue={preferences.timezone || "Asia/Ho_Chi_Minh"} />
            </div>
            <Button type="submit" className="md:col-span-2 md:w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
