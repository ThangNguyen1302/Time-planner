"use client"

import type React from "react"
import { useMemo } from "react"
import { useState } from "react"
import useSWR from "swr"
import { AlertCircle, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Edit2, Loader2, Plus, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { backendRequest, unwrapData } from "@/lib/client"
import { extractItems, fromDateInputValue, toDateInputValue } from "@/lib/api-response"
import type { Event, Task, TimeBlock } from "@/lib/types"

const fetcher = (path: string) => backendRequest<unknown>(path)
const HOURS = Array.from({ length: 15 }, (_, index) => index + 7)
const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

type ApiDateItem = {
  startTime?: string
  start_time?: string
  endTime?: string
  end_time?: string
  blockType?: string
  block_type?: string
}

type CalendarItem = {
  id: string
  title: string
  start: Date
  end: Date
  type: "event" | "task" | "habit"
  color: string
  status?: string
  sourceId?: string
}

type GoogleStatus = {
  connected: boolean
}

type GoogleCalendarEvent = {
  id: string
  summary?: string
  description?: string
  startTime?: string
  endTime?: string
  allDay?: boolean
  calendarId?: string
}

function getWeekRange(anchorDate: Date) {
  const start = new Date(anchorDate)
  start.setDate(anchorDate.getDate() - anchorDate.getDay())
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 7)

  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })

  return { from: start.toISOString(), to: end.toISOString(), start, end, days }
}

function getStart(item: ApiDateItem) {
  return item.start_time || item.startTime || ""
}

function getEnd(item: ApiDateItem) {
  return item.end_time || item.endTime || ""
}

