export const CLOUD_DOCUMENT_LIMIT = 75
export const CLOUD_LIBRARY_LIMIT = 50
export const CLOUD_SOURCE_MARKDOWN_BYTES = 250 * 1024
export const CLOUD_ACCOUNT_MARKDOWN_BYTES = 1024 * 1024

export function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength
}
