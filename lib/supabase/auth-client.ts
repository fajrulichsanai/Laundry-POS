import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create Supabase client dengan service role key
 * HANYA untuk operasi auth yang memerlukan bypass RLS
 */
export function createAuthClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
