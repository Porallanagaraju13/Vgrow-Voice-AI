import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    // Twilio sends status callbacks as form-encoded data
    const formData = await request.formData()

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
    const updateData: Record<string, any> = {
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
  } catch (err: any) {
    console.error('Call status webhook error:', err)
    // Always return 200 to prevent Twilio from retrying
    return NextResponse.json({ received: true })
  }
}
