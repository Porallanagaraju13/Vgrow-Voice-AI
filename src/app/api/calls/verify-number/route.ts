import { NextRequest, NextResponse } from 'next/server'

// CommonJS import — twilio doesn't ship proper ESM exports
const twilio = require('twilio')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'phoneNumber is required' },
        { status: 400 }
      )
    }

    // Format phone number (add +91 prefix if needed)
    let formattedNumber = phoneNumber.trim()
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = `+91${formattedNumber.replace(/^0+/, '')}`
    }

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    // Create a validation request — Twilio will call this number
    // and ask the recipient to enter a validation code
    const validationRequest = await twilioClient.validationRequests.create({
      friendlyName: `Business Number ${formattedNumber}`,
      phoneNumber: formattedNumber,
    })

    return NextResponse.json({
      success: true,
      validationCode: validationRequest.validationCode,
      callSid: validationRequest.callSid,
      phoneNumber: formattedNumber,
    })
  } catch (err: any) {
    console.error('Verify number API error:', err)

    // Handle specific Twilio errors
    if (err.code === 21214) {
      return NextResponse.json(
        { error: 'This phone number is not a valid phone number.' },
        { status: 400 }
      )
    }

    if (err.code === 21215) {
      return NextResponse.json(
        { error: 'This phone number is already verified.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Failed to verify phone number' },
      { status: 500 }
    )
  }
}
