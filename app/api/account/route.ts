import { NextResponse } from "next/server"
import {
  createAdminSupabaseClient,
  isSameOriginMutation,
  requireUser,
} from "@/lib/sync/supabase-server"
import {
  CLOUD_ACCOUNT_MARKDOWN_BYTES,
  CLOUD_DOCUMENT_LIMIT,
  CLOUD_LIBRARY_LIMIT,
} from "@/lib/sync/cloud-limits"

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const admin = createAdminSupabaseClient()
  const [usage, controls] = await Promise.all([
    admin
      .from("account_usage")
      .select(
        "document_count, library_count, markdown_bytes, release_count, release_bytes"
      )
      .eq("owner_id", user.id)
      .maybeSingle(),
    admin
      .from("cloud_controls")
      .select(
        "registration_enabled, sync_growth_enabled, releases_enabled, message"
      )
      .eq("singleton", true)
      .single(),
  ])
  if (usage.error || controls.error)
    return NextResponse.json(
      { error: usage.error?.message ?? controls.error?.message },
      { status: 500 }
    )
  return NextResponse.json({
    usage: usage.data ?? {
      document_count: 0,
      library_count: 0,
      markdown_bytes: 0,
      release_count: 0,
      release_bytes: 0,
    },
    controls: controls.data,
    limits: {
      documents: CLOUD_DOCUMENT_LIMIT,
      library: CLOUD_LIBRARY_LIMIT,
      markdownBytes: CLOUD_ACCOUNT_MARKDOWN_BYTES,
      releases: 100,
      releaseBytes: 5242880,
    },
  })
}

export async function DELETE(request: Request) {
  if (!isSameOriginMutation(request))
    return NextResponse.json({ error: "请求来源无效" }, { status: 403 })
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const admin = createAdminSupabaseClient()
  const releases = await admin
    .from("document_releases")
    .select("object_path")
    .eq("owner_id", user.id)
  if (releases.error)
    return NextResponse.json({ error: releases.error.message }, { status: 500 })
  if (releases.data.length > 0) {
    const removed = await admin.storage
      .from("design-releases")
      .remove(releases.data.map((item) => item.object_path))
    if (removed.error)
      return NextResponse.json(
        { error: "发布文件删除失败，账户未删除，可安全重试" },
        { status: 503 }
      )
  }
  const deleted = await admin.auth.admin.deleteUser(user.id)
  if (deleted.error)
    return NextResponse.json({ error: deleted.error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
