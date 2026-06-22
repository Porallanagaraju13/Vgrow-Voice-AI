'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBusinessStore } from '@/store/business'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Menu } from 'lucide-react'

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()
  const { business, setBusiness } = useBusinessStore()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setBusiness(null)
    router.push('/login')
  }

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-4 md:px-8 shrink-0">
      <div className="flex items-center space-x-4">
        {onMenuClick && (
          <button 
            onClick={onMenuClick} 
            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-primary rounded-lg hover:bg-brand-50 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {business?.name || 'Loading...'}
          </h2>
          {business && (
            <Badge variant="primary" className="hidden sm:inline-flex capitalize shadow-sm">
              {business.industry.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-6">
        {business?.email && (
          <span className="hidden text-[13px] font-semibold text-slate-500 lg:inline-block bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            {business.email}
          </span>
        )}
        <Button variant="secondary" size="sm" onClick={handleLogout} className="text-xs md:text-sm">
          Logout
        </Button>
      </div>
    </header>
  )
}
