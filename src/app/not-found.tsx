import React from 'react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-center">
      <h1 className="text-4xl font-extrabold text-white">404 - Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-sm">The dashboard page or resource you are looking for does not exist.</p>
      <Link href="/dashboard" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-750 transition">
        Go to Dashboard
      </Link>
    </div>
  )
}