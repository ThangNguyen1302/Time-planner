"use client"

import type React from "react"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { CalendarPlus, Edit2, Loader2, Plus, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { backendRequest } from "@/lib/client"
import { extractItems, extractMeta, fromDateInputValue, toDateInputValue } from "@/lib/api-response"
import type { Task } from "@/lib/types"

const fetcher = (path: string) => backendRequest<unknown>(path)

const taskStatuses: Task["status"][] = ["pending", "in_progress", "completed", "skipped", "overdue"]

function addMinutes(value: string, minutes: number) {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
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

  const removeTask = async (id: string) => {
    await backendRequest(`/api/v1/tasks/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Công việc</CardTitle>
          <CardDescription>Tạo công việc, chỉnh sửa chi tiết và thêm vào lịch của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-[1fr_1.5fr_140px_180px_120px_auto]">
            <div className="grid gap-1">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" name="description" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="duration">Thời lượng (phút)</Label>
              <Input id="duration" name="duration" type="number" min={1} defaultValue={30} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="deadline">Hạn chót</Label>
              <Input id="deadline" name="deadline" type="datetime-local" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="priority">Mức độ ưu tiên</Label>
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
        <CardContent className="pt-6">
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px_140px]">
            <div className="grid gap-1">
              <Label htmlFor="task-search">Tìm kiếm</Label>
              <Input
                id="task-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tiêu đề hoặc mô tả"
              />
            </div>
            <div className="grid gap-1">
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
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Mức ưu tiên</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức ưu tiên</SelectItem>
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <SelectItem key={priority} value={String(priority)}>
                      P{priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
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

          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          {!isLoading && !filteredTasks.length && <p className="text-sm text-muted-foreground">Không tìm thấy công việc nào.</p>}
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isEditing = editingId === task.id
              const isScheduling = schedulingId === task.id

              return (
                <div key={task.id} className="space-y-3 rounded-md border p-3">
                  {isEditing ? (
                    <form onSubmit={(event) => handleUpdate(event, task.id)} className="grid gap-3 lg:grid-cols-6">
                      <div className="grid gap-1 lg:col-span-2">
                        <Label htmlFor={`task-title-${task.id}`}>Tiêu đề</Label>
                        <Input id={`task-title-${task.id}`} name="title" defaultValue={task.title} required />
                      </div>
                      <div className="grid gap-1 lg:col-span-4">
                        <Label htmlFor={`task-description-${task.id}`}>Mô tả</Label>
                        <Textarea
                          id={`task-description-${task.id}`}
                          name="description"
                          defaultValue={task.description || ""}
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor={`task-duration-${task.id}`}>Phút</Label>
                        <Input
                          id={`task-duration-${task.id}`}
                          name="duration"
                          type="number"
                          min={1}
                          defaultValue={task.duration}
                        />
                      </div>
                      <div className="grid gap-1 lg:col-span-2">
                        <Label htmlFor={`task-deadline-${task.id}`}>Hạn chót</Label>
                        <Input
                          id={`task-deadline-${task.id}`}
                          name="deadline"
                          type="datetime-local"
                          defaultValue={toDateInputValue(task.deadline)}
                        />
                      </div>
                      <div className="grid gap-1">
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
                      <div className="grid gap-1">
                        <Label htmlFor={`task-status-${task.id}`}>Trạng thái</Label>
                        <select
                          id={`task-status-${task.id}`}
                          name="status"
                          defaultValue={task.status}
                          className="h-9 rounded-md border bg-background px-3 text-sm"
                        >
                          {taskStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
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
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.status} - {task.duration} phút - ưu tiên {task.priority}
                        </p>
                        {task.description && <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(task.id, "completed")}>
                        Hoàn thành
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSchedulingId(isScheduling ? null : task.id)}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Xếp lịch
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(task.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {isScheduling && !isEditing && (
                    <form
                      onSubmit={(event) => handleSchedule(event, task)}
                      className="grid gap-3 border-t pt-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <div className="grid gap-1">
                        <Label htmlFor={`schedule-start-${task.id}`}>Bắt đầu</Label>
                        <Input id={`schedule-start-${task.id}`} name="startTime" type="datetime-local" required />
                      </div>
                      <div className="grid gap-1">
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
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
    </div>
  )
}
