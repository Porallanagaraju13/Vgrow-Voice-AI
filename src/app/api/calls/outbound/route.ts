import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: calls, error } = await adminClient
      .from('outbound_calls')
      .select('*, lead:leads(*), agent:agents(*)')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching outbound calls:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedCalls = (calls || []).map((call: any) => ({
      ...call,
      lead_name: call.lead?.name || 'Unknown',
      lead_phone: call.lead?.phone || call.to_number || 'Unknown',
      agent_name: call.agent?.name || 'AI Agent',
    }))

    return NextResponse.json(formattedCalls)
  } catch (err: any) {
    console.error('Outbound calls API error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
