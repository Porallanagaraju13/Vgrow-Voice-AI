import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getAuthUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('leads')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err: any) {
    console.error('Leads GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    // Bulk import
    if (body.leads && Array.isArray(body.leads)) {
      const leadsToInsert = body.leads.map((lead: any) => ({
        business_id: user.id,
        name: lead.name,
        phone: lead.phone,
        company: lead.company || null,
        notes: lead.notes || null,
        status: 'new',
      }))

      const { data, error } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select()

      if (error) {
        console.error('Error bulk importing leads:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, imported: data?.length || 0, leads: data || [] })
    }

    // Single lead
    const { name, phone, company, notes } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'name and phone are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([{
        business_id: user.id,
        name,
        phone,
        company: company || null,
        notes: notes || null,
        status: 'new',
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Leads POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
