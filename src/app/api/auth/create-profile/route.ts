import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  industry: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
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
    const validation = createProfileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { userId, name, industry, email, phone } = body

    // Verify user is creating their own profile
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from('businesses')
      .insert([{ id: userId, name, industry, email, phone }])
      .select()
      .single()

    if (error) {
      console.error('Error creating business profile:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: data })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Create profile API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
