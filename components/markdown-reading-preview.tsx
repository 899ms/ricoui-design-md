"use client"

import type { CSSProperties, ReactNode } from "react"
import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { marked } from "marked"

type MarkdownToken = {
  type?: string
  raw?: string
  text?: string
  depth?: number
  lang?: string
  href?: string
  title?: string
  ordered?: boolean
  start?: number
  checked?: boolean
  task?: boolean
  tokens?: MarkdownToken[]
  items?: MarkdownToken[]
  header?: MarkdownTableCell[]
  rows?: MarkdownTableCell[][]
  align?: Array<string | null>
}

type MarkdownTableCell = {
  text?: string
  tokens?: MarkdownToken[]
}

function isSafeHref(href: string) {
  const trimmed = href.trim()

  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    /^(https?:|mailto:|tel:)/i.test(trimmed)
  )
}

function getTextAlign(
  value: string | null | undefined
): CSSProperties["textAlign"] {
  if (value === "left" || value === "right" || value === "center") {
    return value
  }

  return undefined
}

function renderInlineTokens(
  tokens: MarkdownToken[] | undefined,
  fallback: string | undefined,
  keyPrefix: string
): ReactNode {
  if (!tokens || tokens.length === 0) return fallback ?? null

  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${token.type ?? "inline"}-${index}`
    const text = token.text ?? token.raw ?? ""

    switch (token.type) {
      case "strong":
        return (
          <strong key={key} className="font-semibold text-foreground">
            {renderInlineTokens(token.tokens, text, key)}
          </strong>
        )
      case "em":
        return (
          <em key={key} className="italic">
            {renderInlineTokens(token.tokens, text, key)}
          </em>
        )
      case "codespan":
        return (
          <code
            key={key}
            className="rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
          >
            {text}
          </code>
        )
      case "link":
        if (!token.href || !isSafeHref(token.href)) {
          return (
            <span key={key}>{renderInlineTokens(token.tokens, text, key)}</span>
          )
        }

        return (
          <a
            key={key}
            href={token.href}
            title={token.title}
            target={
              token.href.startsWith("#") || token.href.startsWith("/")
                ? undefined
                : "_blank"
            }
            rel={
              token.href.startsWith("#") || token.href.startsWith("/")
                ? undefined
                : "noreferrer"
            }
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {renderInlineTokens(token.tokens, text, key)}
          </a>
        )
      case "br":
        return <br key={key} />
      case "html":
        return (
          <code
            key={key}
            className="rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
          >
            {token.raw ?? text}
          </code>
        )
      case "text":
      default:
        return (
          <span key={key}>{renderInlineTokens(token.tokens, text, key)}</span>
        )
    }
  })
}

function renderListItems(
  items: MarkdownToken[] | undefined,
  keyPrefix: string
) {
  return (items ?? []).map((item, index) => {
    const nestedTokens = item.tokens ?? []
    const directText =
      nestedTokens.length > 0
        ? null
        : renderInlineTokens(
            undefined,
            item.text ?? item.raw,
            `${keyPrefix}-${index}`
          )

    return (
      <li key={`${keyPrefix}-item-${index}`} className="pl-1">
        {item.task && (
          <input
            type="checkbox"
            checked={Boolean(item.checked)}
            readOnly
            tabIndex={-1}
            className="mr-2 translate-y-0.5"
          />
        )}
        {directText}
        {nestedTokens.length > 0 && (
          <div className="space-y-2">
            {renderBlockTokens(nestedTokens, `${keyPrefix}-${index}`)}
          </div>
        )}
      </li>
    )
  })
}

function Heading({ depth, children }: { depth: number; children: ReactNode }) {
  const level = Math.min(Math.max(depth, 1), 6)
  const className =
    level === 1
      ? "mt-0 text-3xl font-semibold tracking-normal text-foreground"
      : level === 2
        ? "mt-8 border-b border-border/60 pb-2 text-2xl font-semibold tracking-normal text-foreground"
        : level === 3
          ? "mt-7 text-xl font-semibold tracking-normal text-foreground"
          : "mt-6 text-base font-semibold tracking-normal text-foreground"

  if (level === 1) return <h1 className={className}>{children}</h1>
  if (level === 2) return <h2 className={className}>{children}</h2>
  if (level === 3) return <h3 className={className}>{children}</h3>
  if (level === 4) return <h4 className={className}>{children}</h4>
  if (level === 5) return <h5 className={className}>{children}</h5>
  return <h6 className={className}>{children}</h6>
}

function renderTable(token: MarkdownToken, key: string) {
  const align = token.align ?? []

  return (
    <div
      key={key}
      className="overflow-x-auto rounded-lg border border-border/70"
    >
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead className="bg-muted/70">
          <tr>
            {(token.header ?? []).map((cell, index) => (
              <th
                key={`${key}-head-${index}`}
                style={{ textAlign: getTextAlign(align[index]) }}
                className="border-b border-border/70 px-3 py-2 font-semibold text-foreground"
              >
                {renderInlineTokens(
                  cell.tokens,
                  cell.text,
                  `${key}-head-${index}`
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(token.rows ?? []).map((row, rowIndex) => (
            <tr
              key={`${key}-row-${rowIndex}`}
              className="odd:bg-background even:bg-muted/30"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${key}-cell-${rowIndex}-${cellIndex}`}
                  style={{ textAlign: getTextAlign(align[cellIndex]) }}
                  className="border-t border-border/50 px-3 py-2 align-top text-muted-foreground"
                >
                  {renderInlineTokens(
                    cell.tokens,
                    cell.text,
                    `${key}-cell-${rowIndex}-${cellIndex}`
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderBlockTokens(
  tokens: MarkdownToken[],
  keyPrefix: string
): ReactNode[] {
  return tokens.flatMap((token, index) => {
    const key = `${keyPrefix}-${token.type ?? "block"}-${index}`

    switch (token.type) {
      case "space":
        return []
      case "heading":
        return (
          <Heading key={key} depth={token.depth ?? 2}>
            {renderInlineTokens(token.tokens, token.text, key)}
          </Heading>
        )
      case "paragraph":
        return (
          <p key={key} className="text-sm leading-7 text-muted-foreground">
            {renderInlineTokens(token.tokens, token.text, key)}
          </p>
        )
      case "blockquote":
        return (
          <blockquote
            key={key}
            className="border-l-4 border-primary/35 bg-muted/40 px-4 py-3 text-sm leading-7 text-muted-foreground"
          >
            {token.tokens && token.tokens.length > 0
              ? renderBlockTokens(token.tokens, key)
              : token.text}
          </blockquote>
        )
      case "list": {
        const ListTag = token.ordered ? "ol" : "ul"
        return (
          <ListTag
            key={key}
            start={token.ordered ? token.start : undefined}
            className={
              token.ordered
                ? "list-decimal space-y-2 pl-6 text-sm leading-7 text-muted-foreground"
                : "list-disc space-y-2 pl-6 text-sm leading-7 text-muted-foreground"
            }
          >
            {renderListItems(token.items, key)}
          </ListTag>
        )
      }
      case "table":
        return renderTable(token, key)
      case "code":
        return (
          <figure
            key={key}
            className="overflow-hidden rounded-lg border border-border/70 bg-neutral-950"
          >
            {token.lang && (
              <figcaption className="border-b border-white/10 px-4 py-2 font-mono text-[11px] tracking-wide text-neutral-400 uppercase">
                {token.lang}
              </figcaption>
            )}
            <pre className="overflow-x-auto p-4 text-xs leading-6 text-neutral-100">
              <code>{token.text ?? ""}</code>
            </pre>
          </figure>
        )
      case "hr":
        return <hr key={key} className="border-border/70" />
      case "html":
        return (
          <pre
            key={key}
            className="overflow-x-auto rounded-lg border border-border/70 bg-muted p-4 font-mono text-xs leading-6 text-muted-foreground"
          >
            <code>{token.raw ?? token.text ?? ""}</code>
          </pre>
        )
      default:
        return (
          <p key={key} className="text-sm leading-7 text-muted-foreground">
            {renderInlineTokens(token.tokens, token.text ?? token.raw, key)}
          </p>
        )
    }
  })
}

export function MarkdownReadingPreview({ markdown }: { markdown: string }) {
  const t = useTranslations("MarkdownPreview")
  const tokens = useMemo(() => {
    try {
      return marked.lexer(markdown) as unknown as MarkdownToken[]
    } catch {
      return null
    }
  }, [markdown])

  if (!markdown.trim()) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/70 p-8 text-center text-sm text-muted-foreground">
        {t("empty")}
      </div>
    )
  }

  if (!tokens) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {t("parseError")}
      </div>
    )
  }

  return (
    <ScrollShell>
      <article className="mx-auto space-y-5 rounded-lg border border-border/70 bg-background px-5 py-6 shadow-[var(--shadow-sm)] lg:px-8 lg:py-7">
        {renderBlockTokens(tokens, "markdown")}
      </article>
    </ScrollShell>
  )
}

function ScrollShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-full min-h-[420px] overflow-auto rounded-lg bg-muted/30 p-3 lg:p-4">
      {children}
    </div>
  )
}
