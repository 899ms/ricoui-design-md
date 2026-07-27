# 05 · Authentication, email and CAPTCHA

[Guide index](./README.md) · [中文](../zh-CN/05-auth-email-captcha.md) · [日本語](../ja/05-auth-email-captcha.md)

Complete [Supabase setup](./04-supabase-setup.md) first. Use separate local,
Preview and Production configurations; never give arbitrary Preview deployments
production secrets.

Official references: [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls),
[custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
[Google login](https://supabase.com/docs/guides/auth/social-login/auth-google),
[CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha),
[Resend domains](https://resend.com/docs/dashboard/domains/introduction) and
[Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## URLs and email

In Supabase Auth URL Configuration, set the production **Site URL** and add
exact callback URLs such as:

```text
http://localhost:3000/auth/callback
https://design.example.com/auth/callback
```

Use a testing project for Preview whenever possible. If Preview must use Auth,
allow only controlled preview callback URLs; avoid broad wildcard rules.

Enable Email and confirmation as appropriate. Copy the repository's
`supabase/templates/magic-link.html` and `confirm-signup.html` into the matching
Supabase templates, retaining the source files as the versioned source.

## Production SMTP with Resend

Verify a sending domain in Resend, publish the exact SPF and DKIM records it
provides, then optionally add a DMARC monitoring policy. Configure Supabase
Custom SMTP with host `smtp.resend.com`, port `465`, username `resend`, a
Resend API key as password and a verified sender address. Treat the Resend key
as a secret; it belongs in Supabase Dashboard, not application source or Vercel
environment variables. Set rate limits in Supabase according to your current
provider plan and abuse policy.

## Google OAuth

Create a Google Cloud OAuth **Web application**. Add each application origin
and this Supabase callback URL:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Put Google Client ID and Client Secret in Supabase's Google provider settings,
not in client-side code. Test both a new and an existing account.

## Turnstile

Create a production Turnstile Widget for production hostnames only; do not add
localhost to it. Put its public Site Key in the application:

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<public-site-key>
```

Put the matching Turnstile Secret only in Supabase Auth CAPTCHA settings. Use a
separate test widget and Cloudflare test keys for local/automated testing.
Validate valid, invalid, expired and duplicate tokens before public signup.
