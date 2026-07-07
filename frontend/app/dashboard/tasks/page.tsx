"use client"

import type React from "react"
import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  CircleDashed,
  Clock,
  Edit2,
  ListTodo,
  Loader2,
  Plus,
  Save,
  Timer,
  Trash2,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { backendRequest } from "@/lib/client"
import { extractItems, extractMeta, fromDateInputValue, toDateInputValue } from "@/lib/api-response"
import type { Task } from "@/lib/types"

const fetcher = (path: string) => backendRequest<unknown>(path)

const taskStatuses: Task["status"][] = ["pending", "in_progress", "completed", "skipped", "overdue"]

type StatusConfig = {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
  dot: string
  icon: React.ComponentType<{ className?: string }>
}

const statusConfig: Record<Task["status"], StatusConfig> = {
  pending: { label: "Chờ", variant: "info", dot: "bg-blue-500", icon: CircleDashed },
  in_progress: { label: "Đang làm", variant: "warning", dot: "bg-amber-500", icon: Timer },
  completed: { label: "Hoàn thành", variant: "success", dot: "bg-emerald-500", icon: CheckCircle2 },
  skipped: { label: "Bỏ qua", variant: "secondary", dot: "bg-slate-400", icon: CircleDashed },
  overdue: { label: "Quá hạn", variant: "destructive", dot: "bg-red-500", icon: AlertTriangle },
}

