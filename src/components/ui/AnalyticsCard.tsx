import * as React from 'react'
import { Card, CardContent } from './Card'

interface AnalyticsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}

export const AnalyticsCard = ({ title, value, description, icon, trend }: AnalyticsCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          {icon && <div className="text-orange-500">{icon}</div>}
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
          {trend && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                trend.isPositive
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}% {trend.label}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
