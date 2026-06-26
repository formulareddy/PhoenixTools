"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User, AuthError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, username?: string) => Promise<{ error: AuthError | null; message?: string; autoSignedIn?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithGitHub: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signInWithGitHub: async () => ({ error: null }),
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const currentPath = window.location.pathname

      const queryParams = new URLSearchParams(window.location.search)
      const errorParam = queryParams.get("error")
      if (errorParam && currentPath !== "/signin" && currentPath !== "/signup") {
        window.location.href = `/signin?${window.location.search}`
        return
      }

      const queryAccessToken = queryParams.get("access_token")
      const queryRefreshToken = queryParams.get("refresh_token")

      if (queryAccessToken && queryRefreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: queryAccessToken,
          refresh_token: queryRefreshToken,
        })
        window.history.replaceState({}, "", "/dashboard")
        if (!error && data.session) {
          setUser(data.session.user)
          setLoading(false)
          if (currentPath !== "/dashboard") {
            window.location.href = "/dashboard"
          }
          return
        }
      }

      const hash = window.location.hash
      if (hash && hash.includes("access_token")) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const hashAccessToken = hashParams.get("access_token")
        const hashRefreshToken = hashParams.get("refresh_token")

        if (hashAccessToken && hashRefreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          })
          window.history.replaceState({}, "", "/dashboard")
          if (!error && data.session) {
            setUser(data.session.user)
            setLoading(false)
            if (currentPath !== "/dashboard") {
              window.location.href = "/dashboard"
            }
            return
          }
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    handleAuthRedirect()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          username: username || email.split("@")[0],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return {
          error: { message: data.error || "Something went wrong" } as AuthError,
        }
      }

      if (data.access_token && data.refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })

        if (!sessionError && sessionData.session) {
          setUser(sessionData.session.user)
          return { error: null, autoSignedIn: true }
        }
      }

      if (data.message) {
        return { error: null, message: data.message }
      }

      return { error: null, autoSignedIn: false }
    } catch {
      return { error: { message: "Something went wrong" } as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return {
          error: { message: data.error || "Incorrect email or password" } as AuthError,
        }
      }

      if (data.access_token && data.refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })

        if (!sessionError && sessionData.session) {
          setUser(sessionData.session.user)
          return { error: null }
        }
      }

      return { error: { message: "Incorrect email or password" } as AuthError }
    } catch {
      return { error: { message: "Incorrect email or password" } as AuthError }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async () => {
    window.location.href = "/api/auth/google"
    return { error: null }
  }

  const signInWithGitHub = async () => {
    window.location.href = "/api/auth/github"
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signInWithGitHub, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
