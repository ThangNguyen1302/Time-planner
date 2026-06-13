"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Clock, ListTodo, Plus, Sparkles, Target } from "lucide-react"
import Link from "next/link"
import type { Task, Event, TimeBlock } from "@/lib/types"
import { format, isToday, isTomorrow, differenceInDays } from "date-fns"
import { vi } from "date-fns/locale"

interface DashboardOverviewProps {
  tasks: Task[]
  events: Event[]
  timeBlocks: TimeBlock[]
  userId: string
}

export function DashboardOverview({ tasks, events, timeBlocks }: DashboardOverviewProps) {
  const pendingTasks = tasks.filter((t) => t.status === "pending").length
  const completedToday = timeBlocks.filter((b) => b.status === "completed").length
  const totalToday = timeBlocks.length

  const getDeadlineLabel = (deadline: string | undefined) => {
    if (!deadline) return null
    const date = new Date(deadline)
    if (isToday(date)) return "Hôm nay"
    if (isTomorrow(date)) return "Ngày mai"
    const days = differenceInDays(date, new Date())
    if (days < 0) return "Quá hạn"
    if (days <= 7) return `${days} ngày`
    return format(date, "dd/MM", { locale: vi })
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return "bg-destructive/10 text-destructive"
      case 4:
        return "bg-orange-500/10 text-orange-600"
      case 3:
        return "bg-yellow-500/10 text-yellow-600"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks cần làm</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter((t) => t.deadline && isToday(new Date(t.deadline))).length} deadline hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sự kiện hôm nay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              {timeBlocks.filter((b) => b.block_type === "event").length} đã lên lịch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tiến độ hôm nay</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {completedToday}/{totalToday} blocks hoàn thành
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lịch hôm nay
            </CardTitle>
            <Link href="/dashboard/calendar">
              <Button variant="ghost" size="sm">
                Xem tất cả
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {timeBlocks.length > 0 ? (
              <div className="space-y-3">
                {timeBlocks.slice(0, 5).map((block) => (
                  <div key={block.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-1 h-10 rounded-full" style={{ backgroundColor: block.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{block.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(block.start_time), "HH:mm")} - {format(new Date(block.end_time), "HH:mm")}
                      </p>
                    </div>
                    {block.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Chưa có lịch hôm nay</p>
                <Link href="/dashboard/calendar?autoplan=true">
                  <Button size="sm" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Auto Plan
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Tasks ưu tiên
            </CardTitle>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Thêm
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-1 h-10 rounded-full" style={{ backgroundColor: task.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{task.duration} phút</span>
                        {task.deadline && (
                          <Badge
                            variant="secondary"
                            className={
                              differenceInDays(new Date(task.deadline), new Date()) < 0
                                ? "bg-destructive/10 text-destructive"
                                : ""
                            }
                          >
                            {getDeadlineLabel(task.deadline)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                      P{task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ListTodo className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Chưa có task nào</p>
                <Link href="/dashboard/tasks">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tạo task đầu tiên
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/tasks?new=true">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Tạo Task
              </Button>
            </Link>
            <Link href="/dashboard/events?new=true">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Tạo Event
              </Button>
            </Link>
            <Link href="/dashboard/calendar?autoplan=true">
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Auto Plan tuần này
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
