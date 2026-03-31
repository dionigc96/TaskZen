'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  if (!password || password.length < 6) {
     redirect(`/update-password?message=La contraseña debe tener mínimo 6 caracteres&type=error`)
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    redirect(`/update-password?message=${encodeURIComponent(error.message)}&type=error`)
  }

  // Redirigimos directamente al dashboard, la sesión ya está activa y la clave cambiada con éxito.
  redirect('/board')
}
