# 06 · Vercel deployment

[Guide index](./README.md) · [中文](../zh-CN/06-vercel-deployment.md) · [日本語](../ja/06-vercel-deployment.md)

Use the current official Vercel documentation for [Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs),
[environment variables](https://vercel.com/docs/environment-variables),
[domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain) and
[function duration](https://vercel.com/docs/functions/configuring-functions/duration/).

## Import the repository

Import the Git repository in Vercel. Select the **Next.js** preset, keep the
repository root as Root Directory, use `pnpm build`, and leave Output Directory
empty. Do not convert the app to a static export.

## Environment matrix

| Variable                       | Development           | Preview               | Production               |
| ------------------------------ | --------------------- | --------------------- | ------------------------ |
| Supabase URL / publishable key | Test project or unset | Test project or unset | Production project       |
| `SUPABASE_SECRET_KEY`          | Test secret if needed | Prefer unset          | Production server secret |
| Turnstile Site Key             | Test key              | Test key or unset     | Production key           |
| AI proxy allowlist             | Optional              | Optional              | Optional reviewed list   |
| GA4 measurement ID             | Usually unset         | Unset                 | Optional public ID       |

The safe Preview default is local-only mode or a separate Supabase project.
Never expose a production server secret to every branch Preview.

## Deploy and inspect

After the first deployment, use Vercel logs to check route errors and streaming
responses. The current implementation declares these maximum route durations:

| Route            | Duration    |
| ---------------- | ----------- |
| `/api/ai-proxy`  | 300 seconds |
| `/api/fetch-url` | 60 seconds  |

Confirm the selected Vercel plan supports the actual workload and current
platform rules. Test a realistic provider stream, URL fetch and release request
instead of assuming local behavior matches Production.

## Domain handoff

Add the custom domain in Vercel, publish the DNS records Vercel specifies and
wait for SSL to become active. Then update Supabase Site URL, Auth redirect
URLs, Google origins and Turnstile hostnames together. Send fresh test emails
after every domain change; old links and cached redirects can be misleading.

Other platforms, Docker, Cloudflare Workers and Netlify are not currently
implemented or production-validated deployment targets.
