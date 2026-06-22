import { createClient } from '@/lib/supabase/client'
import { Conversation } from '@/types'

export const conversationsService = {
  async getConversations(): Promise<Conversation[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: inboundData, error: inboundError } = await supabase
      .from('conversations')
      .select('*, agent:agents(*)')
      .eq('business_id', user.id)

    const { data: outboundData, error: outboundError } = await supabase
      .from('outbound_calls')
      .select('*, agent:agents(*), lead:leads(*)')
      .eq('business_id', user.id)

    if (inboundError) console.error('Error fetching inbound conversations:', inboundError)
    if (outboundError) console.error('Error fetching outbound calls:', outboundError)

    const inbound = inboundData || []
    
    // Map outbound calls to match Conversation interface loosely so the UI handles it smoothly
    const outboundAsConversations = (outboundData || []).map((ob: any) => ({
      id: ob.id,
      business_id: ob.business_id,
      agent_id: ob.agent_id,
      customer_name: ob.lead?.name || ob.to_number || 'Outbound Lead',
      customer_phone: ob.lead?.phone || ob.to_number || 'N/A',
      duration: ob.duration,
      recording_url: ob.recording_url,
      transcript: ob.transcript,
      summary: ob.summary,
      created_at: ob.created_at,
      agent: ob.agent,
      type: 'outbound'
    }))

    const allConversations = [...inbound, ...outboundAsConversations].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return allConversations
  },

  async createConversation(conversation: Omit<Conversation, 'id' | 'created_at'>): Promise<Conversation | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('conversations')
      .insert([conversation])
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation log:', error)
      throw error
    }

    return data
  },

  async updateConversation(id: string, updates: Partial<Omit<Conversation, 'id' | 'business_id' | 'created_at'>>): Promise<Conversation | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating conversation log:', error)
      throw error
    }

    return data
  }
}