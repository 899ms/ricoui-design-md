# 04 · Supabase 設定

[ガイド一覧](./README.md) · [English](../en/04-supabase-setup.md) · [简体中文](../zh-CN/04-supabase-setup.md)

[公式のマイグレーション手順](https://supabase.com/docs/guides/deployment/database-migrations)に従ってください。既存データを明示的に確認済みでない限り、新しいプロジェクトを使用します。

## スキーマを適用する

Supabase CLI をインストールして認証し、プロジェクトをリンクします。

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

代わりに、SQL Editor で次のファイルをこの順番どおりに実行できます。

1. `0001_v13_cloud_baseline.sql`
2. `0002_v15_workspace_separation_limits.sql`
3. `0003_v15_workspace_revision.sql`

想定どおりのテーブル、関数、トリガー、RLS ポリシーを確認してください。RLS を無効にしたり、ブラウザから Storage の読み取り／書き込み／一覧／削除を許可するポリシーを追加したりしないでください。

## Storage とキー

マイグレーションは非公開バケット `design-releases` を作成します。このバケットは ZIP のみを受け付け、1 オブジェクトを 2 MiB に制限します。ブラウザはこのバケットへ直接アクセスしません。サーバールートが所有者を確認した署名付きダウンロード URL を作成します。

Supabase の **Connect / API Keys** で、次を取得します。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<public-key>
SUPABASE_SECRET_KEY=sb_secret_<server-secret>
```

URL と publishable key は公開クライアント設定です。サーバーシークレットはサーバー側の `.env.local` またはデプロイ環境変数だけに置いてください。旧 `SUPABASE_SERVICE_ROLE_KEY` はフォールバックとしてのみ受け入れられます。

## 機能動作を確認する

アプリを再起動し、アカウント入口を開いてテストアカウントでサインインします。下書き、ライブラリ項目、使用量がそのアカウントだけに表示されることを確認してください。公開利用の前に、[受け入れ](./08-troubleshooting-and-acceptance.md)で説明する 2 アカウント・2 デバイスのテストを行います。

## 容量上限と制御

| リソース                                       | 上限                        |
| ---------------------------------------------- | --------------------------- |
| クラウド下書き                                 | 75                          |
| ライブラリ項目                                 | 50                          |
| Markdown ソース 1 件                           | 250 KiB                     |
| アカウントの Markdown                          | 1 MiB                       |
| リリース ZIP 1 件／非圧縮コンテンツ            | 2 MiB / 4 MiB               |
| アカウントのリリース Storage／完了済みリリース | 5 MiB / 100                 |
| ソースごとの保持バージョン                     | 新しい完了済み 2 バージョン |

`cloud_controls` テーブルは、クラウド使用量を追加する書き込みを一時停止できます。個人の上限に達した場合でも、読み取り、ダウンロード、削除、ローカル編集は利用可能なままにする必要があります。
