import { NextResponse } from "next/server"
import { publishRelease, ReleaseError } from "@/lib/releases/server"
import type { PublishReleaseRequest } from "@/lib/releases/types"
import {
  createAdminSupabaseClient,
  isSameOriginMutation,
  requireUser,
} from "@/lib/sync/supabase-server"

function errorResponse(error: unknown) {
  if (error instanceof ReleaseError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    )
  const message =
    error instanceof Error ? error.message : "交付版本服务暂时不可用"
  const code =
    message.match(/RICO_[A-Z_]+/)?.[0]?.toLowerCase() ?? "release-failed"
  return NextResponse.json({ error: message, code }, { status: 500 })
}

export async function GET(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const url = new URL(request.url)
  const admin = createAdminSupabaseClient()
  const expired = await admin
    .from("document_releases")
    .select("id, object_path")
    .eq("owner_id", user.id)
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
  if (!expired.error && expired.data.length > 0) {
    await admin.storage
      .from("design-releases")
      .remove(expired.data.map((item) => item.object_path))
    await admin
      .from("document_releases")
      .delete()
      .eq("owner_id", user.id)
      .in(
        "id",
        expired.data.map((item) => item.id)
      )
  }
  let query = admin
    .from("document_releases")
    .select(
      "id, source_kind, source_id, source_name, source_version, exporter_version, zip_sha256, stored_bytes, uncompressed_bytes, manifest, status, created_at, completed_at"
    )
    .eq("owner_id", user.id)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
  const sourceId = url.searchParams.get("sourceId")
  if (sourceId) query = query.eq("source_id", sourceId)
  const result = await query.limit(100)
  if (result.error) return errorResponse(result.error)
  return NextResponse.json({ releases: result.data })
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request))
    return NextResponse.json({ error: "请求来源无效" }, { status: 403 })
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const body = (await request
    .json()
    .catch(() => null)) as PublishReleaseRequest | null
  if (
    !body ||
    !["document", "library_entry"].includes(body.sourceKind) ||
    typeof body.sourceId !== "string" ||
    !Number.isInteger(body.expectedVersion) ||
    !/^[0-9a-f]{64}$/.test(body.expectedSha256) ||
    !/^[0-9a-f-]{36}$/i.test(body.clientRequestId)
  ) {
    return NextResponse.json({ error: "交付版本参数无效" }, { status: 400 })
  }
  try {
    return NextResponse.json({ release: await publishRelease(user.id, body) })
  } catch (error) {
    return errorResponse(error)
  }
}
