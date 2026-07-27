# 07 · Operations and security

[Guide index](./README.md) · [中文](../zh-CN/07-operations-security.md) · [日本語](../ja/07-operations-security.md)

## Data boundaries

| Location          | Stores                                                                        | Does not store              |
| ----------------- | ----------------------------------------------------------------------------- | --------------------------- |
| IndexedDB         | Local workspace, account cache, sync queue, preferences and local AI profiles | Durable cloud backup        |
| Supabase Postgres | Cloud Markdown, metadata, usage, release metadata and tombstones              | AI API keys and ZIP bytes   |
| Supabase Storage  | Server-generated private delivery ZIPs                                        | Arbitrary user uploads      |
| Vercel            | Request-time application execution                                            | Persistent document storage |

## Secrets and logs

Public configuration includes Supabase URL/publishable key, Turnstile Site Key
and GA4 Measurement ID. Keep Supabase server secret, service-role fallback,
SMTP credentials, Google secret, Resend key, session tokens, Magic Links and
signed URLs confidential. Do not place them in source, issues, screenshots,
analytics, logs or untrusted Preview environments.

Rotate a suspected credential at its provider first, update only the appropriate
environment scope, redeploy, verify a real flow and revoke the old value.

## Capacity and controls

Check Supabase database/storage use, email delivery and Auth logs every week.
Treat 70% of provider capacity as investigation time, 80% as a warning and 85%
as a reason to stop new usage through `cloud_controls` until capacity is restored.
Do not delete user data merely to avoid an upstream limit.

## Backup and recovery

Users should export `DESIGN.md` and required derivative files. Maintainers must
back up Postgres and private `design-releases` objects with matching metadata.
During recovery restore database structure/data first, then objects, verify RLS
and ownership, and finally test signed download, sync and new release creation
with test accounts. A successful SQL import alone is not a recovery acceptance.

Deleting an account must remove application data, private release objects and
the Auth user; partial failure must remain retryable. Delivery releases retain
the newest two completed versions per source and are not public sharing links.

## Beta and open-source boundary

Free plans, Beta cloud behavior, backups and service availability have no
implied SLA. The public repository uses the Apache License 2.0. Preserve its
existing `LICENSE` and sanitize deployment-specific material before release.
