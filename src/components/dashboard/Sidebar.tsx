'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LoadingWave } from '@/components/ui/LoadingWave'
import {
  LayoutDashboard,
  Bot,
  CalendarDays,
  PhoneCall,
  HelpCircle,
  Wrench,
  Code2,
  Settings,
  Users,
  PhoneOutgoing,
  AudioLines,
  X,
  Megaphone
} from 'lucide-react'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Agents', href: '/dashboard/agents', icon: Bot },
  { label: 'Appointments', href: '/dashboard/appointments', icon: CalendarDays },
  { label: 'Call Logs', href: '/dashboard/conversations', icon: PhoneCall },
  { label: 'Leads', href: '/dashboard/leads', icon: Users },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { label: 'Outbound Calls', href: '/dashboard/outbound', icon: PhoneOutgoing },
  { label: 'FAQs Base', href: '/dashboard/faqs', icon: HelpCircle },
  { label: 'Services', href: '/dashboard/services', icon: Wrench },
  { label: 'Embed Widget', href: '/dashboard/widget', icon: Code2 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: { isMobileOpen?: boolean, setIsMobileOpen?: (val: boolean) => void }) {
  const pathname = usePathname()

  return (
    <aside className={cn(
      "w-64 border-r border-slate-200 bg-white text-slate-600 flex flex-col h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 fixed md:relative transition-transform duration-300",
      isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="flex items-center justify-center bg-brand-50 p-1.5 rounded-full overflow-hidden">
            <LoadingWave className="h-5 gap-0.5" barClassName="w-[3px] rounded-full" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-primary transition-colors">VgrowVoice AI</span>
        </Link>
        {setIsMobileOpen && (
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className={cn(
                'flex items-center space-x-3 rounded-xl px-4 py-3 text-[13px] font-bold transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-[0_4px_14px_0_rgba(241,98,50,0.25)]'
                  : 'hover:bg-brand-50 hover:text-primary text-slate-500'
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-6 border-t border-slate-100 flex flex-col items-center justify-center bg-surface-50">
        <Link href="/widget-demo" className="text-xs text-primary hover:text-primary-dark font-bold hover:underline flex items-center gap-1.5 bg-brand-50 px-4 py-2 rounded-full border border-brand-100 transition-colors">
          <Code2 className="h-3.5 w-3.5" />
          Open Live Demo
        </Link>
      </div>
    </aside>
  )
}
