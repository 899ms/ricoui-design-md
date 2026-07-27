# 09 · Development and contribution

[Guide index](./README.md) · [中文](../zh-CN/09-development.md) · [日本語](../ja/09-development.md)

## Stack and structure

The application uses Next.js App Router, React, TypeScript, next-intl, Zustand,
IndexedDB, Supabase and Vitest. Key areas include `app/` for routes,
`components/` for UI, `lib/` for parsing/export/sync/AI, `messages/` for i18n,
`supabase/migrations/` for cloud schema and `tests/` for focused unit tests.

`rawMarkdown` is canonical. Parsed tokens, preview semantics, JSON and CSS are
derivatives. Preserve unknown Markdown during structured edits, keep local-first
use working and never let AI silently modify source.

## Core flows

- Local editing updates Zustand and persists an IndexedDB workspace snapshot.
- Optional sync maps owner-scoped drafts and Library entries to Supabase; a
  conflict pauses the affected source for an explicit choice.
- AI requests are explicit and use browser-local provider credentials. Source
  revision is applied only after a visible review action.
- Delivery routes validate the synced source/version/hash, build a deterministic
  ZIP server-side and store it in private `design-releases`.

## Development commands

```bash
pnpm dev
pnpm exec eslint <changed-files>
pnpm typecheck
pnpm vitest run tests/<focused-file>.test.ts
pnpm test
pnpm build
```

For a small UI change, run a focused lint/type check and relevant test. Use the
full test/build path for cross-cutting behavior, dependency changes, route or
deployment work. Keep Markdown links valid and run Prettier for changed guides.

## Contribution rules

- Read the root README and the relevant guide before changing current behavior,
  then inspect the implementation and existing tests for that area.
- Do not commit secrets, production data, user API keys, sessions, Magic Links
  or signed URLs.
- Do not make Supabase mandatory for normal authoring, or turn derived artifacts
  into editable sources.
- Do not replace explicit AI review with automatic source edits.
- Add a forward migration for cloud schema changes; do not rewrite applied
  migrations.
- Update both `messages/en.json` and `messages/zh-CN.json` for user-visible
  copy, and update both guide languages when behavior or deployment changes.

Before opening a PR, verify formatting, targeted tests, route behavior and any
affected keyboard/mobile path. The public repository uses the Apache License
2.0; preserve its existing `LICENSE` when preparing a release.
