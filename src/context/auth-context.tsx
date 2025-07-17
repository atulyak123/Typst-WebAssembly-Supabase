"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getBrowserClient } from "@/lib/supabaseClient"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize Supabase client only when needed
  const getSupabase = () => {
    try {
      return getBrowserClient()
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
      return null
    }
  }

  useEffect(() => {
    const getSession = async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) {
          setIsLoading(false)
          return
        }

        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } catch (error) {
        console.error("Error getting session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    try {
      const supabase = getSupabase()
      if (!supabase) return

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up auth state change listener:", error)
      setIsLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { error: new Error("Supabase client initialization failed") }
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) {
        router.push("/dashboard")
      }
      return { error }
    } catch (error) {
      console.error("Sign in error:", error)
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { error: new Error("Supabase client initialization failed") }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          },
        },
      })

      if (!error && data.user) {
        try {
          await supabase.from("user_profiles").insert({
            id: data.user.id,
            display_name: name,
          })
        } catch (profileError) {
          console.error("Error creating user profile:", profileError)
        }
        router.push("/dashboard")
      }

      return { error }
    } catch (error) {
      console.error("Sign up error:", error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      const supabase = getSupabase()
      if (supabase) {
        await supabase.auth.signOut()
      }
      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}