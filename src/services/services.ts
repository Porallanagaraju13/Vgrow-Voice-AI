import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types'

export const servicesService = {
  async getServices(): Promise<Service[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching services:', error)
      return []
    }

    return data || []
  },

  async createService(service: Omit<Service, 'id' | 'business_id' | 'created_at'>): Promise<Service | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('services')
      .insert([{ ...service, business_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      throw error
    }

    return data
  },

  async updateService(id: string, updates: Partial<Omit<Service, 'id' | 'business_id' | 'created_at'>>): Promise<Service | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      throw error
    }

    return data
  },

  async deleteService(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting service:', error)
      return false
    }

    return true
  }
}