import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !publicKey) throw new Error("Supabase is not configured")
  return { url, publicKey }
}

export async function createRequestSupabaseClient() {
  const { url, publicKey } = config()
  const store = await cookies()
  return createServerClient(url, publicKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options)
          )
        } catch {
          // Server Components cannot write cookies; route handlers can.
        }
      },
    },
  })
}

export function createAdminSupabaseClient() {
  const { url } = config()
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not configured")
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function requireUser() {
  const client = await createRequestSupabaseClient()
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

export function isSameOriginMutation(request: Request) {
  const site = request.headers.get("sec-fetch-site")
  if (site && site !== "same-origin" && site !== "none") return false
  const origin = request.headers.get("origin")
  if (!origin) return process.env.NODE_ENV !== "production"
  const requestUrl = new URL(request.url)
  const originUrl = new URL(origin)
  const forwardedHost = request.headers.get("x-forwarded-host")
  return originUrl.host === (forwardedHost ?? requestUrl.host)
}
