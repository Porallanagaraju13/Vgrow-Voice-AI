'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { useVoiceStore } from '@/store/voice'

export default function Waveform() {
  const { isConnected, waveData } = useVoiceStore()

  return (
    <div className="flex items-center justify-center space-x-1.5 h-12 w-full max-w-xs mx-auto">
      {waveData.map((val, idx) => {
        // Ensure values remain inside comfortable UI heights
        const height = isConnected ? Math.max(4, Math.min(48, val * 1.5)) : 4
        
        return (
          <motion.div
            key={idx}
            animate={{ height }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`w-1 rounded-full ${
              isConnected ? 'bg-orange-500' : 'bg-slate-300'
            }`}
          />
        )
      })}
    </div>
  )
}
