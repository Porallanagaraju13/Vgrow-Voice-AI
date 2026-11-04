import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const conversationSchema = z.object({
  business_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(1),
  transcript: z.array(z.any()),
  summary: z.string(),
  status: z.string(),
  duration: z.number().int().min(0),
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
    const validation = conversationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      )
    }

    // Verify user owns the business
    if (body.business_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from('conversations')
      .insert([body])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}