import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

export const Badge = ({ className, variant = 'primary', ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 border',
        {
          'bg-brand-50 text-primary border-brand-100': variant === 'primary',
          'bg-slate-100 text-slate-700 border-slate-200': variant === 'secondary',
          'bg-green-50 text-green-700 border-green-200': variant === 'success',
          'bg-amber-50 text-amber-700 border-amber-200': variant === 'warning',
          'bg-red-50 text-red-700 border-red-200': variant === 'danger',
        },
        className
      )}
      {...props}
    />
  )
}