const priorityConfig: Record<number, { label: string; badge: string; bar: string }> = {
  1: { label: "P1 · Thấp", badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400", bar: "bg-slate-400" },
  2: { label: "P2", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
  3: { label: "P3", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  4: { label: "P4", badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400", bar: "bg-orange-500" },
  5: { label: "P5 · Cao", badge: "bg-red-500/10 text-red-600 dark:text-red-400", bar: "bg-red-500" },
}

function priorityOf(priority: number) {
  return priorityConfig[priority] ?? priorityConfig[2]
}

function addMinutes(value: string, minutes: number) {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}

function formatDeadline(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function TasksPage() {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [search, setSearch] = useState("")
  const taskKey = `/api/v1/tasks?page=${page}&size=${pageSize}&sortBy=createdAt&sortDir=desc${
    statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : ""
  }`
  const { data, error, isLoading, mutate } = useSWR(taskKey, fetcher)
  const tasks = extractItems<Task>(data as never)
  const meta = extractMeta(data as never)
  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        (task.description || "").toLowerCase().includes(normalizedSearch)
      const matchesPriority = priorityFilter === "all" || task.priority === Number(priorityFilter)
      return matchesSearch && matchesPriority
    })
  }, [priorityFilter, search, tasks])
  const totalPages = Math.max(meta.totalPages ?? 1, 1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
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
    mutate()
  }

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>, taskId: string) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await backendRequest(`/api/v1/tasks/${taskId}`, {
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
    setEditingId(null)
    mutate()
  }

  const handleSchedule = async (event: React.FormEvent<HTMLFormElement>, task: Task) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const startInput = String(form.get("startTime") || "")
    const endInput = String(form.get("endTime") || "")
    const startTime = fromDateInputValue(startInput)
    const endTime = endInput ? fromDateInputValue(endInput) : addMinutes(startInput, task.duration)

    await backendRequest("/api/v1/time-blocks", {
      method: "POST",
      body: JSON.stringify({
        title: task.title,
        startTime,
        endTime,
        blockType: "task",
        sourceId: task.id,
        color: task.color || "#3B82F6",
        isManualOverride: true,
      }),
    })
    setSchedulingId(null)
  }

  const updateStatus = async (id: string, status: Task["status"]) => {
    await backendRequest(`/api/v1/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    mutate()
  }

  const confirmDelete = async () => {
    if (!deleteTask) return
    setIsDeleting(true)
    try {
      await backendRequest(`/api/v1/tasks/${deleteTask.id}`, { method: "DELETE" })
      setDeleteTask(null)
      mutate()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="py-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="size-4 text-primary" />
            Tạo công việc mới
          </CardTitle>
          <CardDescription>Tạo công việc, chỉnh sửa chi tiết và thêm vào lịch của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-[1fr_1.5fr_140px_180px_120px_auto]">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input id="title" name="title" required placeholder="Nhập tiêu đề..." />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" name="description" placeholder="Mô tả ngắn..." />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="duration">Thời lượng (phút)</Label>
              <Input id="duration" name="duration" type="number" min={1} defaultValue={30} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="deadline">Hạn chót</Label>
              <Input id="deadline" name="deadline" type="datetime-local" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="priority">Ưu tiên</Label>
              <Input id="priority" name="priority" type="number" min={1} max={5} defaultValue={2} />
            </div>
            <Button type="submit" className="self-end">
              <Plus className="mr-2 h-4 w-4" />
              Thêm
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-5">
          <CardTitle className="text-base">Danh sách công việc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_140px]">
            <div className="grid gap-1.5">
              <Label htmlFor="task-search">Tìm kiếm</Label>
              <Input
                id="task-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tiêu đề hoặc mô tả"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Trạng thái</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {taskStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Mức ưu tiên</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức ưu tiên</SelectItem>
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <SelectItem key={priority} value={String(priority)}>
                      {priorityOf(priority).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Số lượng/trang</Label>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          {!isLoading && !filteredTasks.length && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <ListTodo className="size-5" />
              </div>
              <p className="text-sm text-muted-foreground">Không tìm thấy công việc nào.</p>
            </div>
          )}
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isEditing = editingId === task.id
              const isScheduling = schedulingId === task.id
              const status = statusConfig[task.status]
              const priority = priorityOf(task.priority)
              const deadline = formatDeadline(task.deadline)
              const StatusIcon = status.icon

              return (
                <div
                  key={task.id}
                  className="group space-y-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border hover:bg-accent/30"
                >
                  {isEditing ? (
                    <form onSubmit={(event) => handleUpdate(event, task.id)} className="grid gap-3 lg:grid-cols-6">
                      <div className="grid gap-1.5 lg:col-span-2">
                        <Label htmlFor={`task-title-${task.id}`}>Tiêu đề</Label>
                        <Input id={`task-title-${task.id}`} name="title" defaultValue={task.title} required />
                      </div>
                      <div className="grid gap-1.5 lg:col-span-4">
                        <Label htmlFor={`task-description-${task.id}`}>Mô tả</Label>
                        <Textarea
                          id={`task-description-${task.id}`}
                          name="description"
                          defaultValue={task.description || ""}
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`task-duration-${task.id}`}>Phút</Label>
                        <Input
                          id={`task-duration-${task.id}`}
                          name="duration"
                          type="number"
                          min={1}
                          defaultValue={task.duration}
                        />
                      </div>
                      <div className="grid gap-1.5 lg:col-span-2">
                        <Label htmlFor={`task-deadline-${task.id}`}>Hạn chót</Label>
                        <Input
                          id={`task-deadline-${task.id}`}
                          name="deadline"
                          type="datetime-local"
                          defaultValue={toDateInputValue(task.deadline)}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`task-priority-${task.id}`}>Ưu tiên</Label>
                        <Input
                          id={`task-priority-${task.id}`}
                          name="priority"
                          type="number"
                          min={1}
                          max={5}
                          defaultValue={task.priority}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`task-status-${task.id}`}>Trạng thái</Label>
                        <select
                          id={`task-status-${task.id}`}
                          name="status"
                          defaultValue={task.status}
                          className="h-9 rounded-md border bg-background px-3 text-sm"
                        >
                          {taskStatuses.map((s) => (
                            <option key={s} value={s}>
                              {statusConfig[s].label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Button type="submit" size="sm">
                          <Save className="mr-2 h-4 w-4" />
                          Lưu
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          <X className="mr-2 h-4 w-4" />
                          Hủy
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start gap-3">
                      <div
                        className={`mt-1 h-9 w-1.5 shrink-0 rounded-full ${priority.bar}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium leading-tight">{task.title}</p>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="size-3" />
                            {status.label}
                          </Badge>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priority.badge}`}
                          >
                            {priority.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {task.duration} phút
                          </span>
                          {deadline && (
                            <span className={`flex items-center gap-1 ${task.status === "overdue" ? "text-destructive" : ""}`}>
                              <CalendarPlus className="size-3" />
                              Hạn {deadline}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {task.status !== "completed" && (
                          <Button variant="outline" size="sm" onClick={() => updateStatus(task.id, "completed")}>
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Hoàn thành
                          </Button>
                        )}
                        <Button
                          variant={isScheduling ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setSchedulingId(isScheduling ? null : task.id)}
                        >
                          <CalendarPlus className="mr-1.5 h-4 w-4" />
                          Xếp lịch
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingId(task.id)} title="Chỉnh sửa">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTask(task)}
                          title="Xoá"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {isScheduling && !isEditing && (
                    <form
                      onSubmit={(event) => handleSchedule(event, task)}
                      className="grid gap-3 border-t border-border/60 pt-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <div className="grid gap-1.5">
                        <Label htmlFor={`schedule-start-${task.id}`}>Bắt đầu</Label>
                        <Input id={`schedule-start-${task.id}`} name="startTime" type="datetime-local" required />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`schedule-end-${task.id}`}>Kết thúc</Label>
                        <Input id={`schedule-end-${task.id}`} name="endTime" type="datetime-local" />
                      </div>
                      <Button type="submit" className="self-end">
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Giao việc
                      </Button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              Trang {page + 1} / {totalPages}
              {typeof meta.totalElements === "number" ? ` - ${meta.totalElements} công việc` : ""}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteTask !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteTask(null)}>
        <DialogContent className="sm:max-w-md" showCloseButton={!isDeleting}>
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>Xoá công việc?</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Công việc{" "}
              <span className="font-medium text-foreground">{deleteTask?.title}</span> sẽ bị xoá vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteTask(null)} disabled={isDeleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
