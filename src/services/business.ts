import { createClient } from '@/lib/supabase/client'
import { Business } from '@/types'

export const businessService = {
  async getProfile(): Promise<Business | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching business profile:', error)
      return null
    }

    return data
  },

  async createProfile(name: string, industry: string, email: string, phone: string): Promise<Business | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('businesses')
      .insert([{ id: user.id, name, industry, email, phone }])
      .select()
      .single()

    if (error) {
      console.error('Error creating business profile:', error)
      throw error
    }

    return data
  },

  async createProfileWithId(userId: string, name: string, industry: string, email: string, phone: string): Promise<Business | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('businesses')
      .insert([{ id: userId, name, industry, email, phone }])
      .select()
      .single()

    if (error) {
      console.error('Error creating business profile:', error)
      throw error
    }

    return data
  },

  async updateProfile(updates: Partial<Omit<Business, 'id' | 'created_at'>>): Promise<Business | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating business profile:', error)
      throw error
    }

    return data
  }
}