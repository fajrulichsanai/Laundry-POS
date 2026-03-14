'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createSession, deleteSession, validateSession } from '@/lib/session'

/**
 * Login dengan email dan password
 */
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validasi input
  if (!email || !password) {
    return { error: 'Email dan password harus diisi' }
  }

  // Cari user berdasarkan email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('active', true)
    .single()

  if (userError || !user) {
    return { error: 'Email atau password salah' }
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash)

  if (!isPasswordValid) {
    return { error: 'Email atau password salah' }
  }

  // Buat session
  try {
    await createSession(user.id)
  } catch (error) {
    return { error: 'Gagal membuat session' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Signup user baru (jika diperlukan)
 */
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = (formData.get('role') as string) || 'cashier'

  // Validasi input
  if (!email || !password || !name) {
    return { error: 'Semua field harus diisi' }
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  // Cek apakah email sudah terdaftar
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existingUser) {
    return { error: 'Email sudah terdaftar' }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Insert user baru
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      role,
    })
    .select()
    .single()

  if (insertError || !newUser) {
    return { error: 'Gagal membuat akun' }
  }

  // Buat session
  try {
    await createSession(newUser.id)
  } catch (error) {
    return { error: 'Gagal membuat session' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Logout user
 */
export async function logout() {
  await deleteSession()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Get current user dari session
 */
export async function getCurrentUser() {
  return await validateSession()
}

/**
 * Get session (untuk compatibility)
 */
export async function getSession() {
  const user = await validateSession()
  return user ? { user } : null
}