function getBlockType(item: ApiDateItem) {
  return (item.block_type || item.blockType || "event") as CalendarItem["type"]
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isInWeek(value: Date, from: Date, to: Date) {
  return value >= from && value < to
}

function formatDay(date: Date) {
  return `${DAY_LABELS[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function mapTimeBlocks(blocks: TimeBlock[]) {
  return blocks
    .map((block) => {
      const start = new Date(getStart(block))
      const end = new Date(getEnd(block))
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

      return {
        id: `block-${block.id}`,
        title: block.title,
        start,
        end,
        type: getBlockType(block),
        color: block.color || "#2563eb",
        status: block.status,
        sourceId: block.source_id,
      }
    })
    .filter(Boolean) as CalendarItem[]
}

function mapEvents(events: Event[], existingSourceIds: Set<string>, from: Date, to: Date) {
  return events
    .filter((event) => !existingSourceIds.has(event.id))
    .map((event) => {
      const start = new Date(getStart(event))
      const end = new Date(getEnd(event))
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !isInWeek(start, from, to)) return null

      return {
        id: `event-${event.id}`,
        title: event.title,
        start,
        end,
        type: "event" as const,
        color: event.color || "#7c3aed",
        sourceId: event.id,
      }
    })
    .filter(Boolean) as CalendarItem[]
}

function mapTasks(tasks: Task[], existingSourceIds: Set<string>, from: Date, to: Date) {
  return tasks
    .filter((task) => task.status !== "completed" && task.deadline && !existingSourceIds.has(task.id))
    .map((task) => {
      const end = new Date(task.deadline || "")
      if (Number.isNaN(end.getTime()) || !isInWeek(end, from, to)) return null

      const start = new Date(end)
      start.setMinutes(end.getMinutes() - Math.max(task.duration || 30, 1))

      return {
        id: `task-${task.id}`,
        title: task.title,
        start,
        end,
        type: "task" as const,
        color: task.color || "#2563eb",
        status: task.status,
        sourceId: task.id,
      }
    })
    .filter(Boolean) as CalendarItem[]
}

function mapGoogleEvents(events: GoogleCalendarEvent[], from: Date, to: Date) {
  return events
    .map((event) => {
      const start = new Date(event.startTime || "")
      const end = new Date(event.endTime || event.startTime || "")
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !isInWeek(start, from, to)) return null

      return {
        id: `google-${event.calendarId || "calendar"}-${event.id}`,
        title: event.summary || "Google Calendar event",
        start,
        end,
        type: "event" as const,
        color: "#16a34a",
      }
    })
    .filter(Boolean) as CalendarItem[]
}

export default function CalendarPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [visibleWeek, setVisibleWeek] = useState(() => new Date())
  const range = useMemo(() => getWeekRange(visibleWeek), [visibleWeek])
  const timeBlocks = useSWR(
    `/api/v1/time-blocks?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
    fetcher,
  )
  const tasks = useSWR("/api/v1/tasks", fetcher)
  const events = useSWR("/api/v1/events", fetcher)
  const googleStatus = useSWR("/api/v1/integrations/google/status", fetcher)
  const googleConnected = googleStatus.data
    ? unwrapData(googleStatus.data as GoogleStatus | { data: GoogleStatus }).connected
    : false
  const googleEvents = useSWR(
    googleConnected
      ? `/api/v1/integrations/google/events?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(
          range.to,
        )}&timezone=Asia/Ho_Chi_Minh`
      : null,
    fetcher,
  )

  const blocks = extractItems<TimeBlock>(timeBlocks.data as never)
  const taskItems = extractItems<Task>(tasks.data as never)
  const eventItems = extractItems<Event>(events.data as never)
  const googleEventItems = extractItems<GoogleCalendarEvent>(googleEvents.data as never)
  const selectedTask = taskItems.find((task) => task.id === selectedTaskId)
  const selectedEvent = eventItems.find((event) => event.id === selectedEventId)
  const existingSourceIds = new Set(blocks.map((block) => block.source_id).filter((id): id is string => Boolean(id)))
  const scheduledItems = [
    ...mapTimeBlocks(blocks),
    ...mapTasks(taskItems, existingSourceIds, range.start, range.end),
    ...mapEvents(eventItems, existingSourceIds, range.start, range.end),
    ...mapGoogleEvents(googleEventItems, range.start, range.end),
  ].filter((item) => item.type !== "task" || !taskItems.find((task) => task.id === item.sourceId && task.status === "completed"))
  const unscheduledTasks = taskItems.filter(
    (task) => task.status !== "completed" && !task.deadline && !existingSourceIds.has(task.id),
  )
  const isLoading = timeBlocks.isLoading || tasks.isLoading || events.isLoading || googleEvents.isLoading
  const errors = [timeBlocks.error, tasks.error, events.error, googleStatus.error, googleEvents.error].filter(Boolean) as Error[]

  const refreshCalendar = () => {
    tasks.mutate()
    events.mutate()
    timeBlocks.mutate()
    googleEvents.mutate()
  }

  const moveWeek = (offset: number) => {
    setVisibleWeek((current) => {
      const next = new Date(current)
      next.setDate(current.getDate() + offset * 7)
      return next
    })
  }

  const createTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await backendRequest("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        duration: Number(form.get("duration") || 30),
        deadline: fromDateInputValue(String(form.get("deadline") || "")),
        priority: Number(form.get("priority") || 2),
        color: "#3B82F6",
      }),
    })
    event.currentTarget.reset()
    setIsTaskDialogOpen(false)
    refreshCalendar()
  }

  const createEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await backendRequest("/api/v1/events", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        startTime: fromDateInputValue(String(form.get("startTime") || "")),
        endTime: fromDateInputValue(String(form.get("endTime") || "")),
        color: "#8B5CF6",
      }),
    })
    event.currentTarget.reset()
    setIsEventDialogOpen(false)
    refreshCalendar()
  }

  const completeTask = async (taskId: string) => {
    await backendRequest(`/api/v1/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    })
    refreshCalendar()
  }

  const updateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTask) return
    const form = new FormData(event.currentTarget)
    await backendRequest(`/api/v1/tasks/${selectedTask.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        duration: Number(form.get("duration") || 30),
        deadline: fromDateInputValue(String(form.get("deadline") || "")),
        priority: Number(form.get("priority") || 2),
        status: form.get("status"),
      }),
    })
    setSelectedTaskId(null)
    refreshCalendar()
  }

  const updateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedEvent) return
    const form = new FormData(event.currentTarget)
    await backendRequest(`/api/v1/events/${selectedEvent.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        startTime: fromDateInputValue(String(form.get("startTime") || "")),
        endTime: fromDateInputValue(String(form.get("endTime") || "")),
      }),
    })
    setSelectedEventId(null)
    refreshCalendar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Lich tuan</h1>
          <p className="text-sm text-muted-foreground">
            {range.days[0].toLocaleDateString("vi-VN")} - {range.days[6].toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Button type="button" size="icon" variant="outline" onClick={() => moveWeek(-1)} aria-label="Tuan truoc" title="Tuan truoc">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setVisibleWeek(new Date())}>
            Hom nay
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={() => moveWeek(1)} aria-label="Tuan sau" title="Tuan sau">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" onClick={() => setIsTaskDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Task
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEventDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Event
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {errors[0].message}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="border-b py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            Lich theo gio
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid min-w-[760px] grid-cols-[64px_repeat(7,minmax(96px,1fr))] overflow-x-auto">
            <div className="border-b bg-muted/40 p-2" />
            {range.days.map((day) => (
              <div key={day.toISOString()} className="border-b border-l bg-muted/40 p-2 text-center">
                <div className="text-sm font-medium">{formatDay(day)}</div>
                {isSameDay(day, new Date()) && <div className="text-xs text-primary">Hom nay</div>}
              </div>
            ))}

            {HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="min-h-[76px] border-b bg-muted/20 px-2 py-2 text-xs text-muted-foreground">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {range.days.map((day) => {
                  const items = scheduledItems.filter((item) => isSameDay(item.start, day) && item.start.getHours() === hour)

                  return (
                    <div key={`${day.toISOString()}-${hour}`} className="min-h-[76px] space-y-1 border-b border-l p-1.5">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-md border bg-background px-2 py-1.5 text-xs shadow-xs"
                          style={{ borderLeft: `4px solid ${item.color}` }}
                        >
                          <div className="line-clamp-2 font-medium">{item.title}</div>
                          <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(item.start)} - {formatTime(item.end)}
                          </div>
                          {item.type === "task" && item.sourceId && (
                            <div className="mt-2 flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => completeTask(item.sourceId!)}
                                aria-label="Complete task"
                                title="Complete task"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setSelectedTaskId(item.sourceId!)}
                                aria-label="Edit task"
                                title="Edit task"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {item.type === "event" && item.sourceId && (
                            <div className="mt-2 flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setSelectedEventId(item.sourceId!)}
                                aria-label="Edit event"
                                title="Edit event"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedTask)} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <form onSubmit={updateTask} className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="calendar-edit-title">Title</Label>
                <Input id="calendar-edit-title" name="title" defaultValue={selectedTask.title} required />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="calendar-edit-description">Description</Label>
                <Textarea
                  id="calendar-edit-description"
                  name="description"
                  defaultValue={selectedTask.description || ""}
                  rows={2}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor="calendar-edit-duration">Minutes</Label>
                  <Input
                    id="calendar-edit-duration"
                    name="duration"
                    type="number"
                    min={1}
                    defaultValue={selectedTask.duration}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="calendar-edit-priority">Priority</Label>
                  <Input
                    id="calendar-edit-priority"
                    name="priority"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={selectedTask.priority}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor="calendar-edit-deadline">Deadline</Label>
                  <Input
                    id="calendar-edit-deadline"
                    name="deadline"
                    type="datetime-local"
                    defaultValue={toDateInputValue(selectedTask.deadline)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="calendar-edit-status">Status</Label>
                  <select
                    id="calendar-edit-status"
                    name="status"
                    defaultValue={selectedTask.status}
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    {["pending", "in_progress", "completed", "skipped", "overdue"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" className="justify-self-end">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <form onSubmit={updateEvent} className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="calendar-edit-event-title">Title</Label>
                <Input id="calendar-edit-event-title" name="title" defaultValue={selectedEvent.title} required />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="calendar-edit-event-description">Description</Label>
                <Textarea
                  id="calendar-edit-event-description"
                  name="description"
                  defaultValue={selectedEvent.description || ""}
                  rows={2}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor="calendar-edit-event-start">Start</Label>
                  <Input
                    id="calendar-edit-event-start"
                    name="startTime"
                    type="datetime-local"
                    defaultValue={toDateInputValue(selectedEvent.start_time)}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="calendar-edit-event-end">End</Label>
                  <Input
                    id="calendar-edit-event-end"
                    name="endTime"
                    type="datetime-local"
                    defaultValue={toDateInputValue(selectedEvent.end_time)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="justify-self-end">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
          </DialogHeader>
          <form onSubmit={createTask} className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="calendar-task-title">Title</Label>
              <Input id="calendar-task-title" name="title" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="calendar-task-description">Description</Label>
              <Textarea id="calendar-task-description" name="description" rows={2} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="calendar-task-duration">Minutes</Label>
                <Input id="calendar-task-duration" name="duration" type="number" min={1} defaultValue={30} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="calendar-task-priority">Priority</Label>
                <Input id="calendar-task-priority" name="priority" type="number" min={1} max={5} defaultValue={2} />
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="calendar-task-deadline">Deadline</Label>
              <Input id="calendar-task-deadline" name="deadline" type="datetime-local" />
            </div>
            <Button type="submit" className="justify-self-end">
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create event</DialogTitle>
          </DialogHeader>
          <form onSubmit={createEvent} className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="calendar-event-title">Title</Label>
              <Input id="calendar-event-title" name="title" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="calendar-event-description">Description</Label>
              <Textarea id="calendar-event-description" name="description" rows={2} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="calendar-event-start">Start</Label>
                <Input id="calendar-event-start" name="startTime" type="datetime-local" required />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="calendar-event-end">End</Label>
                <Input id="calendar-event-end" name="endTime" type="datetime-local" required />
              </div>
            </div>
            <Button type="submit" className="justify-self-end">
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
