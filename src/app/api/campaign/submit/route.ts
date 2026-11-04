import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import twilio from 'twilio'

const campaignSubmitSchema = z.object({
  business_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  phone: z.string().min(10).max(20).regex(/^[\+\d\s\-\(\)]+$/),
  notes: z.string().max(1000).optional(),
  company: z.string().max(200).optional(),
})

// Simple in-memory rate limiter (in production, use Redis)
const rateLimiter = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const requests = rateLimiter.get(identifier) || []
  
  // Filter out old requests
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS)
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  recentRequests.push(now)
  rateLimiter.set(identifier, recentRequests)
  
  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, times] of rateLimiter.entries()) {
      if (times.every(t => now - t > RATE_LIMIT_WINDOW_MS)) {
        rateLimiter.delete(key)
      }
    }
  }
  
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validation = campaignSubmitSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { business_id, name, phone, notes, company } = body

    const supabase = createAdminClient()

    // Verify business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Invalid business_id' },
        { status: 400 }
      )
    }

    // 1. Create the Lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([{
        business_id,
        name,
        phone,
        company: company || null,
        notes: notes || 'Lead captured via Campaign Webhook',
        status: 'new'
      }])
      .select()
      .single()

    if (leadError || !lead) {
      console.error('Error creating lead:', leadError)
      return NextResponse.json(
        { error: 'Failed to create lead.' },
        { status: 500 }
      )
    }

    // 2. Find an active Agent for this business
    // We get the most recently created agent to act as the default.
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('business_id', business_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (agentError || !agent) {
      console.error('Error finding agent:', agentError)
      return NextResponse.json(
        { success: true, leadId: lead.id, warning: 'Lead created, but no active agent found to place the call.' },
        { status: 201 }
      )
    }

    const agentId = agent.id

    // 3. Format Phone Numbers
    let toNumber = lead.phone.trim().replace(/[\s\-\(\)]/g, '')
    if (!toNumber.startsWith('+')) {
      toNumber = `+91${toNumber.replace(/^0+/, '')}`
    }

    let callerNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim().replace(/[\s\-\(\)]/g, '')
    if (!callerNumber) {
       return NextResponse.json(
        { success: true, leadId: lead.id, warning: 'Lead created, but TWILIO_PHONE_NUMBER is missing in environment variables.' },
        { status: 201 }
      )
    }
    if (!callerNumber.startsWith('+')) {
      callerNumber = `+91${callerNumber.replace(/^0+/, '')}`
    }

    // 4. Create outbound_calls record with status 'initiated'
    const { data: callRecord, error: callError } = await supabase
      .from('outbound_calls')
      .insert([{
        business_id: business_id,
        agent_id: agentId,
        lead_id: lead.id,
        status: 'initiated',
        from_number: callerNumber,
        to_number: toNumber,
      }])
      .select()
      .single()

    if (callError || !callRecord) {
      console.error('Error creating outbound call record:', callError)
      return NextResponse.json(
        { success: true, leadId: lead.id, warning: 'Lead created, but failed to log outbound call.' },
        { status: 201 }
      )
    }

    // 5. Use Twilio SDK to place the outbound call
    const NGROK_URL = process.env.NGROK_URL || process.env.NEXT_PUBLIC_APP_URL
    if (!NGROK_URL) {
      return NextResponse.json(
        { success: true, leadId: lead.id, warning: 'Lead created, but NGROK_URL/NEXT_PUBLIC_APP_URL missing for Twilio routing.' },
        { status: 201 }
      )
    }

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    try {
      const twilioCall = await twilioClient.calls.create({
        to: toNumber,
        from: callerNumber,
        url: `${NGROK_URL}/api/calls/twiml?agentId=${agentId}&callId=${callRecord.id}&businessId=${business_id}`,
        record: true,
        statusCallback: `${NGROK_URL}/api/calls/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
      })

      // 6. Update outbound_calls with twilio_call_sid
      await supabase
        .from('outbound_calls')
        .update({ twilio_call_sid: twilioCall.sid })
        .eq('id', callRecord.id)

      return NextResponse.json({
        success: true,
        message: 'Lead captured and call initiated successfully.',
        leadId: lead.id,
        callId: callRecord.id,
        twilioCallSid: twilioCall.sid,
      }, { status: 201 })
      
    } catch (twilioErr: unknown) {
      const twilioError = twilioErr as Error
      console.error('Twilio Call Error:', twilioError)
      return NextResponse.json(
        { success: true, leadId: lead.id, warning: `Lead created, but call failed: ${twilioError.message}` },
        { status: 201 }
      )
    }

  } catch (err: unknown) {
    const error = err as Error
    console.error('Campaign Webhook API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
