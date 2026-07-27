import { NextResponse } from "next/server"
import { deleteRelease, ReleaseError } from "@/lib/releases/server"
import { isSameOriginMutation, requireUser } from "@/lib/sync/supabase-server"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginMutation(request))
    return NextResponse.json({ error: "请求来源无效" }, { status: 403 })
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  try {
    await deleteRelease(user.id, (await params).id)
    return new Response(null, { status: 204 })
  } catch (error) {
    const status = error instanceof ReleaseError ? error.status : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败" },
      { status }
    )
  }
}
