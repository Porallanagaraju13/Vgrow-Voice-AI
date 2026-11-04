import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const configSchema = z.object({
  agentId: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  // Validate input
  const validation = configSchema.safeParse({ agentId })
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid agentId parameter' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*, business:businesses(name)')
    .eq('id', agentId)
    .eq('is_active', true)
    .single()

  if (agentError || !agent) {
    return NextResponse.json({ error: 'Active agent not found' }, { status: 404 })
  }

  const businessId = agent.business_id
  const businessName = (agent as { business?: { name?: string } }).business?.name || 'Our Partner Business'

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
    faqs: faqsData.data || [],
    services: servicesData.data || []
  })
}