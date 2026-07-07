import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle2, Clock, Sparkles, Target, Zap, ArrowRight, Star } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
              <Clock className="size-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-[1.05rem] tracking-tight">TimePlanner</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm" className="gap-1.5">
                Bắt đầu miễn phí
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute right-1/4 top-40 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 pt-24 pb-20 text-center">
          <div className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-sm text-foreground/80 backdrop-blur mb-8 shadow-sm">
            <Sparkles className="size-4 text-primary" />
            <span>Auto-scheduling thông minh</span>
            <span className="mx-1 h-1 w-1 rounded-full bg-border" />
            <Star className="size-3.5 fill-primary text-primary" />
            <span className="text-muted-foreground">Mới</span>
          </div>

          <h1 className="animate-slide-up text-4xl md:text-6xl lg:text-7xl font-bold text-balance max-w-4xl mx-auto leading-[1.05] mb-6 tracking-tight">
            Quản lý thời gian{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              thông minh
            </span>
            , tự động hóa lịch trình
          </h1>

          <p className="animate-slide-up text-lg text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty leading-relaxed">
            TimePlanner giúp bạn tổ chức công việc, thói quen và sự kiện một cách tự động. Chỉ cần thêm việc cần làm, app
            sẽ tự sắp xếp thời gian phù hợp nhất.
          </p>

          <div className="animate-slide-up flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/auth/sign-up">
              <Button size="lg" className="gap-2 h-12 px-7 text-base shadow-lg shadow-primary/25">
                <Zap className="size-5" />
                Bắt đầu ngay
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-7 text-base">
                Tìm hiểu thêm
              </Button>
            </Link>
          </div>

          {/* Hero preview card */}
          <div className="animate-scale-in relative mx-auto max-w-4xl">
            <div className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-r from-primary/20 to-primary/5 blur-2xl" />
            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/5 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-muted-foreground/20" />
                  <div className="size-3 rounded-full bg-muted-foreground/20" />
                  <div className="size-3 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="mx-auto flex items-center gap-2 rounded-md bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  timeplanner.app/dashboard
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 p-5">
                {Array.from({ length: 28 }).map((_, i) => {
                  const hasEvent = [3, 7, 10, 14, 18, 21, 24].includes(i)
                  const isToday = i === 14
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-md flex items-center justify-center text-xs transition-colors ${
                        isToday
                          ? "bg-primary text-primary-foreground font-semibold"
                          : hasEvent
                            ? "bg-primary/10 text-foreground"
                            : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10K+", label: "Người dùng" },
              { value: "500K+", label: "Task hoàn thành" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9/5", label: "Đánh giá" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Tính năng</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Tính năng nổi bật</h2>
          <p className="text-muted-foreground text-lg">Mọi thứ bạn cần để quản lý thời gian hiệu quả</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Calendar className="size-6" />}
            title="Calendar thông minh"
            description="Xem lịch tuần/ngày với giao diện kéo thả trực quan. Dễ dàng điều chỉnh thời gian các công việc."
          />
          <FeatureCard
            icon={<Target className="size-6" />}
            title="Quản lý Task"
            description="Tạo task với deadline, thói quen định kỳ. App tự động nhắc nhở và theo dõi tiến độ."
          />
          <FeatureCard
            icon={<Sparkles className="size-6" />}
            title="Google Calendar"
            description="Kết nối Google Calendar để xem và đồng bộ sự kiện vào lịch TimePlanner."
          />
          <FeatureCard
            icon={<Clock className="size-6" />}
            title="Time Blocking"
            description="Chia nhỏ thời gian thành các khối tập trung. Tăng năng suất, giảm xao nhãng."
          />
          <FeatureCard
            icon={<CheckCircle2 className="size-6" />}
            title="Theo dõi tiến độ"
            description="Xem báo cáo hoàn thành, streak thói quen. Biết được mình đang làm tốt hay cần cải thiện."
          />
          <FeatureCard
            icon={<Zap className="size-6" />}
            title="Reschedule tự động"
            description="Khi có sự kiện đột xuất, app tự động sắp xếp lại lịch để đảm bảo deadline."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary to-primary/80 p-10 md:p-16 text-center shadow-2xl shadow-primary/20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
              Sẵn sàng tối ưu thời gian?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
              Đăng ký miễn phí và bắt đầu sử dụng TimePlanner ngay hôm nay
            </p>
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                variant="secondary"
                className="bg-background text-foreground hover:bg-background/90 h-12 px-8 text-base gap-2"
              >
                Tạo tài khoản miễn phí
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
              <Clock className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">TimePlanner</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 TimePlanner</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group relative p-6 rounded-2xl border border-border/60 bg-card hover:border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2 tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}
