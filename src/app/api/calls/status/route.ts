import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const twilio = require('twilio')

// Map Twilio status values to our database status enum
function mapTwilioStatus(twilioStatus: string): string {
  const statusMap: Record<string, string> = {
    'queued': 'initiated',
    'initiated': 'initiated',
    'ringing': 'ringing',
    'in-progress': 'in_progress',
    'completed': 'completed',
    'failed': 'failed',
    'no-answer': 'no_answer',
    'busy': 'busy',
    'canceled': 'failed',
  }
  return statusMap[twilioStatus] || 'failed'
}

export async function POST(request: NextRequest) {
  try {
    // Verify Twilio signature
    const twilioSignature = request.headers.get('x-twilio-signature')
    const url = request.url
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!authToken) {
      console.error('[twilio] TWILIO_AUTH_TOKEN not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Twilio sends status callbacks as form-encoded data
    const formData = await request.formData()
    
    // Build params object for signature validation
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    if (twilioSignature && !twilio.validateRequest(authToken, twilioSignature, url, params)) {
      console.error('[twilio] Invalid signature for status callback')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const callDuration = formData.get('CallDuration') as string | null
    const recordingUrl = formData.get('RecordingUrl') as string | null

    if (!callSid || !callStatus) {
      return NextResponse.json(
        { error: 'CallSid and CallStatus are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const mappedStatus = mapTwilioStatus(callStatus)

    // Build the update object
    const updateData: Record<string, string | number> = {
      status: mappedStatus,
    }

    if (callDuration) {
      updateData.duration = parseInt(callDuration, 10)
    }

    if (recordingUrl) {
      updateData.recording_url = recordingUrl
    }

    // Update the outbound_calls record matching twilio_call_sid
    const { data: callRecord, error: updateError } = await supabase
      .from('outbound_calls')
      .update(updateData)
      .eq('twilio_call_sid', callSid)
      .select('id, lead_id, status')
      .single()

    if (updateError) {
      console.error('Error updating call status:', updateError)
      // Return 200 anyway so Twilio doesn't retry
      return NextResponse.json({ received: true })
    }

    // If the call is completed, update the lead status and last_called_at
    if (mappedStatus === 'completed' && callRecord?.lead_id) {
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'called',
          last_called_at: new Date().toISOString(),
        })
        .eq('id', callRecord.lead_id)

      if (leadError) {
        console.error('Error updating lead status:', leadError)
      }
    }

    // Also mark no_answer / busy on the lead if relevant
    if ((mappedStatus === 'no_answer' || mappedStatus === 'busy' || mappedStatus === 'failed') && callRecord?.lead_id) {
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          last_called_at: new Date().toISOString(),
        })
        .eq('id', callRecord.lead_id)

      if (leadError) {
        console.error('Error updating lead last_called_at:', leadError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Call status webhook error:', error)
    // Always return 200 to prevent Twilio from retrying
    return NextResponse.json({ received: true })
  }
}
