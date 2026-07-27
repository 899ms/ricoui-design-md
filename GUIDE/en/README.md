# RICOUI DESIGN: Open-Source Use and Deployment Guide

[简体中文](../zh-CN/README.md) · [日本語](../ja/README.md) · [Guide language selector](../README.md)

RICOUI DESIGN is a local-first authoring workspace for `DESIGN.md` design
systems. These guides are for users, self-hosting maintainers and contributors.
The implementation is Beta: production authentication, capacity controls and
deployment acceptance must be performed by each maintainer.

## Project links

| Resource               | Address                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| Website                | <https://design.ricoui.com/>                                                     |
| Open-source repository | [github.com/ricocc/ricoui-design-md](https://github.com/ricocc/ricoui-design-md) |
| Repository name        | `ricoui-design-md`                                                               |

## Choose a capability level

| Mode          | What you configure                        | What you get                                          |
| ------------- | ----------------------------------------- | ----------------------------------------------------- |
| Local only    | Nothing                                   | Authoring, Library, Brands, preview and local exports |
| Local + AI    | Your browser-local provider profile       | Website generation and AI Assistant                   |
| Personal sync | Supabase URL and publishable key          | Sign-in and cross-device private workspace            |
| Full cloud    | Supabase server secret, email and CAPTCHA | Delivery ZIPs, account deletion and public signup     |
| Analytics     | Optional GA4 Measurement ID               | Website analytics                                     |

## Recommended order

1. Follow [Quick start](./01-quick-start.md) and verify local-only use.
2. Configure [AI](./03-ai-configuration.md) only if you need it.
3. Configure [Supabase](./04-supabase-setup.md) before enabling sign-in.
4. Configure [email, Google OAuth and CAPTCHA](./05-auth-email-captcha.md).
5. Deploy with [Vercel](./06-vercel-deployment.md).
6. Complete [operations](./07-operations-security.md) and the real-account
   [acceptance checklist](./08-troubleshooting-and-acceptance.md).

## Fastest local start

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. Do not create `.env.local` yet: local use works
without it.

## Guide map

| Guide                                                                       | Use it for                                  |
| --------------------------------------------------------------------------- | ------------------------------------------- |
| [01 Quick start](./01-quick-start.md)                                       | Tooling, commands and first local check     |
| [02 User tutorial](./02-user-tutorial.md)                                   | First document through exports and releases |
| [03 AI configuration](./03-ai-configuration.md)                             | Providers, direct/proxy traffic and privacy |
| [04 Supabase setup](./04-supabase-setup.md)                                 | Migrations, keys, RLS, Storage and quotas   |
| [05 Auth, email and CAPTCHA](./05-auth-email-captcha.md)                    | Redirect URLs, SMTP, Google and Turnstile   |
| [06 Vercel deployment](./06-vercel-deployment.md)                           | Environments, domains and runtime limits    |
| [07 Operations and security](./07-operations-security.md)                   | Secrets, backups, capacity and deletion     |
| [08 Troubleshooting and acceptance](./08-troubleshooting-and-acceptance.md) | Fault isolation and production validation   |
| [09 Development and contribution](./09-development.md)                      | Architecture, tests and contribution rules  |

## Environment variables

| Variable                         | Needed for                    | Browser-visible? |
| -------------------------------- | ----------------------------- | ---------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Auth and sync                 | Yes              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Auth and sync                 | Yes              |
| `SUPABASE_SECRET_KEY`            | Releases and account deletion | No               |
| `SUPABASE_SERVICE_ROLE_KEY`      | Legacy server-secret fallback | No               |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public CAPTCHA                | Yes              |
| `NEXT_PUBLIC_AI_ENABLED`         | Optional global AI switch     | Yes              |
| `AI_PROXY_ALLOWED_HOSTS`         | Optional AI proxy allowlist   | No               |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`  | Optional GA4                  | Yes              |

See [`.env.example`](../../.env.example) for commented examples. Provider plans,
dashboards and limits can change; always use current official dashboards.
