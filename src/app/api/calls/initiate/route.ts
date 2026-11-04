import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const twilio = require('twilio')

const initiateCallSchema = z.object({
  leadId: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
  fromNumber: z.string().optional(),
  from_number: z.string().optional(),
}).refine(data => data.leadId || data.lead_id, {
  message: 'leadId or lead_id is required',
}).refine(data => data.agentId || data.agent_id, {
  message: 'agentId or agent_id is required',
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validation = initiateCallSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      )
    }

    const leadId = body.leadId || body.lead_id
    const agentId = body.agentId || body.agent_id
    const fromNumber = body.fromNumber || body.from_number

    const adminSupabase = createAdminClient()

    // 1. Fetch lead details
    const { data: lead, error: leadError } = await adminSupabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // 2. Fetch agent config
    const { data: agent, error: agentError } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const businessId = agent.business_id

    // 3. Verify user owns the business
    if (businessId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Format phone numbers (add +91 prefix if needed for Indian numbers and strip symbols)
    let toNumber = lead.phone.trim().replace(/[\s\-\(\)]/g, '')
    if (!toNumber.startsWith('+')) {
      toNumber = `+91${toNumber.replace(/^0+/, '')}`
    }

    let callerNumber = (fromNumber || process.env.TWILIO_PHONE_NUMBER || '').trim().replace(/[\s\-\(\)]/g, '')
    if (!callerNumber) {
      return NextResponse.json(
        { error: 'No from number provided and TWILIO_PHONE_NUMBER not configured' },
        { status: 400 }
      )
    }
    if (!callerNumber.startsWith('+')) {
      callerNumber = `+91${callerNumber.replace(/^0+/, '')}`
    }

    // 5. Create outbound_calls record with status 'initiated'
    const { data: callRecord, error: callError } = await adminSupabase
      .from('outbound_calls')
      .insert([{
        business_id: businessId,
        agent_id: agentId,
        lead_id: leadId,
        status: 'initiated',
        from_number: callerNumber,
        to_number: toNumber,
      }])
      .select()
      .single()

    if (callError || !callRecord) {
      console.error('Error creating outbound call record:', callError)
      return NextResponse.json(
        { error: 'Failed to create call record' },
        { status: 500 }
      )
    }

    // 6. Use Twilio SDK to place the outbound call
    const NGROK_URL = process.env.NGROK_URL || process.env.NEXT_PUBLIC_APP_URL
    if (!NGROK_URL) {
      return NextResponse.json(
        { error: 'NGROK_URL or NEXT_PUBLIC_APP_URL must be configured' },
        { status: 500 }
      )
    }

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const twilioCall = await twilioClient.calls.create({
      to: toNumber,
      from: callerNumber,
      url: `${NGROK_URL}/api/calls/twiml?agentId=${agentId}&callId=${callRecord.id}&businessId=${businessId}`,
      record: true,
      recordingStatusCallback: `${NGROK_URL}/api/calls/status`,
      recordingStatusCallbackEvent: ['completed'],
      statusCallback: `${NGROK_URL}/api/calls/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    })

    // 7. Update outbound_calls with twilio_call_sid
    const { error: updateError } = await adminSupabase
      .from('outbound_calls')
      .update({ twilio_call_sid: twilioCall.sid })
      .eq('id', callRecord.id)

    if (updateError) {
      console.error('Error updating call with Twilio SID:', updateError)
    }

    return NextResponse.json({
      success: true,
      callId: callRecord.id,
      twilioCallSid: twilioCall.sid,
    })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Initiate call API error:', error)
    const twilioError = error as { code?: number; message?: string }
    if (twilioError.code === 21219) {
      return NextResponse.json(
        { error: 'The destination number (+91 8332970360 or whichever number you dialed) has not been verified in your Twilio Trial Account. Please add it to your Verified Caller IDs in your Twilio Console, or upgrade your Twilio account.' },
        { status: 400 }
      )
    }
    if (twilioError.code === 21212) {
      return NextResponse.json(
        { error: `The caller number is invalid or not verified on your Twilio account. Please make sure you are using a number verified under "Verified Caller IDs" or a Twilio phone number purchased on your account.` },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: twilioError.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
