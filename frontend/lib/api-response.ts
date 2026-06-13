export type PagePayload<T> = {
  content?: T[]
  items?: T[]
  data?: T[] | PagePayload<T>
  meta?: PageMeta
}

export type PageMeta = {
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  total?: number
}

export function extractItems<T>(payload: T[] | PagePayload<T> | null | undefined) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (payload.data && !Array.isArray(payload.data)) return extractItems(payload.data)
  if (Array.isArray(payload.content)) return payload.content
  if (Array.isArray(payload.items)) return payload.items
  return []
}

export function extractMeta(payload: PagePayload<unknown> | null | undefined): PageMeta {
  if (!payload || Array.isArray(payload)) return {}
  return payload.meta || {}
}

export function toDateInputValue(value?: string) {
  if (!value) return ""
  return value.slice(0, 16)
}

export function fromDateInputValue(value: string) {
  return value ? new Date(value).toISOString() : undefined
}
