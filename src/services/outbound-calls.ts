import { createClient } from '@/lib/supabase/client'
import { OutboundCall } from '@/types'

export const outboundCallsService = {
  async getOutboundCalls(): Promise<OutboundCall[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('outbound_calls')
      .select('*, lead:leads(*), agent:agents(*)')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching outbound calls:', error)
      return []
    }

    return data || []
  },

  async getOutboundCall(id: string): Promise<OutboundCall | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('outbound_calls')
      .select('*, lead:leads(*), agent:agents(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching outbound call:', error)
      return null
    }

    return data
  },

  async createOutboundCall(call: Omit<OutboundCall, 'id' | 'business_id' | 'created_at' | 'lead' | 'agent'>): Promise<OutboundCall | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('outbound_calls')
      .insert([{ ...call, business_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error('Error creating outbound call:', error)
      throw error
    }

    return data
  },

  async updateOutboundCall(id: string, updates: Partial<Omit<OutboundCall, 'id' | 'business_id' | 'created_at' | 'lead' | 'agent'>>): Promise<OutboundCall | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('outbound_calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating outbound call:', error)
      throw error
    }

    return data
  }
}
