import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const twilio = require('twilio')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_id, name, phone, notes, company } = body

    if (!business_id || !name || !phone) {
      return NextResponse.json(
        { error: 'business_id, name, and phone are required fields.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

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
      
    } catch (twilioErr: any) {
      console.error('Twilio Call Error:', twilioErr)
      return NextResponse.json(
        { success: true, leadId: lead.id, warning: `Lead created, but call failed: ${twilioErr.message}` },
        { status: 201 }
      )
    }

  } catch (err: any) {
    console.error('Campaign Webhook API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
