'use client'
import React, { useEffect, useRef } from 'react'
import { useVoiceStore } from '@/store/voice'
import { cn } from '@/lib/utils'

export default function TranscriptPanel() {
  const { messages } = useVoiceStore()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200/80 p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200/50 pb-2">
        Live Conversation Transcript
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-[300px] text-sm">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 italic py-12">
            No dialogue recorded yet...
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn('flex flex-col max-w-[85%] rounded-lg px-3 py-2', {
                'self-end bg-orange-600 text-white ml-auto': msg.role === 'user',
                'self-start bg-white border border-slate-200 text-slate-800 mr-auto': msg.role === 'model',
              })}
            >
              <span className="text-3xs font-extrabold uppercase opacity-60 mb-0.5">
                {msg.role === 'user' ? 'You' : 'Agent'}
              </span>
              <p className="leading-relaxed break-words">{msg.text}</p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
