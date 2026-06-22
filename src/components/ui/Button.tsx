import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]',
          {
            'bg-gradient-to-br from-primary to-primary-dark hover:from-primary-dark hover:to-orange-700 text-white shadow-[0_4px_14px_0_rgba(241,98,50,0.39)] hover:shadow-[0_6px_20px_rgba(241,98,50,0.45)] hover:-translate-y-[1px]': variant === 'primary',
            'bg-white border border-slate-200 hover:bg-slate-50 hover:border-primary/30 hover:text-primary text-slate-800 shadow-sm hover:-translate-y-[1px]': variant === 'secondary',
            'border-2 border-slate-200 hover:border-primary text-slate-700 hover:bg-slate-50': variant === 'outline',
            'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md shadow-red-500/20 hover:-translate-y-[1px]': variant === 'danger',
            'hover:bg-slate-100 text-slate-600': variant === 'ghost',
            'px-4 py-2 text-xs': size === 'sm',
            'px-6 py-3 text-sm': size === 'md',
            'px-8 py-4 text-base': size === 'lg',
            'p-3': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
