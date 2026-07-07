"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, CheckSquare, Clock, Home, ListTodo, Settings, Bot } from "lucide-react"

type DashboardUser = {
  email?: string | null
}

interface DashboardSidebarProps {
  user: DashboardUser
}

const navSections = [
  {
    label: "Menu",
    items: [
      { name: "Tổng quan", href: "/dashboard", icon: Home },
      { name: "Lịch", href: "/dashboard/calendar", icon: Calendar },
      { name: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
      { name: "Events", href: "/dashboard/events", icon: CheckSquare },
      { name: "Trợ lý", href: "/dashboard/assistant", icon: Bot },
    ],
  },
  {
    label: "Tài khoản",
    items: [
      { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()

  const initials = (user?.email ?? "?").charAt(0).toUpperCase()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary shadow-sm shadow-sidebar-primary/30 transition-transform group-hover:scale-105">
            <Clock className="size-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-[1.05rem] tracking-tight text-sidebar-foreground">
            TimePlanner
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-3 mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    {/* Active indicator bar */}
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-all duration-200 ease-out",
                        isActive
                          ? "opacity-100 scale-y-100"
                          : "opacity-0 scale-y-0",
                      )}
                    />
                    <item.icon
                      className={cn(
                        "size-[1.15rem] shrink-0 transition-colors",
                        isActive
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80",
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent/50"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sm font-semibold text-sidebar-primary-foreground shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.email ?? "Người dùng"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/50">
              Quản lý tài khoản
            </p>
          </div>
          <Settings className="size-4 shrink-0 text-sidebar-foreground/40" />
        </Link>
      </div>
    </aside>
  )
}
