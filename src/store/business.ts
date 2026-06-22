import { create } from 'zustand'
import { Business, Agent, FAQ, Service, Appointment, Conversation } from '@/types'

interface BusinessState {
  business: Business | null
  agents: Agent[]
  faqs: FAQ[]
  services: Service[]
  appointments: Appointment[]
  conversations: Conversation[]
  isLoading: boolean
  
  setBusiness: (business: Business | null) => void
  setAgents: (agents: Agent[]) => void
  setFaqs: (faqs: FAQ[]) => void
  setServices: (services: Service[]) => void
  setAppointments: (appointments: Appointment[]) => void
  setConversations: (conversations: Conversation[]) => void
  setIsLoading: (isLoading: boolean) => void
  
  addAgent: (agent: Agent) => void
  updateAgent: (agent: Agent) => void
  deleteAgent: (id: string) => void

  addFaq: (faq: FAQ) => void
  updateFaq: (faq: FAQ) => void
  deleteFaq: (id: string) => void

  addService: (service: Service) => void
  updateService: (service: Service) => void
  deleteService: (id: string) => void

  addAppointment: (appointment: Appointment) => void
  updateAppointment: (appointment: Appointment) => void
  deleteAppointment: (id: string) => void

  addConversation: (conversation: Conversation) => void
  updateConversation: (conversation: Conversation) => void
}

export const useBusinessStore = create<BusinessState>((set) => ({
  business: null,
  agents: [],
  faqs: [],
  services: [],
  appointments: [],
  conversations: [],
  isLoading: false,

  setBusiness: (business) => set({ business }),
  setAgents: (agents) => set({ agents }),
  setFaqs: (faqs) => set({ faqs }),
  setServices: (services) => set({ services }),
  setAppointments: (appointments) => set({ appointments }),
  setConversations: (conversations) => set({ conversations }),
  setIsLoading: (isLoading) => set({ isLoading }),

  addAgent: (agent) => set((state) => ({ agents: [agent, ...state.agents] })),
  updateAgent: (updated) => set((state) => ({
    agents: state.agents.map((a) => (a.id === updated.id ? updated : a))
  })),
  deleteAgent: (id) => set((state) => ({
    agents: state.agents.filter((a) => a.id !== id)
  })),

  addFaq: (faq) => set((state) => ({ faqs: [...state.faqs, faq] })),
  updateFaq: (updated) => set((state) => ({
    faqs: state.faqs.map((f) => (f.id === updated.id ? updated : f))
  })),
  deleteFaq: (id) => set((state) => ({
    faqs: state.faqs.filter((f) => f.id !== id)
  })),

  addService: (service) => set((state) => ({ services: [...state.services, service] })),
  updateService: (updated) => set((state) => ({
    services: state.services.map((s) => (s.id === updated.id ? updated : s))
  })),
  deleteService: (id) => set((state) => ({
    services: state.services.filter((s) => s.id !== id)
  })),

  addAppointment: (appointment) => set((state) => ({ appointments: [appointment, ...state.appointments] })),
  updateAppointment: (updated) => set((state) => ({
    appointments: state.appointments.map((a) => (a.id === updated.id ? updated : a))
  })),
  deleteAppointment: (id) => set((state) => ({
    appointments: state.appointments.filter((a) => a.id !== id)
  })),

  addConversation: (conversation) => set((state) => ({ conversations: [conversation, ...state.conversations] })),
  updateConversation: (updated) => set((state) => ({
    conversations: state.conversations.map((c) => (c.id === updated.id ? updated : c))
  })),
}))