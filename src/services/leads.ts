import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types'

export const leadsService = {
  async getLeads(): Promise<Lead[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching leads:', error)
      return []
    }

    return data || []
  },

  async getLead(id: string): Promise<Lead | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching lead:', error)
      return null
    }

    return data
  },

  async createLead(lead: Omit<Lead, 'id' | 'business_id' | 'created_at'>): Promise<Lead | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('leads')
      .insert([{ ...lead, business_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      throw error
    }

    return data
  },

  async createLeadsBulk(leads: Omit<Lead, 'id' | 'business_id' | 'created_at'>[]): Promise<Lead[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const leadsWithBusiness = leads.map(lead => ({ ...lead, business_id: user.id }))

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsWithBusiness)
      .select()

    if (error) {
      console.error('Error bulk creating leads:', error)
      throw error
    }

    return data || []
  },

  async updateLead(id: string, updates: Partial<Omit<Lead, 'id' | 'business_id' | 'created_at'>>): Promise<Lead | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      throw error
    }

    return data
  },

  async deleteLead(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting lead:', error)
      return false
    }

    return true
  },

  async updateLeadStatus(id: string, status: Lead['status']): Promise<Lead | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .update({ status, last_called_at: status !== 'new' ? new Date().toISOString() : undefined })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead status:', error)
      throw error
    }

    return data
  }
}
