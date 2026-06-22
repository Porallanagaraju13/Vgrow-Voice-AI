import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, images, icons, and script API routes:
     */
    '/((?!_next/static|_next/image|favicon.ico|api/widget-script|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}