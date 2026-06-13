"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { backendRequest, clearAuthTokens, getAccessToken, saveAuthTokens, unwrapData } from "@/lib/client"

type AuthUser = {
  id: string
  email: string
}

type AuthResponse = {
  accessToken: string
  refreshToken?: string
  user: AuthUser
}

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  isReady: boolean
  login: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  reloadUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()

  const reloadUser = useCallback(async () => {
    const payload = await backendRequest<AuthUser | { data: AuthUser }>("/api/v1/me")
    setUser(unwrapData(payload))
  }, [])

  useEffect(() => {
    let canceled = false

    async function bootstrap() {
      if (!accessToken) {
        if (!canceled) setIsReady(true)
        return
      }

      try {
        await reloadUser()
      } catch {
        clearAuthTokens()
        if (!canceled) {
          setAccessToken(null)
          setUser(null)
        }
      } finally {
        if (!canceled) setIsReady(true)
      }
    }

    void bootstrap()
    return () => {
      canceled = true
    }
  }, [accessToken, reloadUser])

  const login = async (email: string, password: string) => {
    const payload = await backendRequest<AuthResponse | { data: AuthResponse }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    const data = unwrapData(payload)
    saveAuthTokens(data)
    setAccessToken(data.accessToken)
    setUser(data.user)
  }

  const signUp = async (email: string, password: string) => {
    await backendRequest<unknown>("/api/v1/auth/sign-up", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  const logout = async () => {
    try {
      await backendRequest<unknown>("/api/v1/auth/logout", { method: "POST" })
    } catch {
      // Local logout still succeeds if the backend token is already invalid.
    }
    clearAuthTokens()
    setAccessToken(null)
    setUser(null)
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ accessToken, user, isReady, login, signUp, logout, reloadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
