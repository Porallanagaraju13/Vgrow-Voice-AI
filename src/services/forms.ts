import { createClient } from '@/lib/supabase/client'
import type { CampaignForm } from '@/types'

class CampaignFormsService {
  async getForms(): Promise<CampaignForm[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('campaign_forms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getForm(id: string): Promise<CampaignForm | null> {
    const supabase = createClient()
    
    // We don't check auth here because the public page needs to read the form too!
    const { data, error } = await supabase
      .from('campaign_forms')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createForm(form: Partial<CampaignForm>): Promise<CampaignForm> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('campaign_forms')
      .insert([{ ...form, business_id: user.id }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateForm(id: string, updates: Partial<CampaignForm>): Promise<CampaignForm> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('campaign_forms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteForm(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('campaign_forms')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const formsService = new CampaignFormsService()
