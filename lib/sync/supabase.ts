import { createBrowserClient } from "@supabase/ssr"

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return url && anonKey ? { url, anonKey } : null
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserSupabaseClient() {
  const config = getSupabaseConfig()
  if (!config) return null
  browserClient ??= createBrowserClient(config.url, config.anonKey)
  return browserClient
}
