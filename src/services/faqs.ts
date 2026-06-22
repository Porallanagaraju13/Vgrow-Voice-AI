import { createClient } from '@/lib/supabase/client'
import { FAQ } from '@/types'

export const faqsService = {
  async getFaqs(): Promise<FAQ[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching FAQs:', error)
      return []
    }

    return data || []
  },

  async createFaq(faq: Omit<FAQ, 'id' | 'business_id' | 'created_at'>): Promise<FAQ | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('faqs')
      .insert([{ ...faq, business_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error('Error creating FAQ:', error)
      throw error
    }

    return data
  },

  async updateFaq(id: string, updates: Partial<Omit<FAQ, 'id' | 'business_id' | 'created_at'>>): Promise<FAQ | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating FAQ:', error)
      throw error
    }

    return data
  },

  async deleteFaq(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting FAQ:', error)
      return false
    }

    return true
  }
}