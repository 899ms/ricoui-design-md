import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Normalize CRLF / bare CR to LF. Everything that enters the store must run
 * through this: section-skeleton offsets are computed over marked's
 * LF-normalized token stream, so splicing against a CRLF source would corrupt
 * the document (PROJECT-REVIEW B1).
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n")
}
