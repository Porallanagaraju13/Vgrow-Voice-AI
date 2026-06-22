import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer select-none space-x-2">
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            className="sr-only peer"
            {...props}
          />
          <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 transition-colors duration-200" />
        </div>
        {label && (
          <span className="text-sm font-medium text-slate-700">
            {label}
          </span>
        )}
      </label>
    )
  }
)
Toggle.displayName = 'Toggle'
