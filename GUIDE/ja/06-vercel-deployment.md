# 06 · Vercel デプロイ

[ガイド一覧](./README.md) · [English](../en/06-vercel-deployment.md) · [简体中文](../zh-CN/06-vercel-deployment.md)

[Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)、[環境変数](https://vercel.com/docs/environment-variables)、[ドメイン](https://vercel.com/docs/domains/working-with-domains/add-a-domain)、[関数の実行時間](https://vercel.com/docs/functions/configuring-functions/duration)については、最新の Vercel 公式ドキュメントを使用してください。

## リポジトリをインポートする

Vercel に Git リポジトリをインポートします。**Next.js** プリセットを選び、リポジトリルートを Root Directory のままにし、`pnpm build` を使い、Output Directory は空欄にします。アプリを静的エクスポートへ変換しないでください。

## 環境マトリクス

| 変数                           | Development                    | Preview                        | Production               |
| ------------------------------ | ------------------------------ | ------------------------------ | ------------------------ |
| Supabase URL / publishable key | テストプロジェクトまたは未設定 | テストプロジェクトまたは未設定 | 本番プロジェクト         |
| `SUPABASE_SECRET_KEY`          | 必要ならテスト用シークレット   | 未設定を推奨                   | 本番サーバーシークレット |
| Turnstile Site Key             | テストキー                     | テストキーまたは未設定         | 本番キー                 |
| AI プロキシ許可リスト          | 任意                           | 任意                           | 確認済みの任意リスト     |
| GA4 measurement ID             | 通常は未設定                   | 未設定                         | 任意の公開 ID            |

安全な Preview の既定は、ローカルのみモードまたは別の Supabase プロジェクトです。すべてのブランチ Preview に本番サーバーシークレットを公開してはいけません。

## デプロイと確認

初回デプロイ後は、Vercel ログでルートエラーとストリーミング応答を確認します。現在の実装は次の最大ルート実行時間を宣言しています。

| ルート           | 実行時間 |
| ---------------- | -------- |
| `/api/ai-proxy`  | 300 秒   |
| `/api/fetch-url` | 60 秒    |

選択した Vercel プランが実際の負荷と現在のプラットフォームルールをサポートすることを確認してください。ローカルの動作が本番と同じだと仮定せず、実際のプロバイダーストリーム、URL 取得、リリースリクエストをテストします。

## ドメイン移行

Vercel にカスタムドメインを追加し、Vercel が示す DNS レコードを公開して、SSL が有効になるまで待ちます。その後、Supabase Site URL、Auth redirect URL、Google origin、Turnstile hostname をまとめて更新します。ドメイン変更のたびに新しいテストメールを送ってください。古いリンクとキャッシュ済みリダイレクトは誤解を招く場合があります。

他のプラットフォーム、Docker、Cloudflare Workers、Netlify は、現在実装済みまたは本番検証済みのデプロイ先ではありません。
