import { createClient } from '@/lib/supabase/client'
import { Appointment } from '@/types'

export const appointmentsService = {
  async getAppointments(): Promise<Appointment[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('appointments')
      .select('*, service:services(*)')
      .eq('business_id', user.id)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching appointments:', error)
      return []
    }

    return data || []
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'business_id' | 'created_at'>): Promise<Appointment | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('appointments')
      .insert([{ ...appointment, business_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      throw error
    }

    return data
  },

  async updateAppointment(id: string, updates: Partial<Omit<Appointment, 'id' | 'business_id' | 'created_at'>>): Promise<Appointment | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      throw error
    }

    return data
  },

  async deleteAppointment(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting appointment:', error)
      return false
    }

    return true
  }
}