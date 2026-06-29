"use client"

import type React from "react"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { Edit2, Loader2, Plus, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { backendRequest } from "@/lib/client"
import { extractItems, extractMeta, fromDateInputValue, toDateInputValue } from "@/lib/api-response"
import type { Event } from "@/lib/types"

const fetcher = (path: string) => backendRequest<unknown>(path)

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
        color: "#8B5CF6",
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

  const removeEvent = async (id: string) => {
    await backendRequest(`/api/v1/events/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sự kiện</CardTitle>
          <CardDescription>Tạo và chỉnh sửa sự kiện trong lịch.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-[1fr_1fr_190px_190px_auto]">
            <div className="grid gap-1">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" name="description" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="startTime">Bắt đầu</Label>
              <Input id="startTime" name="startTime" type="datetime-local" required />
            </div>
            <div className="grid gap-1">
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
        <CardContent className="pt-6">
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px_140px]">
            <div className="grid gap-1">
              <Label htmlFor="event-search">Tìm kiếm</Label>
              <Input
                id="event-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tiêu đề hoặc mô tả"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="event-from">Từ ngày</Label>
              <Input id="event-from" type="datetime-local" value={fromFilter} onChange={(event) => setFromFilter(event.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="event-to">Đến ngày</Label>
              <Input id="event-to" type="datetime-local" value={toFilter} onChange={(event) => setToFilter(event.target.value)} />
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
          {!isLoading && !filteredEvents.length && <p className="text-sm text-muted-foreground">Không tìm thấy sự kiện nào.</p>}
          <div className="space-y-3">
            {filteredEvents.map((item) => {
              const isEditing = editingId === item.id

              return (
                <div key={item.id} className="rounded-md border p-3">
                  {isEditing ? (
                    <form onSubmit={(event) => handleUpdate(event, item.id)} className="grid gap-3 lg:grid-cols-6">
                      <div className="grid gap-1 lg:col-span-2">
                        <Label htmlFor={`event-title-${item.id}`}>Tiêu đề</Label>
                        <Input id={`event-title-${item.id}`} name="title" defaultValue={item.title} required />
                      </div>
                      <div className="grid gap-1 lg:col-span-4">
                        <Label htmlFor={`event-description-${item.id}`}>Mô tả</Label>
                        <Textarea
                          id={`event-description-${item.id}`}
                          name="description"
                          defaultValue={item.description || ""}
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-1 lg:col-span-2">
                        <Label htmlFor={`event-start-${item.id}`}>Bắt đầu</Label>
                        <Input
                          id={`event-start-${item.id}`}
                          name="startTime"
                          type="datetime-local"
                          defaultValue={toDateInputValue(item.start_time)}
                          required
                        />
                      </div>
                      <div className="grid gap-1 lg:col-span-2">
                        <Label htmlFor={`event-end-${item.id}`}>Kết thúc</Label>
                        <Input
                          id={`event-end-${item.id}`}
                          name="endTime"
                          type="datetime-local"
                          defaultValue={toDateInputValue(item.end_time)}
                          required
                        />
                      </div>
                      <div className="flex items-end gap-2 lg:col-span-2">
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
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {toDateInputValue(item.start_time)} - {toDateInputValue(item.end_time)}
                        </p>
                        {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(item.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeEvent(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
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
    </div>
  )
}
