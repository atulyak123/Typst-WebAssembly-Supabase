'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Editor from '@/components/Editor'
import { useAuth } from '@/context/auth-context'

export default function EditorPage() {
  const params = useParams()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // Extract the actual projectId from URL (e.g., /editor/abc123 → projectId = "abc123")
  const projectId = params.projectId as string

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null
  }

  // Pass the dynamic projectId to the Editor component
  return <Editor projectId={projectId} user={user} />
}