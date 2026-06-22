import { createClient } from '@/lib/supabase/client'
import { Agent, FAQ, Service, Appointment } from '@/types'

export const widgetsService = {
  async getAgentConfig(agentId: string): Promise<{ agent: Agent; businessName: string; geminiApiKey?: string; faqs: FAQ[]; services: Service[] } | null> {
    const supabase = createClient()
    
    // Fetch Agent and nested business info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*, business:businesses(name, gemini_api_key)')
      .eq('id', agentId)
      .eq('is_active', true)
      .single()

    if (agentError || !agent) {
      console.error('Error fetching widget agent config:', agentError)
      return null
    }

    const businessId = agent.business_id
    const businessName = (agent as any).business?.name || 'Our Partner Business'
    const geminiApiKey = (agent as any).business?.gemini_api_key

    // Fetch FAQs
    const { data: faqs } = await supabase
      .from('faqs')
      .select('*')
      .eq('business_id', businessId)

    // Fetch Services
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)

    return {
      agent,
      businessName,
      geminiApiKey,
      faqs: faqs || [],
      services: services || []
    }
  },

  async getAvailableSlots(businessId: string, dateStr: string): Promise<string[]> {
    const supabase = createClient()
    
    // Query booked appointments for that day
    const startOfDay = new Date(dateStr)
    startOfDay.setHours(0,0,0,0)
    const endOfDay = new Date(dateStr)
    endOfDay.setHours(23,59,59,999)

    const { data: bookings } = await supabase
      .from('appointments')
      .select('start_time')
      .eq('business_id', businessId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .not('status', 'eq', 'cancelled')

    // Mock slots from 9:00 AM to 5:00 PM in 30 minute chunks
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30'
    ]

    if (!bookings || bookings.length === 0) return allSlots

    const bookedHours = bookings.map(b => {
      const date = new Date(b.start_time)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    })

    return allSlots.filter(s => !bookedHours.includes(s))
  },

  async bookAppointmentFromWidget(booking: {
    business_id: string
    customer_name: string
    customer_phone: string
    service_id?: string
    start_time: string
    notes?: string
  }): Promise<{ success: boolean; appointment: Appointment | null; message: string }> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('appointments')
      .insert([booking])
      .select()
      .single()

    if (error) {
      console.error('Widget booking failed:', error)
      return { success: false, appointment: null, message: error.message }
    }

    return { success: true, appointment: data, message: 'Appointment booked successfully!' }
  }
}