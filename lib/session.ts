'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

const SESSION_COOKIE_NAME = 'session_token'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 hari dalam milliseconds

export interface Session {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'cashier'
  active: boolean
  created_at: string
  updated_at: string
}

/**
 * Generate session token yang aman (internal helper)
 */
function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Buat session baru untuk user
 */
export async function createSession(userId: string): Promise<string> {
  const supabase = await createClient()
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create session')
  }

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })

  return sessionToken
}

/**
 * Validasi dan refresh session
 */
export async function validateSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) {
    return null
  }

  const supabase = await createClient()

  // Ambil session dari database
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single()

  if (sessionError || !session) {
    return null
  }

  // Cek apakah session sudah expired
  const expiresAt = new Date(session.expires_at)
  const now = new Date()

  if (now > expiresAt) {
    // Session expired, hapus session
    await deleteSession(sessionToken)
    return null
  }

  // Ambil data user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name, role, active, created_at, updated_at')
    .eq('id', session.user_id)
    .eq('active', true)
    .single()

  if (userError || !user) {
    await deleteSession(sessionToken)
    return null
  }

  // Sliding session: refresh expiry jika session masih 50% dari waktu
  const halfDuration = SESSION_DURATION / 2
  const timeRemaining = expiresAt.getTime() - now.getTime()

  if (timeRemaining < halfDuration) {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION)

    // Update expires_at di database
    await supabase
      .from('sessions')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('session_token', sessionToken)

    // Update cookie
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: newExpiresAt,
      path: '/',
    })
  }

  return user
}

/**
 * Hapus session (logout)
 */
export async function deleteSession(sessionToken?: string): Promise<void> {
  const cookieStore = await cookies()
  const token = sessionToken || cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return
  }

  const supabase = await createClient()

  // Hapus dari database
  await supabase.from('sessions').delete().eq('session_token', token)

  // Hapus cookie
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Hapus semua session yang expired (cleanup job)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  await supabase.from('sessions').delete().lt('expires_at', now)
}

/**
 * Get current session token dari cookie
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null
}
