'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}&type=error`)
  }

  // Update session info and redirect purely on the server side
  revalidatePath('/board', 'layout')
  redirect('/board')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string

  if (!full_name || full_name.trim().length === 0) {
    redirect('/login?message=El nombre completo es obligatorio para registrarse.&type=error')
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
       data: {
          full_name, 
       }
    }
  })

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}&type=error`)
  }

  redirect('/login?message=¡Te hemos enviado un correo de confirmación! Por favor, verifica tu bandeja de entrada.&type=success')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  if (!email) {
    redirect(`/login?message=Introduce tu correo electrónico arriba para enviarte la llave.&type=error`)
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}&type=error`)
  }

  redirect('/login?message=Te hemos enviado la llave maestra a tu correo. Revisa pronto tu bandeja.&type=success')
}
