import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url) {
  throw new Error(
    'VITE_SUPABASE_URL is not set. Copy .env.example to .env — see README.md.'
  )
}

if (!anonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is not set. Copy .env.example to .env — see README.md.'
  )
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type { Database }
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

// Views need their own helper: `profiles` is a view, not a table, so it is
// absent from Database['public']['Tables'] and unreachable via Tables<T>.
// Track 3's AuthProvider reads profiles.status.
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']
