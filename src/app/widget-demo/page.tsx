'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bot, Sparkles, PhoneCall, Zap, PlayCircle, BarChart3, LayoutDashboard, Globe2 } from 'lucide-react'

export default function WidgetDemoPage() {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFirstAgent = async () => {
      const supabase = createClient()
      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      if (agents && agents.length > 0) {
        setAgentId(agents[0].id)
      }
      setLoading(false)
    }
    fetchFirstAgent()
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      {/* Top Bar Banner */}
      <div className="bg-slate-900 text-white text-center py-2.5 px-4 text-xs font-semibold flex items-center justify-center space-x-3 shadow-md fixed top-0 w-full z-50">
        <Sparkles className="h-4 w-4 text-orange-400" />
        <span>Live Demo Environment: Test the floating AI receptionist widget in the bottom right corner.</span>
        <Link href="/dashboard" className="underline hover:text-orange-300 transition-colors ml-4 text-orange-400">
          Return to Dashboard →
        </Link>
      </div>

      {/* Hero Section (Glassmorphism & Claymorphism cues) */}
      <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center text-center">
        {/* Abstract Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-70 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-rose-400/20 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-50" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-md border border-slate-200/50 px-4 py-2 rounded-full shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wide uppercase text-slate-600">VgrowVoice AI is Active</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Next-Gen Voice AI for <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Modern Businesses</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Deploy an intelligent receptionist that handles inbound calls, books appointments, and captures leads 24/7. Try the widget on this page right now.
          </p>

          <div className="flex items-center justify-center space-x-4 pt-4">
            <button className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-slate-900/20 hover:scale-105 transition-transform flex items-center space-x-2">
              <PhoneCall className="h-5 w-5" />
              <span>Click the Widget to Call</span>
            </button>
            <button className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-full font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center space-x-2">
              <PlayCircle className="h-5 w-5 text-slate-400" />
              <span>Watch Video</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Video Placeholder Section */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="w-full aspect-video bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden relative group border border-slate-800"
        >
          {/* Generated Video Thumbnail */}
          <img 
            src="/saas-demo-video.png" 
            alt="SaaS Platform Demo" 
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          />
          
          {/* Mock Video Play Button UI Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="h-24 w-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center cursor-pointer border border-white/30 transition-all hover:bg-white/30 shadow-2xl shadow-orange-500/20"
            >
              <PlayCircle className="h-12 w-12 text-white ml-2 drop-shadow-md" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How it works Section (Static Bento-style slides without scroll animations) */}
      <section className="bg-slate-900 text-white mt-20 py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">How it works</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Get up and running with VgrowVoice AI in three simple steps.</p>
          </div>

          <div className="space-y-12">
            
            {/* Slide 1: Setup */}
            <div 
              className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 bg-slate-800/90 backdrop-blur-3xl rounded-3xl border border-slate-700/80 shadow-2xl"
            >
              <div className="flex-1 space-y-6">
                <div className="h-14 w-14 bg-orange-500/20 rounded-2xl flex items-center justify-center border border-orange-500/30">
                  <Bot className="h-7 w-7 text-orange-400" />
                </div>
                <h3 className="text-3xl font-bold">1. Configure your AI Agent</h3>
                <p className="text-slate-400 leading-relaxed text-lg">Define your business services, pricing, and FAQ. The AI automatically trains on this data to answer accurately without hallucinations.</p>
              </div>
              <div className="flex-1 w-full bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-inner h-64 flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="h-8 w-3/4 bg-slate-800 rounded-lg animate-pulse" />
                  <div className="h-8 w-1/2 bg-slate-800 rounded-lg animate-pulse delay-75" />
                  <div className="h-8 w-full bg-slate-800 rounded-lg animate-pulse delay-150" />
                  <div className="h-8 w-2/3 bg-slate-800 rounded-lg animate-pulse delay-200" />
                </div>
              </div>
            </div>

            {/* Slide 2: Widget */}
            <div 
              className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 bg-slate-800/95 backdrop-blur-3xl rounded-3xl border border-slate-700/80 shadow-2xl"
            >
              <div className="flex-1 space-y-6">
                <div className="h-14 w-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                  <Globe2 className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold">2. Embed the Voice Widget</h3>
                <p className="text-slate-300 leading-relaxed text-lg">Paste one line of code onto your website. Instantly, visitors can tap the orb in the corner to talk to your business natively.</p>
              </div>
              <div className="flex-1 w-full relative h-64 bg-white rounded-2xl border border-slate-700 p-6 flex items-end justify-end overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-multiply" />
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50 mb-4 mr-4"
                >
                  <PhoneCall className="h-8 w-8 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Slide 3: Analytics */}
            <div 
              className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 bg-slate-800/90 backdrop-blur-3xl rounded-3xl border border-slate-700/80 shadow-2xl"
            >
              <div className="flex-1 space-y-6">
                <div className="h-14 w-14 bg-green-500/20 rounded-2xl flex items-center justify-center border border-green-500/30">
                  <BarChart3 className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="text-3xl font-bold text-white">3. Review Transcripts & Analytics</h3>
                <p className="text-slate-200 leading-relaxed text-lg">Every call is transcribed and summarized. Monitor appointment bookings, view call volumes, and analyze lead sentiments in your dashboard.</p>
              </div>
              <div className="flex-1 w-full bg-slate-900 rounded-2xl border border-slate-600 p-6 grid grid-cols-2 gap-4 h-64">
                <div className="bg-slate-800 rounded-xl p-4 flex flex-col justify-end">
                  <div className="text-3xl font-bold text-white">84%</div>
                  <div className="text-xs text-slate-400">Conversion</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 flex flex-col justify-end">
                  <div className="text-3xl font-bold text-white">128</div>
                  <div className="text-xs text-slate-400">Calls Today</div>
                </div>
                <div className="col-span-2 bg-slate-800 rounded-xl p-4 flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-slate-400" />
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-3/4" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-32 bg-white text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-6">Ready to automate your receptionist?</h2>
        <Link href="/dashboard">
          <button className="bg-orange-500 text-white px-10 py-5 rounded-full font-bold text-lg shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-colors">
            Go to Dashboard
          </button>
        </Link>
      </section>

      {/* Widget Loader Injection */}
      {!loading && agentId && (
        <script
          src="/api/widget-script"
          data-agent-id={agentId}
          defer
        />
      )}

      {/* Fallback if no agent is found in DB */}
      {!loading && !agentId && (
        <div className="fixed bottom-6 right-6 bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800 shadow-xl z-50">
          <strong className="block mb-2 text-base">No active agents found.</strong>
          Please log in to the <Link href="/dashboard" className="underline font-bold hover:text-amber-900">Dashboard</Link>, create an agent, and ensure it is set to active to test the widget.
        </div>
      )}
    </div>
  )
}
