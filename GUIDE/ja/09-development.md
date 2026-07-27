# 09 · 開発と貢献

[ガイド一覧](./README.md) · [English](../en/09-development.md) · [简体中文](../zh-CN/09-development.md)

## スタックと構成

アプリケーションは Next.js App Router、React、TypeScript、next-intl、Zustand、IndexedDB、Supabase、Vitest を使用しています。主要な領域は、ルートの `app/`、UI の `components/`、解析／エクスポート／同期／AI の `lib/`、i18n の `messages/`、クラウドスキーマの `supabase/migrations/`、対象を絞ったユニットテストの `tests/` です。

`rawMarkdown` が正本です。解析済みトークン、プレビューの意味論、JSON、CSS は派生物です。構造化編集では未知の Markdown を保持し、ローカルファーストの利用を維持し、AI がソースを黙って変更しないようにしてください。

## コアフロー

- ローカル編集は Zustand を更新し、IndexedDB のワークスペーススナップショットを永続化します。
- 任意の同期では、所有者スコープの下書きとライブラリ項目を Supabase に対応付けます。競合時は対象ソースを止め、明示的な選択を待ちます。
- AI リクエストは明示的で、ブラウザ内のプロバイダー認証情報を使用します。ソース改訂は可視のレビュー操作後にのみ適用されます。
- 納品ルートは同期済みのソース／バージョン／ハッシュを検証し、決定論的な ZIP をサーバー側で構築して、非公開 `design-releases` に保存します。

## 開発コマンド

```bash
pnpm dev
pnpm exec eslint <changed-files>
pnpm typecheck
pnpm vitest run tests/<focused-file>.test.ts
pnpm test
pnpm build
```

小さな UI 変更では、対象を絞った lint／型チェックと関連テストを実行します。横断的な動作、依存関係変更、ルートやデプロイの作業では、完全な test／build 経路を使います。Markdown リンクを有効に保ち、変更したガイドには Prettier を実行してください。

## 貢献ルール

- 現在の挙動を変更する前に、ルートの README と関連ガイドを読み、対象領域の実装と既存テストを確認します。
- シークレット、本番データ、ユーザー API キー、セッション、Magic Link、署名付き URL をコミットしません。
- 通常の編集に Supabase を必須にしたり、派生物を編集可能なソースにしたりしません。
- 明示的な AI レビューを自動ソース編集に置き換えません。
- クラウドスキーマの変更には前方マイグレーションを追加し、適用済みマイグレーションを書き換えません。
- ユーザーに見えるコピーでは `messages/en.json` と `messages/zh-CN.json` の両方を更新し、挙動やデプロイを変更した場合はガイドの各言語も更新します。

PR を開く前に、フォーマット、対象テスト、ルート動作、影響するキーボード／モバイル経路を確認してください。公開リポジトリは Apache License 2.0 を使用するため、リリース準備時に既存の `LICENSE` を保持してください。
