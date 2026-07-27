import { NextResponse } from "next/server"
import {
  createAdminSupabaseClient,
  isSameOriginMutation,
  requireUser,
} from "@/lib/sync/supabase-server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginMutation(request))
    return NextResponse.json({ error: "请求来源无效" }, { status: 403 })
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const admin = createAdminSupabaseClient()
  const id = (await params).id
  const release = await admin
    .from("document_releases")
    .select("object_path, zip_sha256, manifest")
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("status", "complete")
    .maybeSingle()
  if (release.error)
    return NextResponse.json({ error: release.error.message }, { status: 500 })
  if (!release.data)
    return NextResponse.json({ error: "交付版本不存在" }, { status: 404 })
  const quota = await admin.rpc("consume_download_quota", {
    p_owner_id: user.id,
  })
  if (quota.error)
    return NextResponse.json({ error: "下载请求过于频繁" }, { status: 429 })
  const signed = await admin.storage
    .from("design-releases")
    .createSignedUrl(release.data.object_path, 60, { download: "delivery.zip" })
  if (signed.error)
    return NextResponse.json({ error: signed.error.message }, { status: 500 })
  return NextResponse.json({
    url: signed.data.signedUrl,
    expiresIn: 60,
    sha256: release.data.zip_sha256,
    manifest: release.data.manifest,
  })
}
