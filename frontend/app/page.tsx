import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle2, Clock, Sparkles, Target, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">TimePlanner</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Đăng nhập</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Bắt đầu miễn phí</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Auto-scheduling thông minh</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-balance max-w-4xl mx-auto leading-tight mb-6">
          Quản lý thời gian thông minh, tự động hóa lịch trình của bạn
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
          TimePlanner giúp bạn tổ chức công việc, thói quen và sự kiện một cách tự động. Chỉ cần thêm việc cần làm, app
          sẽ tự sắp xếp thời gian phù hợp nhất.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2">
              <Zap className="w-5 h-5" />
              Bắt đầu ngay
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              Tìm hiểu thêm
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Tính năng nổi bật</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Mọi thứ bạn cần để quản lý thời gian hiệu quả</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="Calendar thông minh"
            description="Xem lịch tuần/ngày với giao diện kéo thả trực quan. Dễ dàng điều chỉnh thời gian các công việc."
          />
          <FeatureCard
            icon={<Target className="w-6 h-6" />}
            title="Quản lý Task"
            description="Tạo task với deadline, thói quen định kỳ. App tự động nhắc nhở và theo dõi tiến độ."
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Auto Plan"
            description="Một nút bấm, app tự xếp lịch cho tất cả task và event vào slot trống phù hợp."
          />
          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title="Time Blocking"
            description="Chia nhỏ thời gian thành các khối tập trung. Tăng năng suất, giảm xao nhãng."
          />
          <FeatureCard
            icon={<CheckCircle2 className="w-6 h-6" />}
            title="Theo dõi tiến độ"
            description="Xem báo cáo hoàn thành, streak thói quen. Biết được mình đang làm tốt hay cần cải thiện."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Reschedule tự động"
            description="Khi có sự kiện đột xuất, app tự động sắp xếp lại lịch để đảm bảo deadline."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">Sẵn sàng tối ưu thời gian?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Đăng ký miễn phí và bắt đầu sử dụng TimePlanner ngay hôm nay
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
              Tạo tài khoản miễn phí
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 TimePlanner. Được tạo với v0.</p>
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
    <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
