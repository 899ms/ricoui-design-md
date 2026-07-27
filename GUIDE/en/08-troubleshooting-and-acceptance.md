# 08 · Troubleshooting and acceptance

[Guide index](./README.md) · [中文](../zh-CN/08-troubleshooting-and-acceptance.md) · [日本語](../ja/08-troubleshooting-and-acceptance.md)

Use this table to diagnose before changing data or relaxing security controls.

| Symptom                         | Check                                                  | Safe response                                              |
| ------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| Install or build fails          | Node/pnpm versions and first real terminal error       | Reinstall dependencies only after reviewing lockfile state |
| Sign-in entry is absent         | Both public Supabase variables                         | Add the pair and restart/redeploy                          |
| Magic Link returns to localhost | Site URL, redirect URL and email template              | Correct exact production callback and send a new link      |
| Google rejects sign-in          | Google origins and Supabase callback                   | Use the Supabase callback, not an app callback             |
| Email is missing or spammed     | Resend verified domain, SPF/DKIM/DMARC and rate limits | Publish provider-generated DNS records and retest          |
| CAPTCHA rejects every request   | Matching Site Key and Supabase Secret                  | Use matching environment-specific widgets                  |
| Another account sees data       | RLS, owner IDs and stale account cache                 | Stop rollout and test owner isolation before continuing    |
| Private Storage URL is 403      | Bucket privacy                                         | Expected: use owner-checked signed download route          |
| Cloud quota is full             | Account usage and release cleanup                      | Delete own unused data; local edits remain available       |
| AI proxy fails                  | API key, model, allowlist and provider status          | Retry, change model or update reviewed hostname list       |
| Website fetch fails             | Public HTTPS address and DNS result                    | Do not bypass localhost/private-network protection         |
| Vercel request ends early       | Function logs, duration and plan                       | Keep URL fetch within 60s and AI within 300s               |

## Production acceptance

### A. Local-only

- Create, import, edit, preview and export without `.env.local`.
- Refresh and reopen a document; verify IndexedDB recovery.

### B. AI

- Verify one configured provider, a rejected private/localhost target and a
  review-before-apply source change.
- Verify provider errors expose no key or document content.

### C. Two accounts and two devices

- Account A cannot read, alter, download or delete Account B data.
- First cloud entry copies only selected local items with new IDs.
- Offline edit and reconnect work; a concurrent source pauses for explicit
  local/cloud/save-as-new resolution without leaking another account cache.

### D. Delivery versions

- A synced, derivable source creates an immutable ZIP.
- A third successful release keeps only the newest two for that source.
- Failure retains completed releases; another account cannot access them.
- Restore creates a new draft and signed downloads expire as expected.

### E. Auth, deletion and mobile

- Test valid, invalid, expired and repeated CAPTCHA tokens.
- Test Magic Link, confirmation and Google callback at the production domain.
- Confirm deletion clears app data, private objects, Auth user and device cache,
  with safe retry after partial failure.
- On a real phone, test new draft, source edit, refresh recovery, export and
  email return without keyboard or safe-area obstruction.

Record date, commit SHA, deployment URL, migration version, test accounts and
results. Do not record secrets, session tokens or signed URLs.
