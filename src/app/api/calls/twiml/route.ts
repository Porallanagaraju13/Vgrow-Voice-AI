import { NextRequest, NextResponse } from 'next/server'

const twilio = require('twilio')

function generateTwiML(request: NextRequest): NextResponse {
  try {
    // Verify Twilio signature
    const twilioSignature = request.headers.get('x-twilio-signature')
    const url = request.url
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!authToken) {
      console.error('[twilio] TWILIO_AUTH_TOKEN not configured')
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Configuration error.</Say><Hangup /></Response>',
        {
          status: 500,
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    // For TwiML requests, params come from query string
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    if (twilioSignature && !twilio.validateRequest(authToken, twilioSignature, url, params)) {
      console.error('[twilio] Invalid signature for TwiML request')
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Authentication failed.</Say><Hangup /></Response>',
        {
          status: 403,
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    const agentId = searchParams.get('agentId') || ''
    const callId = searchParams.get('callId') || ''
    const businessId = searchParams.get('businessId') || ''

    const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || process.env.NGROK_URL || process.env.NEXT_PUBLIC_APP_URL || ''
    // Convert https:// URL to wss:// host for WebSocket stream
    const wsHost = bridgeUrl.replace('https://', '').replace('http://', '')

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
  } catch (err: unknown) {
    const error = err as Error
    console.error('TwiML generation error:', error)
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
