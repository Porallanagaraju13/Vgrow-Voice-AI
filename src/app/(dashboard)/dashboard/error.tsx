'use client'
import React, { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error boundary captured:', error)
  }, [error])

  return (
    <div className="h-[50vh] flex flex-col items-center justify-center space-y-4 text-center py-12">
      <h2 className="text-xl font-bold text-slate-800">Something went wrong inside the dashboard!</h2>
      <p className="text-sm text-slate-500 max-w-sm">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  )
}
