import * as React from 'react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export const Toast = ({ message, type = 'success', duration = 3000, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center space-x-3 rounded-lg px-4 py-3 shadow-lg border animate-in slide-in-from-bottom-5 duration-200',
        {
          'bg-green-50 border-green-200 text-green-800': type === 'success',
          'bg-red-50 border-red-200 text-red-800': type === 'error',
          'bg-slate-50 border-slate-200 text-slate-800': type === 'info',
        }
      )}
    >
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-current hover:opacity-75">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
