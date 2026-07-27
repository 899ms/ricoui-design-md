# 05 · 認証・メール・CAPTCHA

[ガイド一覧](./README.md) · [English](../en/05-auth-email-captcha.md) · [简体中文](../zh-CN/05-auth-email-captcha.md)

まず [Supabase 設定](./04-supabase-setup.md)を完了してください。ローカル、Preview、本番は別々に設定します。任意の Preview デプロイメントに本番シークレットを渡してはいけません。

公式リファレンス: [リダイレクト URL](https://supabase.com/docs/guides/auth/redirect-urls)、[カスタム SMTP](https://supabase.com/docs/guides/auth/auth-smtp)、[Google ログイン](https://supabase.com/docs/guides/auth/social-login/auth-google)、[CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)、[Resend ドメイン](https://resend.com/docs/dashboard/domains/introduction)、[Turnstile テスト](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)。

## URL とメール

Supabase Auth URL Configuration で、本番の **Site URL** を設定し、次のような完全一致の callback URL を追加します。

```text
http://localhost:3000/auth/callback
https://design.example.com/auth/callback
```

可能な限り Preview にはテストプロジェクトを使用します。Preview で Auth を使う必要がある場合は、管理下にある Preview callback URL だけを許可し、広すぎるワイルドカードルールを避けます。

必要に応じて Email と確認を有効にします。リポジトリの `supabase/templates/magic-link.html` と `confirm-signup.html` を対応する Supabase テンプレートにコピーし、元ファイルはバージョン管理されたソースとして保持してください。

## Resend による本番 SMTP

Resend で送信ドメインを検証し、提供された SPF と DKIM レコードを正確に公開した後、必要なら DMARC 監視ポリシーを追加します。Supabase Custom SMTP は、ホスト `smtp.resend.com`、ポート `465`、ユーザー名 `resend`、パスワードに Resend API キー、検証済み送信元アドレスで設定します。Resend キーはシークレットとして扱い、アプリケーションソースや Vercel 環境変数ではなく Supabase Dashboard に置きます。現在のプロバイダープランと不正利用ポリシーに合わせて、Supabase でレート制限を設定してください。

## Google OAuth

Google Cloud OAuth の **Web application** を作成します。各アプリケーション origin と、次の Supabase callback URL を追加します。

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Google Client ID と Client Secret は、クライアント側コードではなく Supabase の Google プロバイダー設定に置きます。新規と既存の両方のアカウントをテストしてください。

## Turnstile

本番ホスト名だけに対応する本番 Turnstile Widget を作成します。localhost は追加しません。公開 Site Key はアプリケーションに設定します。

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<public-site-key>
```

対応する Turnstile Secret は Supabase Auth CAPTCHA 設定にのみ置きます。ローカル／自動テストには別のテスト Widget と Cloudflare テストキーを使用します。公開サインアップの前に、有効、無効、期限切れ、重複したトークンを検証してください。
