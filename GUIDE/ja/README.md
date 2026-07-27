# RICOUI DESIGN：オープンソースの利用・デプロイガイド

[English](../en/README.md) · [简体中文](../zh-CN/README.md) · [ガイドの言語を選ぶ](../README.md)

RICOUI DESIGN は、`DESIGN.md` デザインシステムのためのローカルファーストな編集ワークスペースです。このガイドは、利用者、セルフホストする管理者、コントリビューターを対象にしています。実装は Beta 段階です。本番の認証、容量管理、デプロイ受け入れテストは、各管理者が実施してください。

## プロジェクトリンク

| リソース                 | URL                                                                              |
| ------------------------ | -------------------------------------------------------------------------------- |
| Web サイト               | <https://design.ricoui.com/>                                                     |
| オープンソースリポジトリ | [github.com/ricocc/ricoui-design-md](https://github.com/ricocc/ricoui-design-md) |
| リポジトリ名             | `ricoui-design-md`                                                               |

## 必要な機能レベルを選ぶ

| モード        | 設定するもの                                   | 利用できること                                             |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| ローカルのみ  | なし                                           | 編集、ライブラリ、Brands、プレビュー、ローカルエクスポート |
| ローカル + AI | ブラウザ内のプロバイダープロファイル           | Web サイトからの生成、AI Assistant                         |
| 個人同期      | Supabase URL と publishable key                | サインイン、デバイス間の非公開ワークスペース               |
| フルクラウド  | Supabase サーバーシークレット、メール、CAPTCHA | 納品 ZIP、アカウント削除、公開サインアップ                 |
| 分析          | 任意の GA4 Measurement ID                      | Web サイト分析                                             |

## 推奨する順序

1. [クイックスタート](./01-quick-start.md) を実行し、ローカルのみで利用できることを確認します。
2. 必要な場合だけ [AI](./03-ai-configuration.md) を設定します。
3. サインインを有効にする前に [Supabase](./04-supabase-setup.md) を設定します。
4. [メール、Google OAuth、CAPTCHA](./05-auth-email-captcha.md) を設定します。
5. [Vercel](./06-vercel-deployment.md) にデプロイします。
6. [運用](./07-operations-security.md) と、実アカウントによる[受け入れチェックリスト](./08-troubleshooting-and-acceptance.md)を完了します。

## 最短のローカル起動

```bash
pnpm install
pnpm dev
```

<http://localhost:3000> を開きます。まだ `.env.local` は作成しないでください。ローカル利用には不要です。

## ガイド一覧

| ガイド                                                                        | 用途                                           |
| ----------------------------------------------------------------------------- | ---------------------------------------------- |
| [01 クイックスタート](./01-quick-start.md)                                    | ツール、コマンド、最初のローカル確認           |
| [02 利用チュートリアル](./02-user-tutorial.md)                                | 最初のドキュメントからエクスポート、納品版まで |
| [03 AI 設定](./03-ai-configuration.md)                                        | プロバイダー、直接通信／プロキシ、プライバシー |
| [04 Supabase 設定](./04-supabase-setup.md)                                    | マイグレーション、キー、RLS、Storage、容量上限 |
| [05 認証・メール・CAPTCHA](./05-auth-email-captcha.md)                        | リダイレクト URL、SMTP、Google、Turnstile      |
| [06 Vercel デプロイ](./06-vercel-deployment.md)                               | 環境、ドメイン、ランタイム制限                 |
| [07 運用とセキュリティ](./07-operations-security.md)                          | シークレット、バックアップ、容量、削除         |
| [08 トラブルシューティングと受け入れ](./08-troubleshooting-and-acceptance.md) | 障害の切り分け、本番検証                       |
| [09 開発と貢献](./09-development.md)                                          | アーキテクチャ、テスト、貢献ルール             |

## 環境変数

| 変数                             | 必要になる機能                         | ブラウザから見えるか |
| -------------------------------- | -------------------------------------- | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | 認証と同期                             | はい                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | 認証と同期                             | はい                 |
| `SUPABASE_SECRET_KEY`            | 納品版とアカウント完全削除             | いいえ               |
| `SUPABASE_SERVICE_ROLE_KEY`      | 旧サーバーシークレットのフォールバック | いいえ               |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 公開 CAPTCHA                           | はい                 |
| `NEXT_PUBLIC_AI_ENABLED`         | 任意のグローバル AI スイッチ           | はい                 |
| `AI_PROXY_ALLOWED_HOSTS`         | 任意の AI プロキシ許可リスト           | いいえ               |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`  | 任意の GA4                             | はい                 |

コメント付きの例は [`.env.example`](../../.env.example) を参照してください。プロバイダーのプラン、ダッシュボード、制限は変わる可能性があるため、必ず最新の公式ダッシュボードを確認してください。
