# 04 · Supabase setup

[Guide index](./README.md) · [中文](../zh-CN/04-supabase-setup.md) · [日本語](../ja/04-supabase-setup.md)

Follow the [official migration workflow](https://supabase.com/docs/guides/deployment/database-migrations).
Use a new project unless you have explicitly reviewed existing data.

## Apply the schema

Install and authenticate the Supabase CLI, then link the project:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

Alternatively, execute the files in SQL Editor in this exact order:

1. `0001_v13_cloud_baseline.sql`
2. `0002_v15_workspace_separation_limits.sql`
3. `0003_v15_workspace_revision.sql`

Verify the expected tables, functions, triggers and RLS policies. Do not disable
RLS or add browser Storage read/write/list/delete policies.

## Storage and keys

The migration creates private bucket `design-releases`, accepts ZIP only and
limits a single object to 2 MiB. The browser does not access this bucket
directly; server routes create owner-checked signed download URLs.

In Supabase **Connect / API Keys**, obtain:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<public-key>
SUPABASE_SECRET_KEY=sb_secret_<server-secret>
```

The URL and publishable key are public client configuration. The server secret
must stay only in server-side `.env.local` or deployment variables. A legacy
`SUPABASE_SERVICE_ROLE_KEY` is accepted only as a fallback.

## Verify functional behavior

Restart the app, open the account entry, sign in with a test account and verify
that drafts, Library items and usage appear only in that account. Before public
use, test two accounts and two devices as described in [acceptance](./08-troubleshooting-and-acceptance.md).

## Quotas and controls

| Resource                                     | Limit                       |
| -------------------------------------------- | --------------------------- |
| Cloud drafts                                 | 75                          |
| Library entries                              | 50                          |
| One Markdown source                          | 250 KiB                     |
| Account Markdown                             | 1 MiB                       |
| One release ZIP / uncompressed content       | 2 MiB / 4 MiB               |
| Account release storage / completed releases | 5 MiB / 100                 |
| Versions retained per source                 | 2 newest completed versions |

The `cloud_controls` table can pause writes that add cloud usage. Reads,
downloads, deletion and local editing should remain available when a personal
quota is full.
