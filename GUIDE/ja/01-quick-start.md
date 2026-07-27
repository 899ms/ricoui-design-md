# 01 · クイックスタート

[ガイド一覧](./README.md) · [English](../en/01-quick-start.md) · [简体中文](../zh-CN/01-quick-start.md)

## 必要なもの

Git、Node.js 22 以降、pnpm をインストールし、各コマンドが使えることを確認します。

```bash
git --version
node --version
pnpm --version
```

リポジトリで指定される Node.js のバージョンが変更された場合は、そのバージョンを使用してください。

## インストールと起動

```bash
git clone https://github.com/ricocc/ricoui-design-md.git
cd ricoui-design-md
pnpm install
pnpm dev
```

<http://localhost:3000> を開きます。これらのコマンドは Windows、macOS、Linux で使えます。ポート 3000 が使用中の場合、Next.js は通常 3001 を提案します。後で Supabase Auth を有効にする場合は、その正確な origin の `/auth/callback` を追加してください。

## ローカルのみの確認

サービスを設定する前に、次を確認します。

- 空の下書きを作成できる
- `.md` ファイルをインポートできる
- ソースを編集し、プレビューを開ける
- 項目をライブラリに保存できる
- `DESIGN.md` をエクスポートできる

このワークスペースはブラウザの IndexedDB に保存されます。ブラウザのサイトデータを消去すると削除されるため、重要な作業はバックアップとしてエクスポートしてください。

## 任意の `.env.local`

有効にする機能に限って、[`.env.example`](../../.env.example) の値をコピーします。`.env.local` は絶対にコミットしないでください。

```dotenv
# 任意: サインインと非公開同期を有効にする
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<public-key>

# サーバー専用: 納品版とアカウント完全削除
SUPABASE_SECRET_KEY=sb_secret_<server-secret>
```

環境変数を変更した後は `pnpm dev` を再起動します。

## 便利なコマンド

| コマンド         | 用途                                         |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | 開発サーバーを起動する                       |
| `pnpm lint`      | ESLint を実行する                            |
| `pnpm typecheck` | ファイルを出力せず TypeScript をチェックする |
| `pnpm test`      | Vitest テストを実行する                      |
| `pnpm build`     | 本番アプリケーションをビルドする             |

ローカルで本番ビルドを確認するには、`pnpm build` の後に `pnpm start` を実行します。セットアップが失敗した場合は、最後の連鎖的なメッセージではなく、最初の実際のエラーを解決してください。

次へ: [利用チュートリアル](./02-user-tutorial.md)、[AI](./03-ai-configuration.md)、[Supabase](./04-supabase-setup.md)、[Vercel](./06-vercel-deployment.md)。
