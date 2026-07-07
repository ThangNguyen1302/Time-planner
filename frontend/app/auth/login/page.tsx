"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Clock, Loader2, Calendar, Target, Zap, CheckCircle2, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Đã có lỗi xảy ra")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full">
      {/* Left brand panel */}
      <aside className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 size-80 rounded-full bg-white/5 blur-3xl" />
        </div>

        <Link href="/" className="relative flex items-center gap-2.5 w-fit">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
            <Clock className="size-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-[1.05rem] tracking-tight">TimePlanner</span>
        </Link>

        <div className="relative space-y-8">
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-balance">
            Quản lý thời gian thông minh, tự động hóa lịch trình của bạn
          </h2>
          <div className="space-y-4">
            {[
              { icon: Calendar, text: "Calendar thông minh với kéo thả trực quan" },
              { icon: Target, text: "Quản lý task, deadline và thói quen định kỳ" },
              { icon: Zap, text: "Tự động sắp xếp lại lịch khi có sự kiện đột xuất" },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur">
                  <feature.icon className="size-[1.125rem]" />
                </div>
                <p className="text-sm text-primary-foreground/90">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 backdrop-blur">
          <div className="flex -space-x-2">
            {["A", "B", "C"].map((c) => (
              <div
                key={c}
                className="flex size-8 items-center justify-center rounded-full border-2 border-primary bg-primary-foreground/20 text-xs font-semibold"
              >
                {c}
              </div>
            ))}
          </div>
          <div className="text-sm">
            <p className="font-medium">10,000+ người dùng</p>
            <p className="text-primary-foreground/70 text-xs">tin tưởng TimePlanner mỗi ngày</p>
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex flex-1 flex-col items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="size-4" />
            Về trang chủ
          </Link>

          <div className="mb-8">
            <Link href="/" className="mb-6 hidden items-center gap-2.5 lg:flex">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
                <Clock className="size-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-[1.05rem] tracking-tight">TimePlanner</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Đăng nhập</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Nhập email và mật khẩu để đăng nhập
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            Chưa có tài khoản?{" "}
            <Link href="/auth/sign-up" className="font-medium text-primary hover:underline underline-offset-4">
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
