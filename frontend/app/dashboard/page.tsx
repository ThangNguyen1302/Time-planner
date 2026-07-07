"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { CalendarDays, CheckSquare, Clock, ListTodo, TrendingUp, AlertCircle, Calendar } from "lucide-react"
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
  if (priority <= 1) return "Thấp"
  return "Vừa"
}

const statusColors: Record<string, string> = {
  pending: "#2563eb",
  in_progress: "#f59e0b",
  completed: "#16a34a",
  skipped: "#64748b",
  overdue: "#dc2626",
}

const statusLabels: Record<string, string> = {
  pending: "Chờ",
  in_progress: "Đang làm",
  completed: "Hoàn thành",
  skipped: "Bỏ qua",
  overdue: "Quá hạn",
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

  const completedTasks = taskItems.filter((t) => t.status === "completed").length
  const completionRate = taskItems.length > 0 ? Math.round((completedTasks / taskItems.length) * 100) : 0

  const stats = [
    {
      label: "Tổng tasks",
      value: taskItems.length,
      icon: ListTodo,
      hint: `${completedTasks} đã hoàn thành`,
      accent: "from-blue-500/15 to-blue-500/5 text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Sự kiện",
      value: eventItems.length,
      icon: Calendar,
      hint: "Tổng sự kiện đã tạo",
      accent: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "Task chưa xếp",
      value: unscheduledTasks.length,
      icon: AlertCircle,
      hint: "Cần sắp xếp lịch",
      accent: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Tỷ lệ hoàn thành",
      value: `${completionRate}%`,
      icon: TrendingUp,
      hint: "Tasks hoàn thành / tổng",
      accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
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
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-60`} />
            <CardContent className="relative flex items-start justify-between p-5">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </div>
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
                <stat.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="py-5">
            <CardTitle className="text-base">Trạng thái task</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={statusColors[entry.name] || "#2563eb"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [value, statusLabels[name] || name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-5">
            <CardTitle className="text-base">Priority task</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={priorityColors[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-5">
            <CardTitle className="text-base">Lịch trong tuần</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventByDayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListTodo className="size-4 text-primary" />
              Task chưa xếp lịch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {unscheduledTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
                  <CheckSquare className="size-5" />
                </div>
                <p className="text-sm text-muted-foreground">Tất cả task đã được xếp lịch</p>
              </div>
            )}
            {unscheduledTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3 transition-colors hover:border-border hover:bg-accent/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{task.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {task.duration} phút
                    {task.deadline ? ` - hạn ${new Date(task.deadline).toLocaleString("vi-VN")}` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">{priorityLabel(task.priority)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="size-4 text-primary" />
              Sự kiện trong tuần
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {weekItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 mb-3">
                  <CalendarDays className="size-5" />
                </div>
                <p className="text-sm text-muted-foreground">Chưa có block hay event nào trong tuần này</p>
              </div>
            )}
            {weekItems.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition-colors hover:border-border hover:bg-accent/30"
                style={{ borderLeft: `3px solid ${item.color}` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{item.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {item.start.toLocaleDateString("vi-VN")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTime(item.start)} - {formatTime(item.end)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
