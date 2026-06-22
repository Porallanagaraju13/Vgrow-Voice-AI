import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json({ error: 'agentId query parameter is required' }, { status: 400 })
  }

  // Use Admin Client to query database values without browser session context
  const supabase = createAdminClient()

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*, business:businesses(name, gemini_api_key)')
    .eq('id', agentId)
    .eq('is_active', true)
    .single()

  if (agentError || !agent) {
    return NextResponse.json({ error: 'Active agent not found' }, { status: 404 })
  }

  const businessId = agent.business_id
  const businessName = (agent as any).business?.name || 'Our Partner Business'
  const geminiApiKey = (agent as any).business?.gemini_api_key || process.env.NEXT_PUBLIC_GEMINI_API_KEY

  const [faqsData, servicesData] = await Promise.all([
    supabase.from('faqs').select('*').eq('business_id', businessId),
    supabase.from('services').select('*').eq('business_id', businessId)
  ])

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      voice: agent.voice,
      system_prompt: agent.system_prompt,
      tonality: agent.tonality,
      business_id: agent.business_id
    },
    businessName,
    geminiApiKey,
    faqs: faqsData.data || [],
    services: servicesData.data || []
  })
}