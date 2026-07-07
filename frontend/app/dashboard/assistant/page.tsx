import { ArrowRight, Bot, CalendarClock, Sparkles, Wand2, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const plannedFeatures = [
  {
    icon: Wand2,
    title: "Tự động sắp xếp",
    description: "AI sắp xếp công việc và sự kiện vào khung giờ tối ưu dựa trên lịch trình của bạn.",
    accent: "from-violet-500/20 to-violet-500/0",
    iconColor: "text-violet-500",
  },
  {
    icon: Bot,
    title: "Trò chuyện thông minh",
    description: "Đặt câu hỏi, tạo task, điều chỉnh kế hoạch qua hội thoại tự nhiên.",
    accent: "from-sky-500/20 to-sky-500/0",
    iconColor: "text-sky-500",
  },
  {
    icon: Zap,
    title: "Đề xuất ưu tiên",
    description: "Nhận gợi ý việc cần làm tiếp theo dựa trên mức độ ưu tiên và hạn chót.",
    accent: "from-amber-500/20 to-amber-500/0",
    iconColor: "text-amber-500",
  },
  {
    icon: CalendarClock,
    title: "Cân bằng thời gian",
    description: "Phân bổ hợp lý giữa công việc, nghỉ ngơi và thói quen cá nhân.",
    accent: "from-emerald-500/20 to-emerald-500/0",
    iconColor: "text-emerald-500",
  },
]

const roadmap = [
  { label: "Khảo sát & thiết kế", state: "done" as const },
  { label: "Tích hợp backend AI", state: "active" as const },
  { label: "Ra mắt thử nghiệm", state: "todo" as const },
]

export default async function AssistantPage() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center space-y-12 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-0 size-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 size-[360px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="flex flex-col items-center space-y-6 text-center animate-slide-up">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          Sắp ra mắt
        </Badge>

        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-[1.75rem] bg-primary/20 blur-2xl" />
          <div className="relative flex size-20 items-center justify-center rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 shadow-lg backdrop-blur">
            <Sparkles className="size-9 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Trợ lý AI đang trên đường
          </h1>
          <p className="mx-auto max-w-lg text-balance text-sm text-muted-foreground sm:text-base">
            Tính năng trợ lý thông minh sẽ được tích hợp với backend Java và mở lại sau khi hoàn thành API.
            Trong khi đó, hãy tiếp tục quản lý công việc qua Tasks và Events.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <a href="/dashboard/tasks">
              Quản lý tasks
              <ArrowRight className="ml-1.5 size-4" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/dashboard/events">Xem sự kiện</a>
          </Button>
        </div>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="space-y-3">
          {roadmap.map((step) => {
            const isDone = step.state === "done"
            const isActive = step.state === "active"
            return (
              <div key={step.label} className="flex items-center gap-3">
                <div
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    isDone
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-muted bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {isDone ? "✓" : isActive ? <span className="size-1.5 animate-pulse rounded-full bg-primary" /> : ""}
                </div>
                <span
                  className={`text-sm ${
                    isActive ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span className="ml-auto text-xs text-muted-foreground">Đang phát triển</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 animate-fade-in">
        {plannedFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Card
              key={feature.title}
              className="group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />
              <CardContent className="relative flex items-start gap-3 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 transition-transform duration-300 group-hover:scale-110">
                  <Icon className={`size-5 ${feature.iconColor}`} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
