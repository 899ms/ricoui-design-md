# 02 · User tutorial

[Guide index](./README.md) · [中文](../zh-CN/02-user-tutorial.md) · [日本語](../ja/02-user-tutorial.md)

## The document model

`DESIGN.md` is the canonical source. Structured controls and previews derive
from it; `tokens.json`, CSS and ZIP files are generated outputs, not separate
sources. Local drafts and signed-in cloud workspaces are intentionally separate.

## Create your first document

You need a running local application. Select **New draft**, then edit source
with this minimal shape:

```md
# Acme — Design System

> A concise visual language for product surfaces.

**Theme:** light

## Tokens — Colors

| Name  | Value   | Token         | Role            |
| ----- | ------- | ------------- | --------------- |
| Brand | #2563EB | --color-brand | Primary actions |

## Tokens — Typography

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token            |
| ---- | ---- | ----------- | -------------- | ---------------- |
| Body | 16px | 1.5         | 0              | --font-size-body |

## Components

### Button

**Role:** Main action control.
```

Success: source, reading and preview views all show useful content. If a
structured field is unavailable, keep editing source until its heading/table is
recognized.

## Import and edit views

Import one or more `.md` files; each file is limited to 500 KiB. The four views
serve different purposes:

| View       | Purpose                                                |
| ---------- | ------------------------------------------------------ |
| Source     | Canonical Markdown; safest place for arbitrary prose   |
| Reading    | Rendered Markdown review                               |
| Structured | Controls for recognized, modeled sections only         |
| Preview    | A visual interpretation of recognized design semantics |

Unknown source content is retained. Do not edit generated JSON or CSS as an
alternative source.

## Generate from a website and use AI

Configure a provider first in [AI configuration](./03-ai-configuration.md).
Paste a public HTTPS URL, explicitly start generation, then review the new
draft. The application rejects localhost, private networks and URLs containing
credentials. A website draft is an analytical starting point, not permission to
copy a brand or an assertion that inferred values are exact.

The AI Assistant sends a document only after you explicitly request analysis,
repair, normalization or an edit. Review the full diff and apply it explicitly;
an AI response never silently overwrites source.

## Library, Brands and search

Save reusable drafts to Library with a name, description, optional project URL,
tags and category. Library preserves any non-empty Markdown; structured preview
and derived exports become available only when the document meets their own
requirements. Brands are read-only reference material; creating a draft from a
Brand never edits the original.

Built-in Brand references are based on [getdesign.md](https://getdesign.md/)
and [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md),
then secondarily parsed for this application's `DESIGN.md` workflow. Use them
for learning and analysis; they do not imply ownership of the source material
or that every derived value was confirmed by the original brand.

Use search, tags, categories and multi-select deletion to manage your own
drafts and Library entries. Review selection before batch deletion.

## Export and delivery versions

Always export `DESIGN.md`. When derivation checks pass, you can also export
DTCG JSON, CSS variables, Tailwind CSS and a local ZIP. A delivery version is
different: it is a server-created immutable private ZIP from a synced source.

To create a delivery version you need a signed-in, synced account, a derivable
document and the server secret configured by the deployment owner. Its ZIP is
limited to 2 MiB (4 MiB uncompressed); each source retains the newest two
completed versions. Download links are owner-checked and valid for 60 seconds.

## Sync, conflicts and backup

On first sign-in, choose which local items to copy; copied items receive new
IDs. Offline edits remain in the device cache and later queue for sync. If the
same source changes on another device, only that source pauses: compare and
choose local overwrite, cloud version or save as a new draft. The application
does not silently choose a conflict winner.

Export source regularly. Sign-out tries to synchronize first, then restores the
independent signed-out local workspace. See [troubleshooting](./08-troubleshooting-and-acceptance.md)
for safe recovery steps.
