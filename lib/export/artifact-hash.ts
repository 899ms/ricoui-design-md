import type { ReleaseArtifactBundle } from "@/lib/export/export-zip"

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const input = new Uint8Array(bytes.length)
  input.set(bytes)
  const digest = await crypto.subtle.digest("SHA-256", input.buffer)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}

export async function buildArtifactManifest(bundle: ReleaseArtifactBundle) {
  return Promise.all(
    bundle.files.map(async (file) => ({
      name: file.name,
      mediaType: file.mediaType,
      bytes: file.bytes.length,
      sha256: await sha256Hex(file.bytes),
    }))
  )
}
