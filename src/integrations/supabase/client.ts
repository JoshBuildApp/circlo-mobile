import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// The chat-files bucket is provisioned server-side by the migration
// 20260414000002_security_hardening_followup.sql as a *private* bucket with
// per-user folder RLS. The previous client-side auto-create path made it
// public with no RLS and has been removed.