# 01 · Quick start

[Guide index](./README.md) · [中文](../zh-CN/01-quick-start.md) · [日本語](../ja/01-quick-start.md)

## Requirements

Install Git, Node.js 22+ and pnpm. Confirm each command is available:

```bash
git --version
node --version
pnpm --version
```

Use the Node.js version declared by the repository when it changes.

## Install and run

```bash
git clone https://github.com/ricocc/ricoui-design-md.git
cd ricoui-design-md
pnpm install
pnpm dev
```

Open <http://localhost:3000>. The commands work on Windows, macOS and Linux.
If port 3000 is busy, Next.js will normally offer 3001; add that exact origin's
`/auth/callback` later if you enable Supabase Auth.

## Local-only check

Before configuring any service, verify that you can:

- create a blank draft;
- import a `.md` file;
- edit source and open the preview;
- save an item to Library; and
- export `DESIGN.md`.

The browser stores this workspace in IndexedDB. Clearing browser site data
removes it, so export important work as a backup.

## Optional `.env.local`

Copy values from [`.env.example`](../../.env.example) only for capabilities you
enable. Never commit `.env.local`.

```dotenv
# Optional: enables sign-in and private sync
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<public-key>

# Server only: releases and complete account deletion
SUPABASE_SECRET_KEY=sb_secret_<server-secret>
```

Restart `pnpm dev` after changing environment variables.

## Useful commands

| Command          | Purpose                                 |
| ---------------- | --------------------------------------- |
| `pnpm dev`       | Run the development server              |
| `pnpm lint`      | Run ESLint                              |
| `pnpm typecheck` | Check TypeScript without emitting files |
| `pnpm test`      | Run Vitest tests                        |
| `pnpm build`     | Build the production application        |

Run a production build locally with `pnpm build` then `pnpm start`. For setup
failures, address the first real error rather than a final cascading message.

Next: [User tutorial](./02-user-tutorial.md), [AI](./03-ai-configuration.md),
[Supabase](./04-supabase-setup.md) or [Vercel](./06-vercel-deployment.md).
