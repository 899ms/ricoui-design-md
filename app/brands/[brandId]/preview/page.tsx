import { redirect } from "next/navigation"

export default async function LegacyBrandPreviewPage({
  params,
}: {
  params: Promise<{ brandId: string }>
}) {
  const { brandId } = await params
  redirect(`/brands/${encodeURIComponent(brandId)}`)
}
