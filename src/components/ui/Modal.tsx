import * as React from 'react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const Modal = ({ isOpen, onClose, title, children, footer }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Scrim Overlay */}
      <div
        className="fixed inset-0 bg-slate-50/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Container Card */}
      <div className="z-50 w-full max-w-lg rounded-xl border border-slate-200/80 bg-white shadow-xl p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] py-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
