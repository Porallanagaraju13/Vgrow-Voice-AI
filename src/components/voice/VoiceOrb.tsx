'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { useVoiceStore } from '@/store/voice'
import { cn } from '@/lib/utils'
import { Mic } from 'lucide-react'

export default function VoiceOrb() {
  const { isConnected, isConnecting, isSpeaking, isListening, waveData } = useVoiceStore()
  
  // Calculate average wave amplitude for pulse scaling
  const averageAmp = waveData.length > 0 ? waveData.reduce((a, b) => a + b, 0) / waveData.length : 0
  const scale = isConnected ? 1 + (averageAmp / 120) : 1

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative flex items-center justify-center">
        {/* Glowing concentric background pulses */}
        {isConnected && (
          <>
            <motion.div
              animate={{ scale: scale * 1.4, opacity: isSpeaking ? 0.3 : 0.15 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="absolute h-36 w-36 rounded-full bg-orange-500/30 blur-xl"
            />
            <motion.div
              animate={{ scale: scale * 1.8, opacity: isSpeaking ? 0.15 : 0.08 }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="absolute h-36 w-36 rounded-full bg-orange-400/20 blur-2xl"
            />
          </>
        )}

        {/* Central Orb */}
        <motion.div
          animate={
            isConnecting
              ? { rotate: 360, scale: [1, 1.05, 1] }
              : isSpeaking
              ? { scale: scale }
              : { scale: 1 }
          }
          transition={
            isConnecting
              ? { repeat: Infinity, duration: 2, ease: 'linear' }
              : { type: 'spring', stiffness: 300, damping: 15 }
          }
          className={cn(
            'relative h-32 w-32 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 border-2',
            {
              'bg-gradient-to-tr from-orange-600 to-indigo-600 border-orange-400/40 text-white': isConnected,
              'bg-gradient-to-tr from-slate-200 to-slate-300 border-slate-300/35 text-slate-500': !isConnected && !isConnecting,
              'bg-gradient-to-tr from-orange-500/50 to-indigo-500/50 border-orange-300/40 text-white': isConnecting
            }
          )}
        >
          {isConnecting ? (
            <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : isConnected ? (
            <div className="flex flex-col items-center">
              <Mic className="h-8 w-8 text-white animate-pulse" />
              <span className="text-2xs font-extrabold tracking-wider uppercase mt-1">
                {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Active'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Mic className="h-8 w-8 text-white opacity-60" />
              <span className="text-2xs font-extrabold tracking-wider uppercase mt-1 opacity-60">
                Call Agent
              </span>
            </div>
          )}
        </motion.div>
      </div>

      <div className="text-center">
        <p className="text-xs font-semibold text-slate-500">
          {isConnecting
            ? 'Initializing audio streams...'
            : isConnected
            ? 'Connected - Start speaking now'
            : 'Click to start real-time voice call'}
        </p>
      </div>
    </div>
  )
}
