import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Por defecto iremos al app, pero si el flujo de reseteo envía 'next=/update-password', iremos ahí.
  const next = searchParams.get('next') ?? '/board'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si no hay token de intercambio en la URL, devolvemos al usuario al login con error
  return NextResponse.redirect(`${origin}/login?message=El enlace de seguridad ha caducado o es inválido. Inténtalo de nuevo.&type=error`)
}
