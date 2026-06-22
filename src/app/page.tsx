import React from 'react'
import Link from 'next/link'
import { Car, Stethoscope, Utensils, Sparkles, AudioLines, ArrowRight, Play, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-50 font-sans flex flex-col justify-between selection:bg-primary selection:text-white relative overflow-hidden">
      
      {/* Background Orbs & Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[100px] opacity-60 pointer-events-none" />

      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 md:px-10 md:pt-6 transition-transform duration-300 translate-y-0">
        <header className="mx-auto max-w-6xl flex items-center justify-between rounded-full bg-white/80 backdrop-blur-md border border-white/50 px-6 py-2 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center text-primary bg-brand-50 p-1.5 rounded-full">
              <AudioLines className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 hidden sm:block">VgrowVoice AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Features</a>
            <a href="#demo" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Live Demo</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-primary transition hidden sm:block">
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition shadow-[0_4px_14px_0_rgba(241,98,50,0.39)] hover:shadow-[0_6px_20px_rgba(241,98,50,0.45)] hover:-translate-y-[1px]"
            >
              Start Free Trial
            </Link>
          </div>
        </header>
      </div>

      {/* Responsive Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-32 md:pt-40 pb-20 flex-1 flex flex-col items-center justify-center z-10 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 w-full">
          
          {/* Hero Content (Left) */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left gap-6 animate-fade-up">
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-brand-50 text-primary text-xs font-bold uppercase tracking-wider border border-brand-100">
              <span className="size-2 rounded-full bg-primary mr-2 animate-pulse" />
              Powered by Google Gemini Live
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-slate-900">
              Your AI Business <br /> <span className="text-primary">Voice Partner.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed">
              Automate customer calls, schedule appointments, and capture leads 24/7 with real-time AI voice agents built for your local business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <Link href="/signup" className="flex items-center justify-center rounded-full h-14 px-8 bg-primary hover:bg-primary-dark transition-all text-white text-base font-bold shadow-[0_4px_14px_0_rgba(241,98,50,0.39)] hover:shadow-[0_6px_20px_rgba(241,98,50,0.45)] hover:-translate-y-[2px] group w-full sm:w-auto">
                <span>Create Your Agent</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/widget-demo" className="flex items-center justify-center rounded-full h-14 px-8 bg-white border border-slate-200 hover:border-primary/30 hover:bg-slate-50 transition-all text-slate-800 text-base font-bold shadow-sm hover:shadow-md group w-full sm:w-auto">
                <span className="flex items-center justify-center size-8 bg-primary/10 rounded-full mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Play className="h-4 w-4 text-primary group-hover:text-white transition-colors" fill="currentColor" />
                </span>
                Hear it in Action
              </Link>
            </div>
          </div>

          {/* Hero Visual (Right) - Floating & Glowing Elements */}
          <div className="w-full lg:w-1/2 relative min-h-[400px] flex items-center justify-center animate-fade-in animate-float-delayed">
            <div className="relative z-20">
              <div className="size-32 rounded-full bg-gradient-to-br from-primary to-accent-hi orb-glow flex items-center justify-center border-[6px] border-white shadow-xl relative">
                <AudioLines className="text-white h-12 w-12" />
                {/* Micro-Interaction Floating Badge */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-4 py-1.5 rounded-full whitespace-nowrap tracking-widest uppercase shadow-xl border border-white/10 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                  Agent Online
                </div>
              </div>
            </div>
            
            {/* Floating Glass Panels */}
            <div className="absolute top-[10%] left-[5%] sm:left-[10%] bg-white/80 backdrop-blur-md border border-white p-3 rounded-2xl shadow-soft flex items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
              <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <p className="text-sm font-bold text-slate-800">Booking Confirmed</p>
              </div>
            </div>

            <div className="absolute bottom-[10%] right-[0%] sm:right-[10%] bg-white/80 backdrop-blur-md border border-white p-3 rounded-2xl shadow-soft flex items-center gap-3 animate-float" style={{ animationDelay: '2s' }}>
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</p>
                <p className="text-sm font-bold text-slate-800">Lead Captured</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Feature Section */}
        <div id="features" className="w-full pt-32 flex flex-col items-center">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Built for Local Businesses</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Our AI agents are pre-trained on industry specific workflows, so you can automate your front desk in minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            {/* Auto Repair (Tall Card) */}
            <div className="col-span-1 md:row-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-soft hover:shadow-card hover:border-brand-200 transition-all duration-300 group flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Car className="h-32 w-32" />
              </div>
              <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Car className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Auto Repair</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Automate booking oil changes, dent removals, and general diagnostics directly into your workshop calendar.
              </p>
              <ul className="space-y-3 mt-auto">
                {['Service Scheduling', 'Price Estimates', 'Status Updates'].map((item) => (
                  <li key={item} className="flex items-center text-sm font-medium text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Healthcare (Wide/Square Card) */}
            <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-soft hover:shadow-card hover:border-brand-200 transition-all duration-300 group flex flex-col sm:flex-row gap-6 relative overflow-hidden">
               <div className="h-14 w-14 shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Healthcare & Clinics</h3>
                <p className="text-slate-600 leading-relaxed max-w-md">
                  Handle patient scheduling, answer general clinic queries, and securely update patient records without keeping anyone on hold.
                </p>
              </div>
            </div>

            {/* Restaurants (Wide/Square Card) */}
            <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-soft hover:shadow-card hover:border-brand-200 transition-all duration-300 group flex flex-col sm:flex-row gap-6 relative overflow-hidden">
               <div className="h-14 w-14 shrink-0 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Restaurants & Cafes</h3>
                <p className="text-slate-600 leading-relaxed max-w-md">
                  Take table reservations, answer dietary questions, and describe menu features in real-time during peak hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <AudioLines className="h-5 w-5 text-primary" />
            <span className="font-extrabold text-slate-900">VgrowVoice AI</span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            © {new Date().getFullYear()} VgrowVoice AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-slate-900 transition">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
