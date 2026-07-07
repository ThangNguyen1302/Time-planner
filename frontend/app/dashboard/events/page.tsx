"use client"

import type React from "react"
import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  AlertTriangle,
  Calendar,
  Clock,
  Edit2,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"
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
import type { Event } from "@/lib/types"

const fetcher = (path: string) => backendRequest<unknown>(path)

const DEFAULT_COLOR = "#8B5CF6"

const colorSwatches = [
  "#8B5CF6",
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#f97316",
  "#dc2626",
  "#06b6d4",
  "#64748b",
]

function isValidDate(value: string) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

function formatDate(value?: string) {
  if (!value || !isValidDate(value)) return null
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatTime(value?: string) {
  if (!value || !isValidDate(value)) return null
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function formatDateTime(value?: string) {
  const date = formatDate(value)
  const time = formatTime(value)
  if (!date && !time) return "—"
  if (date && time) return `${date} · ${time}`
  return date || time
}

function isSameDay(a: string, b: string) {
  if (!isValidDate(a) || !isValidDate(b)) return false
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

function isUpcoming(value: string) {
  if (!isValidDate(value)) return false
  return new Date(value).getTime() > Date.now()
}

function isPast(value: string) {
  if (!isValidDate(value)) return false
  return new Date(value).getTime() < Date.now()
}

export default function EventsPage() {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [fromFilter, setFromFilter] = useState("")
  const [toFilter, setToFilter] = useState("")
  const eventKey = `/api/v1/events?page=${page}&size=${pageSize}`
  const { data, error, isLoading, mutate } = useSWR(eventKey, fetcher)
  const events = extractItems<Event>(data as never)
  const meta = extractMeta(data as never)
  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const from = fromFilter ? new Date(fromFilter) : null
    const to = toFilter ? new Date(toFilter) : null
    return events.filter((event) => {
      const titleMatch =
        !normalizedSearch ||
        event.title.toLowerCase().includes(normalizedSearch) ||
        (event.description || "").toLowerCase().includes(normalizedSearch)
      const start = new Date(event.start_time)
      const fromMatch = !from || start >= from
      const toMatch = !to || start <= to
      return titleMatch && fromMatch && toMatch
    })
  }, [events, fromFilter, search, toFilter])
  const totalPages = Math.max(meta.totalPages ?? 1, 1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await backendRequest("/api/v1/events", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        startTime: fromDateInputValue(String(form.get("startTime") || "")),
        endTime: fromDateInputValue(String(form.get("endTime") || "")),
        color: form.get("color") || DEFAULT_COLOR,
      }),
    })
    event.currentTarget.reset()
    mutate()
  }

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>, eventId: string) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await backendRequest(`/api/v1/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        startTime: fromDateInputValue(String(form.get("startTime") || "")),
        endTime: fromDateInputValue(String(form.get("endTime") || "")),
      }),
    })
    setEditingId(null)
    mutate()
  }

  const confirmDelete = async () => {
    if (!deleteEvent) return
    setIsDeleting(true)
    try {
      await backendRequest(`/api/v1/events/${deleteEvent.id}`, { method: "DELETE" })
      setDeleteEvent(null)
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
            <Calendar className="size-4 text-primary" />
            Tạo sự kiện mới
          </CardTitle>
          <CardDescription>Tạo và chỉnh sửa sự kiện trong lịch.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-[1fr_1fr_190px_190px_auto]">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input id="title" name="title" required placeholder="Nhập tiêu đề..." />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" name="description" placeholder="Mô tả ngắn..." />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="startTime">Bắt đầu</Label>
              <Input id="startTime" name="startTime" type="datetime-local" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="endTime">Kết thúc</Label>
              <Input id="endTime" name="endTime" type="datetime-local" required />
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
          <CardTitle className="text-base">Danh sách sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_140px]">
            <div className="grid gap-1.5">
              <Label htmlFor="event-search">Tìm kiếm</Label>
              <Input
                id="event-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tiêu đề hoặc mô tả"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-from">Từ ngày</Label>
              <Input id="event-from" type="datetime-local" value={fromFilter} onChange={(event) => setFromFilter(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-to">Đến ngày</Label>
              <Input id="event-to" type="datetime-local" value={toFilter} onChange={(event) => setToFilter(event.target.value)} />
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
          {!isLoading && !filteredEvents.length && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <Calendar className="size-5" />
              </div>
              <p className="text-sm text-muted-foreground">Không tìm thấy sự kiện nào.</p>
            </div>
          )}
          <div className="space-y-3">
            {filteredEvents.map((item) => {
              const isEditing = editingId === item.id
              const color = item.color || DEFAULT_COLOR
              const startValid = isValidDate(item.start_time)
              const multiDay = startValid && isValidDate(item.end_time) && !isSameDay(item.start_time, item.end_time)
              const upcoming = startValid && isUpcoming(item.start_time)
              const past = startValid && isPast(item.end_time)

              return (
                <div
                  key={item.id}
                  className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border hover:bg-accent/30"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  {isEditing ? (
                    <form onSubmit={(event) => handleUpdate(event, item.id)} className="grid gap-3 lg:grid-cols-6">
                      <div className="grid gap-1.5 lg:col-span-2">
                        <Label htmlFor={`event-title-${item.id}`}>Tiêu đề</Label>
                        <Input id={`event-title-${item.id}`} name="title" defaultValue={item.title} required />
                      </div>
                      <div className="grid gap-1.5 lg:col-span-4">
                        <Label htmlFor={`event-description-${item.id}`}>Mô tả</Label>
                        <Textarea
                          id={`event-description-${item.id}`}
                          name="description"
                          defaultValue={item.description || ""}
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-1.5 lg:col-span-2">
                        <Label htmlFor={`event-start-${item.id}`}>Bắt đầu</Label>
                        <Input
                          id={`event-start-${item.id}`}
                          name="startTime"
                          type="datetime-local"
                          defaultValue={toDateInputValue(item.start_time)}
                          required
                        />
                      </div>
                      <div className="grid gap-1.5 lg:col-span-2">
                        <Label htmlFor={`event-end-${item.id}`}>Kết thúc</Label>
                        <Input
                          id={`event-end-${item.id}`}
                          name="endTime"
                          type="datetime-local"
                          defaultValue={toDateInputValue(item.end_time)}
                          required
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`event-color-${item.id}`}>Màu</Label>
                        <div className="flex h-9 flex-wrap items-center gap-1.5">
                          {colorSwatches.map((swatch) => (
                            <label key={swatch} className="cursor-pointer">
                              <input
                                type="radio"
                                name="color"
                                value={swatch}
                                defaultChecked={swatch === (item.color || DEFAULT_COLOR)}
                                className="sr-only"
                              />
                              <span
                                className="block size-6 rounded-full ring-offset-2 ring-offset-background transition hover:scale-110 has-[:checked]:ring-2 has-[:checked]:ring-foreground/40"
                                style={{ backgroundColor: swatch }}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-end gap-2 lg:col-span-1">
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
                        className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: color }}
                      >
                        <Calendar className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium leading-tight">{item.title}</p>
                          {item.is_recurring && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Lặp lại
                            </span>
                          )}
                          {upcoming && (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              Sắp tới
                            </span>
                          )}
                          {past && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Đã qua
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatDate(item.start_time)}
                            {multiDay && ` → ${formatDate(item.end_time)}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" onClick={() => setEditingId(item.id)} title="Chỉnh sửa">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteEvent(item)}
                          title="Xoá"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              Trang {page + 1} / {totalPages}
              {typeof meta.totalElements === "number" ? ` - ${meta.totalElements} sự kiện` : ""}
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

      <Dialog open={deleteEvent !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteEvent(null)}>
        <DialogContent className="sm:max-w-md" showCloseButton={!isDeleting}>
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>Xoá sự kiện?</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Sự kiện{" "}
              <span className="font-medium text-foreground">{deleteEvent?.title}</span> sẽ bị xoá vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteEvent(null)} disabled={isDeleting}>
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
