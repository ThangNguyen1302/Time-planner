export interface UserPreference {
  id: string
  user_id: string
  wake_time: string
  sleep_time: string
  work_start: string
  work_end: string
  timezone: string
  rest_days: number[]
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_rule?: string
  color: string
  external_id?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  duration: number
  deadline?: string
  priority: number
  status: "pending" | "in_progress" | "completed" | "skipped" | "overdue"
  color: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Habit {
  id: string
  user_id: string
  title: string
  description?: string
  duration: number
  frequency: number
  preferred_time_start?: string
  preferred_time_end?: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimeBlock {
  id: string
  user_id: string
  title: string
  start_time: string
  end_time: string
  block_type: "event" | "task" | "habit"
  source_id?: string
  status: "scheduled" | "completed" | "skipped" | "rescheduled"
  color: string
  is_manual_override: boolean
  created_at: string
  updated_at: string
}

export interface HabitCompletion {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: "event" | "task" | "habit"
  color: string
  sourceId?: string
  status?: string
}

export interface Persona {
  id: string
  user_id: string
  name: string
  tone: "friendly" | "professional" | "casual" | "strict"
  addressing: "ban" | "cau" | "minh"
  emoji_level: number
  verbosity: "short" | "normal" | "detailed"
  strictness: number
  style_rules: Record<string, unknown>
  is_preset: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Avatar {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  mood: "neutral" | "happy" | "serious" | "encouraging" | "warning"
  is_preset: boolean
  is_active: boolean
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  user_id: string
  role: "user" | "assistant" | "system"
  content: string
  mood?: string
  actions: AssistantAction[]
  quick_replies: string[]
  is_proactive: boolean
  created_at: string
}

export interface AssistantAction {
  type: string
  data: Record<string, unknown>
  result?: Record<string, unknown>
}

export interface AssistantActionLog {
  id: string
  user_id: string
  message_id?: string
  action_type: string
  action_data: Record<string, unknown>
  result?: Record<string, unknown>
  can_undo: boolean
  undone_at?: string
  created_at: string
}

export interface UserMemory {
  id: string
  user_id: string
  memory_type: "preference" | "dislike" | "motivator" | "pattern"
  key: string
  value: Record<string, unknown>
  confidence: number
  source: "explicit" | "inferred"
  created_at: string
  updated_at: string
}

export interface ReminderRule {
  id: string
  user_id: string
  rule_type: "before_event" | "overdue" | "goal_deviation" | "idle_time"
  trigger_minutes: number
  max_reminders: number
  nudge_style: "gentle" | "coach" | "strict"
  is_enabled: boolean
  created_at: string
  updated_at: string
}

// Tool definitions for AI assistant
export interface AssistantTool {
  name: string
  description: string
  parameters: Record<string, unknown>
}
