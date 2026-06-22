'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice'
import { useVoiceStore } from '@/store/voice'
import VoiceOrb from './VoiceOrb'
import Waveform from './Waveform'
import TranscriptPanel from './TranscriptPanel'
import { Button } from '../ui/Button'

interface VoiceWidgetProps {
  agentId: string
  geminiApiKey?: string
}

export default function VoiceWidget({ agentId, geminiApiKey }: VoiceWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { isConnected, isConnecting, connect, disconnect } = useRealtimeVoice(agentId, geminiApiKey)
  const { messages } = useVoiceStore()

  const handleToggleCall = () => {
    if (isConnected || isConnecting) {
      disconnect()
    } else {
      connect()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-96 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl flex flex-col space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-800">AI Voice Assistant</h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto min-h-0 min-w-0 text-slate-500 hover:text-slate-600"
                onClick={() => {
                  disconnect()
                  setIsOpen(false)
                }}
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Voice controls & visualizers */}
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div onClick={handleToggleCall}>
                <VoiceOrb />
              </div>
              {isConnected && <Waveform />}
            </div>

            {/* Transcript Panel inside the widget */}
            {(isConnected || messages.length > 0) && (
              <div className="h-56">
                <TranscriptPanel />
              </div>
            )}

            <div className="flex items-center justify-center">
              <Button
                variant={isConnected || isConnecting ? 'danger' : 'primary'}
                className="w-full"
                onClick={handleToggleCall}
              >
                {isConnected || isConnecting ? 'End Voice Session' : 'Start Audio Call'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xl shadow-orange-600/20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 border border-orange-400/40"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </motion.button>
    </div>
  )
}
