import { createClient, SupabaseClient } from '@supabase/supabase-js'

function resolveSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  const isPlaceholder =
    !url ||
    url === 'your_supabase_url' ||
    !key ||
    key === 'your_supabase_anon_key'

  if (isPlaceholder) {
    return {
      url: 'https://placeholder.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
    }
  }

  return { url, key }
}

const config = resolveSupabaseConfig()

export const supabase: SupabaseClient = createClient(config.url, config.key)
