export type UrlSourceKind =
  | "website"
  | "published-design-md"
  | "direct-design-md"

export interface UrlSourceMetadata {
  kind: UrlSourceKind
  requestedUrl: string
  pageUrl: string
  sourceUrl: string
  title?: string
  description?: string
  language?: string
  themeColor?: string
  visualUrl?: string
}

export interface UrlSourcePackage {
  url: string
  content: string
  cssEvidence: string
  publishedDesignMd?: string
  source: UrlSourceMetadata
  truncated: boolean
}
