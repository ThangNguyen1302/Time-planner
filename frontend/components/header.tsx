"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Menu, Settings, Calendar, Home, ListTodo, CheckSquare, Clock, Bot, ChevronDown } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

type DashboardUser = {
  email?: string | null
}

interface DashboardHeaderProps {
  user: DashboardUser
}

const navigation = [
  { name: "Tổng quan", href: "/dashboard", icon: Home, description: "Tổng quan hoạt động" },
  { name: "Lịch", href: "/dashboard/calendar", icon: Calendar, description: "Xem lịch tháng" },
  { name: "Tasks", href: "/dashboard/tasks", icon: ListTodo, description: "Quản lý công việc" },
  { name: "Events", href: "/dashboard/events", icon: CheckSquare, description: "Quản lý sự kiện" },
  { name: "Trợ lý", href: "/dashboard/assistant", icon: Bot, description: "Trợ lý ảo" },
  { name: "Cài đặt", href: "/dashboard/settings", icon: Settings, description: "Thiết lập tài khoản" },
]

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleSignOut = async () => {
    await logout()
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const currentPage = navigation.find(
    (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  )
  const pageTitle = currentPage?.name || "Dashboard"
  const pageDescription = currentPage?.description || ""

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Điều hướng dashboard</SheetDescription>
            </SheetHeader>
            <div className="flex h-16 items-center gap-2.5 px-5 border-b border-border">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
                <Clock className="size-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-[1.05rem] tracking-tight">TimePlanner</span>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Page title */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="font-semibold text-[1.05rem] leading-tight tracking-tight truncate">
            {pageTitle}
          </h1>
          {pageDescription && (
            <p className="hidden sm:block text-xs text-muted-foreground truncate">
              {pageDescription}
            </p>
          )}
        </div>

        <div className="flex-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <Avatar className="size-8 ring-2 ring-border">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-[0.8rem] font-semibold text-primary-foreground">
                  {getInitials(user.email || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-xs font-medium text-foreground max-w-[160px] truncate">
                  {user.email || "Người dùng"}
                </span>
                <span className="text-[0.7rem] text-muted-foreground">Tài khoản</span>
              </div>
              <ChevronDown className="hidden sm:block size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="text-sm font-medium">Tài khoản</span>
              <span className="text-xs font-normal text-muted-foreground truncate">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                Cài đặt
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 size-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
