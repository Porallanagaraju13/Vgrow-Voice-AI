import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export const Tabs = ({ value, onValueChange, children, className }: TabsProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { value, onValueChange })
        }
        return child
      })}
    </div>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
  value?: string
  onValueChange?: (value: string) => void
}

export const TabsList = ({ children, className, value, onValueChange }: TabsListProps) => {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { 
            activeValue: value, 
            onClick: () => onValueChange?.(child.props.value) 
          })
        }
        return child
      })}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  activeValue?: string
  onClick?: () => void
}

export const TabsTrigger = ({ value, children, className, activeValue, onClick }: TabsTriggerProps) => {
  const isActive = activeValue === value
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-white text-slate-950 shadow-sm'
          : 'hover:bg-slate-50/50 hover:text-slate-950',
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export const TabsContent = ({ value, children, className, ...props }: TabsContentProps) => {
  const activeValue = (props as any).activeValue || (props as any).value
  if (activeValue !== value) return null
  return <div className={cn('mt-2 focus-visible:outline-none transition-all duration-150', className)}>{children}</div>
}
