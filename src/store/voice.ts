import { create } from 'zustand'
import { Message } from '@/types'

interface VoiceState {
  isConnected: boolean
  isConnecting: boolean
  isSpeaking: boolean
  isListening: boolean
  messages: Message[]
  duration: number
  waveData: number[]

  setIsConnected: (isConnected: boolean) => void
  setIsConnecting: (isConnecting: boolean) => void
  setIsSpeaking: (isSpeaking: boolean) => void
  setIsListening: (isListening: boolean) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setDuration: (duration: number) => void
  setWaveData: (waveData: number[]) => void
  resetCall: () => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isConnected: false,
  isConnecting: false,
  isSpeaking: false,
  isListening: false,
  messages: [],
  duration: 0,
  waveData: new Array(20).fill(0),

  setIsConnected: (isConnected) => set({ isConnected }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setIsListening: (isListening) => set({ isListening }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setDuration: (duration) => set({ duration }),
  setWaveData: (waveData) => set({ waveData }),
  resetCall: () => set({
    isConnected: false,
    isConnecting: false,
    isSpeaking: false,
    isListening: false,
    duration: 0,
    waveData: new Array(20).fill(0)
  })
}))