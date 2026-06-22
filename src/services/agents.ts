import { createClient } from '@/lib/supabase/client'
import { Agent } from '@/types'

export const agentsService = {
  async getAgents(): Promise<Agent[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agents:', error)
      return []
    }

    return data || []
  },

  async createAgent(agent: Omit<Agent, 'id' | 'business_id' | 'created_at'>): Promise<Agent | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('agents')
      .insert([{ ...agent, business_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error('Error creating agent:', error)
      throw error
    }

    return data
  },

  async updateAgent(id: string, updates: Partial<Omit<Agent, 'id' | 'business_id' | 'created_at'>>): Promise<Agent | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating agent:', error)
      throw error
    }

    return data
  },

  async deleteAgent(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting agent:', error)
      return false
    }

    return true
  }
}