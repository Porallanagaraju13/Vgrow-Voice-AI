'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBusinessStore } from '@/store/business'
import { businessService } from '@/services/business'
import { agentsService } from '@/services/agents'
import { faqsService } from '@/services/faqs'
import { servicesService } from '@/services/services'
import { appointmentsService } from '@/services/appointments'
import { conversationsService } from '@/services/conversations'

export default function BusinessProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const {
    setBusiness,
    setAgents,
    setFaqs,
    setServices,
    setAppointments,
    setConversations,
    setIsLoading
  } = useBusinessStore()

  useEffect(() => {
    let channel: any = null
    const supabase = createClient()

    const loadDashboardData = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        router.push('/login')
        return
      }

      try {
        const [profile, agents, faqs, services, appointments, conversations] = await Promise.all([
          businessService.getProfile(),
          agentsService.getAgents(),
          faqsService.getFaqs(),
          servicesService.getServices(),
          appointmentsService.getAppointments(),
          conversationsService.getConversations()
        ])

        if (!profile) {
          setIsLoading(false)
          // Handled inside pages if onboarding is required
          return
        }

        setBusiness(profile)
        setAgents(agents)
        setFaqs(faqs)
        setServices(services)
        setAppointments(appointments)
        setConversations(conversations)

        // Setup real-time postgres listeners
        channel = supabase
          .channel(`schema-db-changes-${Math.random().toString(36).substring(7)}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'appointments' },
            async () => {
              const fresh = await appointmentsService.getAppointments()
              setAppointments(fresh)
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'conversations' },
            async () => {
              const fresh = await conversationsService.getConversations()
              setConversations(fresh)
            }
          )
          .subscribe()

      } catch (err) {
        console.error('Error synchronizing dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [router, setBusiness, setAgents, setFaqs, setServices, setAppointments, setConversations, setIsLoading])

  return <>{children}</>
}
