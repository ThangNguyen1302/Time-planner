const DEFAULT_BACKEND_URL = "http://localhost:8080"
const ACCESS_TOKEN_KEY = "timeplanner_access_token"
const REFRESH_TOKEN_KEY = "timeplanner_refresh_token"

type AuthTokens = {
  accessToken?: string
  refreshToken?: string
}

export function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL
}

export function getAccessToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem("timeplanner_token")
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function saveAuthTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") return
  if (tokens.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem("timeplanner_token", tokens.accessToken)
  }
  if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem("timeplanner_token")
}

function buildUrl(path: string) {
  const baseUrl = getBackendUrl().replace(/\/$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

async function parseError(res: Response) {
  const text = await res.text()
  if (!text) return `Backend request failed: ${res.status}`

  try {
    const payload = JSON.parse(text)
    return payload?.error?.message || payload?.message || text
  } catch {
    return text
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  const res = await fetch(buildUrl("/api/v1/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  })

  if (!res.ok) {
    clearAuthTokens()
    return null
  }

  const payload = await res.json()
  const tokens = payload?.data || payload
  saveAuthTokens({
    accessToken: tokens?.accessToken,
    refreshToken: tokens?.refreshToken || refreshToken,
  })
  return tokens?.accessToken as string | undefined
}

export async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

  if (res.status === 401) {
    const nextToken = await refreshAccessToken()
    if (nextToken) {
      return backendRequest<T>(path, init)
    }
  }

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  return (await res.json()) as T
}

export function unwrapData<T>(payload: T | { data: T }) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}
