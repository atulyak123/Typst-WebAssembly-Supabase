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
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialSessionCheck, setHasInitialSessionCheck] = useState(false)
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
        setHasInitialSessionCheck(true)
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
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.id) // Debug log
        
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
        
        if (hasInitialSessionCheck) {
          if (event === 'SIGNED_IN' && session?.user && !user) {
            console.log('➡️ Redirecting to dashboard (new sign in)')
            router.push("/dashboard")
          }
          
          // Only redirect to login on actual sign out
          if (event === 'SIGNED_OUT') {
            console.log('➡️ Redirecting to login (signed out)')
            router.push("/login")
          }
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up auth state change listener:", error)
      setIsLoading(false)
    }
  }, [router, hasInitialSessionCheck, user])

  const signInWithMagicLink = async (email: string) => {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return { error: new Error("Supabase client initialization failed") }
      }

      // Validate email domain
      if (!email.endsWith('@infocusp.com')) {
        return { error: new Error("Access restricted to Infocusp employees only") }
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      return { error }
    } catch (error) {
      console.error("Magic link sign in error:", error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      const supabase = getSupabase()
      if (supabase) {
        await supabase.auth.signOut()
      }
      // No need to manually redirect here - the auth state change listener will handle it
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signInWithMagicLink, signOut }}>
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