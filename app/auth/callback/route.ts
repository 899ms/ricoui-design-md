import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getSupabaseConfig } from "@/lib/sync/supabase"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const config = getSupabaseConfig()
  if (!config || !code)
    return NextResponse.redirect(new URL("/?auth=failed", requestUrl.origin))

  const cookieStore = await cookies()
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  return NextResponse.redirect(
    new URL(error ? "/?auth=failed" : "/", requestUrl.origin)
  )
}
