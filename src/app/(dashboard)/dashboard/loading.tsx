import React from 'react'
import { LoadingWave } from '@/components/ui/LoadingWave'

export default function Loading() {
  return (
    <div className="h-[50vh] w-full flex flex-col items-center justify-center space-y-4">
      <LoadingWave className="scale-125 mb-2" />
      <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading dashboard page...</p>
    </div>
  )
}
