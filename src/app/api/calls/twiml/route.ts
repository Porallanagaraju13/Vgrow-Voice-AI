import { NextRequest, NextResponse } from 'next/server'

function generateTwiML(request: NextRequest): NextResponse {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || ''
    const callId = searchParams.get('callId') || ''
    const businessId = searchParams.get('businessId') || ''

    const NGROK_URL = process.env.NGROK_URL || process.env.NEXT_PUBLIC_APP_URL || ''
    // Convert https:// URL to wss:// host for WebSocket stream
    const wsHost = NGROK_URL.replace('https://', '').replace('http://', '')

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Please hold while we connect you.</Say>
  <Connect>
    <Stream url="wss://${wsHost}/media-stream">
      <Parameter name="agentId" value="${agentId}" />
      <Parameter name="callId" value="${callId}" />
      <Parameter name="businessId" value="${businessId}" />
    </Stream>
  </Connect>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (err: any) {
    console.error('TwiML generation error:', err)
    // Return a fallback TwiML that hangs up gracefully
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We are unable to connect your call at this time. Please try again later.</Say>
  <Hangup />
</Response>`

    return new NextResponse(fallback, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}

// Twilio may send GET or POST to this webhook
export async function GET(request: NextRequest) {
  return generateTwiML(request)
}

export async function POST(request: NextRequest) {
  return generateTwiML(request)
}
