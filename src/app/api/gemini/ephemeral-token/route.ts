import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // Fetch agent and verify ownership
    const { data: agent, error: agentError } = await adminSupabase
      .from('agents')
      .select('*, business:businesses(id, gemini_api_key)')
      .eq('id', agentId)
      .eq('is_active', true)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Verify user owns this business
    const businessId = agent.business_id
    if (businessId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const geminiApiKey = (agent as { business?: { gemini_api_key?: string } }).business?.gemini_api_key || process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    // Request ephemeral token from Gemini API
    const tokenResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/cachedContents:generateToken?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expire_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        }),
      }
    )

    if (!tokenResponse.ok) {
      console.error('Failed to generate Gemini ephemeral token:', await tokenResponse.text())
      return NextResponse.json(
        { error: 'Failed to generate ephemeral token' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      token: tokenData.token,
      expiresAt: tokenData.expire_time,
    })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Ephemeral token API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
