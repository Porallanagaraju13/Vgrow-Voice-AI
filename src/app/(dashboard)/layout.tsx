'use client'
import React, { useState } from 'react'
import BusinessProvider from '@/providers/BusinessProvider'
import Sidebar from '@/components/dashboard/Sidebar'
import Navbar from '@/components/dashboard/Navbar'
import { useBusinessStore } from '@/store/business'
import { cn } from '@/lib/utils'
import { LoadingWave } from '@/components/ui/LoadingWave'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useBusinessStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <BusinessProvider>
      <div className="flex h-screen bg-surface-50 font-sans overflow-hidden">
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 h-screen overflow-hidden w-full relative z-0">
          {/* Header */}
          <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />

          {/* View Scrollport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-surface-50">
            {isLoading ? (
              <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
                <LoadingWave className="scale-125 mb-2" />
                <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-wider">Syncing Data...</p>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </BusinessProvider>
  )
}
