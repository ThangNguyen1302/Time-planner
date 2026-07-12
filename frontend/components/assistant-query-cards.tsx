"use client"

import React from "react"
import { CheckCircle2, Clock, Calendar, AlertCircle, Repeat, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TaskCardData {
  id: string
  title: string
  description?: string
  duration?: number
  deadline?: string
  priority?: number
  status?: string
  color?: string
}

export interface EventCardData {
  id: string
  title: string
  description?: string
  startTime?: string
  endTime?: string
  isRecurring?: boolean
  recurrenceRule?: string
  color?: string
}

export function TaskCardList({ tasks }: { tasks: TaskCardData[] }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-[0.78rem] text-muted-foreground italic py-1 px-2">
        Không tìm thấy công việc nào.
      </div>
    )
  }

  return (
    <div className="grid gap-2 my-2.5 max-h-[260px] overflow-y-auto pr-1">
      {tasks.map((task) => {
        const priorityColor =
          task.priority === 1
            ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
            : task.priority === 2
            ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
            : "text-blue-500 bg-blue-500/10 border-blue-500/20"
        
        const priorityLabel =
          task.priority === 1 ? "Ưu tiên cao" : task.priority === 2 ? "Trung bình" : "Bình thường"

        const statusLabel =
          task.status === "completed"
            ? "Hoàn thành"
            : task.status === "in_progress"
            ? "Đang làm"
            : task.status === "overdue"
            ? "Quá hạn"
            : "Chờ làm"

        const statusColor =
          task.status === "completed"
            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
            : task.status === "overdue"
            ? "text-rose-600 dark:text-rose-400 bg-rose-500/10"
            : "text-muted-foreground bg-muted"

        const formatTime = (iso?: string) => {
          if (!iso) return null
          try {
            const d = new Date(iso)
            return d.toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          } catch {
            return iso
          }
        }

        return (
          <div
            key={task.id}
            className={cn(
              "flex flex-col gap-1.5 p-2.5 rounded-xl border bg-background/80 hover:bg-background/95 transition-all shadow-xs relative overflow-hidden",
              task.status === "completed" && "opacity-75"
            )}
            style={{
              borderLeftColor: task.color || "var(--primary)",
              borderLeftWidth: "4px",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={cn("font-semibold text-[0.8rem] leading-snug tracking-tight text-foreground", task.status === "completed" && "line-through text-muted-foreground")}>
                {task.title}
              </span>
              <span className={cn("text-[0.68rem] px-2 py-0.5 rounded-full font-medium shrink-0", statusColor)}>
                {statusLabel}
              </span>
            </div>

            {task.description && (
              <p className="text-[0.72rem] text-muted-foreground line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1 mt-0.5 border-t border-border/40 text-[0.7rem] text-muted-foreground">
              {task.priority !== undefined && (
                <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-medium text-[0.65rem]", priorityColor)}>
                  <Flag className="w-2.5 h-2.5" />
                  {priorityLabel}
                </span>
              )}

              {task.duration && task.duration > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  {task.duration} phút
                </span>
              )}

              {task.deadline && (
                <span className="inline-flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  Hạn: {formatTime(task.deadline)}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function EventCardList({ events }: { events: EventCardData[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-[0.78rem] text-muted-foreground italic py-1 px-2">
        Không tìm thấy sự kiện nào.
      </div>
    )
  }

  const formatTime = (iso?: string) => {
    if (!iso) return null
    try {
      const d = new Date(iso)
      return d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="grid gap-2 my-2.5 max-h-[260px] overflow-y-auto pr-1">
      {events.map((evt) => {
        return (
          <div
            key={evt.id}
            className="flex flex-col gap-1.5 p-2.5 rounded-xl border bg-background/80 hover:bg-background/95 transition-all shadow-xs relative overflow-hidden"
            style={{
              borderLeftColor: evt.color || "var(--primary)",
              borderLeftWidth: "4px",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-[0.8rem] leading-snug tracking-tight text-foreground">
                {evt.title}
              </span>
              {evt.isRecurring && (
                <span className="inline-flex items-center gap-0.5 text-[0.65rem] text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                  <Repeat className="w-2.5 h-2.5" />
                  Định kỳ
                </span>
              )}
            </div>

            {evt.description && (
              <p className="text-[0.72rem] text-muted-foreground line-clamp-2 leading-relaxed">
                {evt.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1 mt-0.5 border-t border-border/40 text-[0.7rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" />
                {formatTime(evt.startTime)} {evt.endTime ? `→ ${formatTime(evt.endTime)}` : ""}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
