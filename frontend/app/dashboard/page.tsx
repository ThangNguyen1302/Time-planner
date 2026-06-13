"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { CalendarDays, CheckSquare, Clock, ListTodo } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { backendRequest } from "@/lib/client"
import { extractItems } from "@/lib/api-response"
import type { Event, Task, TimeBlock } from "@/lib/types"

const fetcher = (path: string) => backendRequest<unknown>(path)

type ApiDateItem = {
  startTime?: string
  start_time?: string
  endTime?: string
  end_time?: string
}

type DashboardScheduleItem = {
  id: string
  title: string
  start: Date
  end: Date
  color: string
}

function getWeekRange() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 7)

  return { from: start.toISOString(), to: end.toISOString(), start, end }
}

function getStart(item: ApiDateItem) {
  return item.start_time || item.startTime || ""
}

function getEnd(item: ApiDateItem) {
  return item.end_time || item.endTime || ""
}

function isInWeek(value: Date, from: Date, to: Date) {
  return value >= from && value < to
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function priorityLabel(priority: number) {
  if (priority >= 4) return "Cao"
  if (priority <= 1) return "Thap"
  return "Vua"
}

const statusColors: Record<string, string> = {
  pending: "#2563eb",
  in_progress: "#f59e0b",
  completed: "#16a34a",
  skipped: "#64748b",
  overdue: "#dc2626",
}

const priorityColors: Record<string, string> = {
  P1: "#64748b",
  P2: "#2563eb",
  P3: "#f59e0b",
  P4: "#f97316",
  P5: "#dc2626",
}

function mapWeekItems(blocks: TimeBlock[], events: Event[], existingSourceIds: Set<string>, from: Date, to: Date) {
  const blockItems = blocks
    .map((block) => {
      const start = new Date(getStart(block))
      const end = new Date(getEnd(block))
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !isInWeek(start, from, to)) return null
      return {
        id: `block-${block.id}`,
        title: block.title,
        start,
        end,
        color: block.color || "#2563eb",
      }
    })
    .filter(Boolean) as DashboardScheduleItem[]

  const eventItems = events
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
        color: event.color || "#7c3aed",
      }
    })
    .filter(Boolean) as DashboardScheduleItem[]

  return [...blockItems, ...eventItems].sort((a, b) => a.start.getTime() - b.start.getTime())
}

export default function DashboardPage() {
  const range = useMemo(() => getWeekRange(), [])
  const tasks = useSWR("/api/v1/tasks", fetcher)
  const events = useSWR("/api/v1/events", fetcher)
  const timeBlocks = useSWR(
    `/api/v1/time-blocks?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
    fetcher,
  )

  const taskItems = extractItems<Task>(tasks.data as never)
  const eventItems = extractItems<Event>(events.data as never)
  const blockItems = extractItems<TimeBlock>(timeBlocks.data as never)
  const existingSourceIds = new Set(blockItems.map((block) => block.source_id).filter((id): id is string => Boolean(id)))
  const unscheduledTasks = taskItems.filter(
    (task) => task.status !== "completed" && !task.deadline && !existingSourceIds.has(task.id),
  )
  const weekItems = mapWeekItems(blockItems, eventItems, existingSourceIds, range.start, range.end)

  const stats = [
    { label: "Tasks", value: taskItems.length },
    { label: "Events", value: eventItems.length },
    { label: "Task chua xep", value: unscheduledTasks.length },
  ]
  const statusData = Object.entries(
    taskItems.reduce<Record<string, number>>((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))
  const priorityData = [1, 2, 3, 4, 5].map((priority) => ({
    name: `P${priority}`,
    value: taskItems.filter((task) => task.priority === priority).length,
  }))
  const eventByDayData = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(range.start)
    day.setDate(range.start.getDate() + index)
    return {
      name: day.toLocaleDateString("vi-VN", { weekday: "short" }),
      value: weekItems.filter((item) => item.start.getDay() === day.getDay()).length,
    }
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">Trang thai task</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={statusColors[entry.name] || "#2563eb"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">Priority task</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} width={28} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={priorityColors[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">Lich trong tuan</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventByDayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} width={28} />
                <Tooltip />
                <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListTodo className="h-4 w-4" />
              Task chua xep lich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unscheduledTasks.length === 0 && <p className="text-sm text-muted-foreground">Khong co task dang cho.</p>}
            {unscheduledTasks.map((task) => (
              <div key={task.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 font-medium">{task.title}</p>
                  <Badge variant="outline">{priorityLabel(task.priority)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {task.duration} phut{task.deadline ? ` - han ${new Date(task.deadline).toLocaleString("vi-VN")}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="h-4 w-4" />
              Su kien trong tuan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weekItems.length === 0 && (
              <p className="text-sm text-muted-foreground">Chua co block hay event nao trong tuan nay.</p>
            )}
            {weekItems.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-md border p-3" style={{ borderLeft: `4px solid ${item.color}` }}>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {item.start.toLocaleDateString("vi-VN")}
                  <Clock className="ml-2 h-3.5 w-3.5" />
                  {formatTime(item.start)} - {formatTime(item.end)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
