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

const navigation = [
  { name: "Tổng quan", href: "/dashboard", icon: Home },
  { name: "Lịch", href: "/dashboard/calendar", icon: Calendar },
  { name: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { name: "Events", href: "/dashboard/events", icon: CheckSquare },
  { name: "Trợ lý", href: "/dashboard/assistant", icon: Bot },
  { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Clock className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-sidebar-foreground">TimePlanner</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
