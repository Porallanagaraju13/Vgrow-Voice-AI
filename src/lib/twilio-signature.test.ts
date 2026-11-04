import { describe, it, expect, beforeAll } from 'vitest'
import crypto from 'crypto'

// Use dynamic import for twilio since it's a CommonJS module
let twilio: typeof import('twilio')

beforeAll(async () => {
  twilio = await import('twilio')
})

// Helper to generate expected Twilio signature
function getExpectedTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>
): string {
  // Twilio signature algorithm:
  // 1. Sort params by key
  // 2. Concatenate: url + sorted_key1 + value1 + sorted_key2 + value2...
  // 3. HMAC-SHA1 with auth token
  // 4. Base64 encode
  const data = url + Object.keys(params)
    .sort()
    .map(key => key + params[key])
    .join('')

  return crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64')
}

describe('Twilio Signature Validation', () => {
  const authToken = 'test_auth_token_12345'
  const url = 'https://example.com/api/calls/status'

  it('should validate a correct signature', () => {
    const params = {
      CallSid: 'CA1234567890abcdef',
      CallStatus: 'completed',
      From: '+12025551234',
      To: '+12025555678',
    }

    // Generate a valid signature
    const signature = getExpectedTwilioSignature(authToken, url, params)

    // Validate it
    const isValid = twilio.validateRequest(authToken, signature, url, params)
    expect(isValid).toBe(true)
  })

  it('should reject an invalid signature', () => {
    const params = {
      CallSid: 'CA1234567890abcdef',
      CallStatus: 'completed',
    }

    const invalidSignature = 'invalid_signature_xyz'

    const isValid = twilio.validateRequest(authToken, invalidSignature, url, params)
    expect(isValid).toBe(false)
  })

  it('should reject signature with tampered parameters', () => {
    const params = {
      CallSid: 'CA1234567890abcdef',
      CallStatus: 'completed',
    }

    const signature = getExpectedTwilioSignature(authToken, url, params)

    // Tamper with the params
    const tamperedParams = {
      ...params,
      CallStatus: 'failed',
    }

    const isValid = twilio.validateRequest(authToken, signature, url, tamperedParams)
    expect(isValid).toBe(false)
  })

  it('should reject signature with different URL', () => {
    const params = {
      CallSid: 'CA1234567890abcdef',
    }

    const signature = getExpectedTwilioSignature(authToken, url, params)

    const differentUrl = 'https://example.com/api/calls/twiml'
    const isValid = twilio.validateRequest(authToken, signature, differentUrl, params)
    expect(isValid).toBe(false)
  })
})
