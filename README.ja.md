# RICOUI DESIGN

[English README](./README.md) · [简体中文](./README.zh-CN.md)

<img src="./docs/screenshot/preview.jpeg" alt="RICOUI DESIGN 预览视图" width="100%" style="max-width:750px;height:auto;">

RICOUI DESIGN は、`DESIGN.md` を中心に据えたローカルファーストのデザインシステム ワークスペースです。読みやすくバージョン管理できる Markdown 文書を唯一の正本として、デザイナーと開発者が再利用可能なデザイン仕様を作成、編集、確認、プレビュー、整理、提供 できるようにします。

アカウントなしでブラウザ上のローカル作業を完結できます。Supabase のサインインと同期、非公開の納品バージョン、ユーザー自身が設定する AI プロバイダー、Google OAuth、CAPTCHA、
GA4 はすべて任意です。デプロイに必要なものだけを段階的に有効化できます。

## 対象ユーザー

- 色、書体、余白、コンポーネント、実装上の制約を保守しやすい `DESIGN.md` に整理したい
  デザイナーとフロントエンド開発者。
- 一つの仕様から DTCG トークン、CSS、Tailwind テーマを安定して出力したい個人や小規模チーム。
- ローカルファーストを保ちながら、自分のインスタンスにデバイス間の非公開同期を設定したい管理者。
- `DESIGN.md` のワークフローを学び、拡張し、貢献したいオープンソースのコントリビューター。

現在は Beta です。クラウド機能は、デプロイ担当者が実際の Supabase と Vercel で受け入れ
確認を完了する必要があります。恒久的なバックアップや正式な SLA サービスではありません。

## プロジェクト情報

| 項目                     | アドレス                                                                         |
| ------------------------ | -------------------------------------------------------------------------------- |
| Web サイト               | <https://design.ricoui.com/>                                                     |
| オープンソースリポジトリ | [github.com/ricocc/ricoui-design-md](https://github.com/ricocc/ricoui-design-md) |
| リポジトリ名             | `ricoui-design-md`                                                               |

## スクリーンショット

<p align="center">
  <img src="./docs/screenshot/index-dark.jpg" alt="RICOUI DESIGN のダークモードのホーム画面" width="49%">
    <img src="./docs/screenshot/editor.jpg" alt="RICOUI DESIGN のエディター" width="49%">
</p>

<p align="center">
  <img src="./docs/screenshot/brand.jpg" alt="RICOUI DESIGN のブランド参照詳細" width="49%">
  <img src="./docs/screenshot/brands.jpg" alt="RICOUI DESIGN のブランド参照ライブラリ" width="49%">
</p>

## 主な機能

### 作成、インポート、プレビュー

- 空の下書きを作成するか、複数の `.md` ファイルを一度にインポートできます。インポートする
  ファイルの上限は 1 件あたり 500 KiB です。
- ソース、閲覧、構造化、プレビューの各表示を切り替えられます。ソースが唯一の正本であり、
  未知の Markdown も保持されます。
- 認識済みのトークンを構造化コントロールで編集し、プレビューで色、組版、レイアウト、
  コンポーネントの意味を確認できます。
- ローカルの下書きはブラウザの IndexedDB に自動保存され、再読み込み後も復元できます。
  サイトデータを消去する前にバックアップをエクスポートしてください。

### 文書を奪わない AI 支援

- 自分で設定した OpenAI 互換プロバイダーと API キーを使用し、公開 HTTPS サイトから
  確認可能な `DESIGN.md` の下書きを生成できます。
- AI Assistant に、デザイン仕様の説明、確認、修復、正規化、変換を依頼できます。
- ソースを変更する可能性がある AI リクエストでは、まず完全な差分が表示されます。ユーザーが
  明示的に修正を適用するまで、AI が `DESIGN.md` を黙って上書きすることはありません。
- プロバイダープロファイルと API キーは現在のブラウザ内にのみ保存され、Supabase と同期
  されたり、本アプリケーションに預けられたりすることはありません。

### ライブラリ、ブランド参照、納品

- 完成度の高い仕様を個人ライブラリに保存し、説明、プロジェクト URL、タグ、カテゴリを付けて
  管理できます。検索や一括管理も利用できます。
- 読み取り専用のブランド参照を閲覧し、自分の下書きへコピーして編集を続けられます。ブランド
  資料は学習・分析目的の参照です。
- 同じ `DESIGN.md` のリビジョンから Markdown、DTCG `tokens.json`、CSS 変数、Tailwind
  `theme.css`、ローカル結合 ZIP を出力できます。
- サインインして同期を完了すると、サーバー上で決定的な非公開納品 ZIP を作成できます。各
  ソースでは最新の完了済み 2 バージョンを保持し、`/releases` からダウンロード、削除、
  または新しい下書きとして復元できます。公開共有リンクは作成されません。

### ブランド参照の出典

内蔵ブランドライブラリの資料は [getdesign.md](https://getdesign.md/) と
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) に由来し、
RICOUI がアプリ内 `DESIGN.md` ワークフロー向けに二次解析しています。これらは常に
読み取り専用の学習・分析資料です。本プロジェクトは元の資料の所有権を主張せず、二次的に
得られたすべての値が元ブランドにより確認済みであることも主張しません。

### 任意の非公開同期

- Supabase Magic Link または Google でサインインすると、サインアウト時のローカル
  ワークスペースから分離された個人クラウドワークスペースに切り替わります。
- 初回サインイン時には、どのローカル下書きとライブラリ項目をクラウドにコピーするかを選択
  します。コピーした項目には新しい ID が付与され、自動マージは行われません。
- オフライン編集は、まずアカウントごとに分離されたデバイスキャッシュに保存され、接続が
  復帰すると同期キューに入ります。
- 2 台のデバイスが同じソースを変更した場合も、停止するのはそのソースだけです。ローカルを
  優先する、クラウド版を読み込む、新しい下書きとして保存する、のいずれかを選べます。

## クイックスタート

Git、Node.js 22 以降、pnpm が必要です。

```bash
git clone https://github.com/ricocc/ricoui-design-md.git
cd ricoui-design-md
pnpm install
pnpm dev
```

<http://localhost:3000> を開いてください。環境変数を設定しなくても、作成、インポート、
編集、プレビュー、ライブラリ保存、ローカルファイルのエクスポートができます。

本番ビルドやコントリビュートの前には、次を実行します。

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

システム要件、ポート、環境変数、初回確認は
[English quick start](./GUIDE/en/01-quick-start.md) を参照してください。

## データ、プライバシー、安全性の境界

| 保存先            | 保存するもの                                                                            | 保存しないもの                                           |
| ----------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Browser IndexedDB | ローカルワークスペース、アカウント分離済みクラウドキャッシュ、同期キュー、設定、AI 設定 | サーバー側の恒久的なバックアップ                         |
| Supabase Postgres | サインインユーザーの Markdown、メタデータ、設定、使用量、納品バージョンのメタデータ     | AI API キー、ZIP ファイル本体                            |
| Supabase Storage  | サーバー生成の非公開納品 ZIP                                                            | 通常のローカル出力、任意の添付ファイル、ユーザー AI キー |
| Vercel            | ページおよびリクエスト時の Route Handler 実行                                           | ユーザー文書の永続ストレージ                             |

Supabase を設定していない場合、アプリが下書きを自動アップロードすることはありません。AI
パネルを開いただけで文書が読み取られることもありません。あなたが明示的に開始したリクエスト
に必要な内容だけが、選択したプロバイダーへ送信されます。プロバイダーのデータポリシーは
各自で確認してください。

## ドキュメント

詳細なデプロイ・運用ガイドは現在、英語と中国語で提供しています。

- [English guide index](./GUIDE/en/README.md)
- [Chinese guide index](./GUIDE/zh-CN/README.md)
- [English quick start](./GUIDE/en/01-quick-start.md)
- [English user tutorial](./GUIDE/en/02-user-tutorial.md)
- [English Vercel deployment](./GUIDE/en/06-vercel-deployment.md)

日本語の UI は利用できます。文言は中国語の製品意図を基に日文化しており、技術用語は必要に
応じて英語を維持しています。公開品質の日本語として扱う前に、ネイティブによるレビューが必要です。
詳細な日本語デプロイガイドは今後の作業です。

## 任意の Supabase 設定

アカウント、同期、または非公開納品バージョンを有効にする場合にだけ `.env.local` を作成します。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<your-public-key>

# サーバー専用: 非公開納品バージョン、署名付きダウンロード、アカウント完全削除
SUPABASE_SECRET_KEY=sb_secret_<your-server-only-key>

# Supabase で CAPTCHA を有効にして公開登録する場合のみ必要
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your-public-site-key>
```

`NEXT_PUBLIC_SUPABASE_*` はブラウザから見える公開設定です。`SUPABASE_SECRET_KEY` は
ローカルサーバー環境変数と Vercel のサーバー側環境変数だけに置いてください。
`NEXT_PUBLIC_` 接頭辞を付けたり、Git、スクリーンショット、ログ、Issue に含めたりしては
いけません。migration、RLS、Storage、使用量上限については
[Supabase setup guide](./GUIDE/en/04-supabase-setup.md) を参照してください。

## 推奨デプロイ方法

このリポジトリは標準的な Next.js App Router アプリケーションであり、Vercel への直接
デプロイを想定しています。Supabase コールバック、URL 取得、最大 300 秒の AI ストリーミング
Route Handler は Vercel の運用経路に合わせて設計されています。

Docker、Netlify、Cloudflare Workers、その他のプラットフォームには、現在対応または本番検証が
ありません。独自ドメインを追加した後は、Supabase Site URL と Redirect URLs、Google OAuth
の origin/callback、Turnstile の hostname をまとめて更新してください。

手順は [Vercel deployment guide](./GUIDE/en/06-vercel-deployment.md) を参照してください。

## 作者について

Rico は Web/UI デザイナーです。UI/UX デザインの実務経験をもち、現在は Web デザイン、
ビジュアル実装、プロダクト開発の探求に取り組んでいます。

[Rico's Blog](https://ricoui.com/) で更新しています。
[小紅書の @Rico的设计漫想](https://www.xiaohongshu.com/user/profile/5f2b6903000000000101f51f)
と [X の @ricouii](https://x.com/ricouii) もフォローできます。

WeChat 公式アカウント: **Rico的设计漫想**。

<img src="docs/rico/wx.png" alt="Rico WeChat 公式アカウントの QR コード" width="600" height="auto" style="display:inline-block;margin:12px;">

または WeChat で友だち追加してください。

<img src="docs/rico/wechat.png" alt="Rico WeChat の QR コード" width="280" height="auto" style="display:inline-block;margin:12px;">

## 💜 作者をサポートする

このプロジェクトが役に立った場合は、小さな支援でも大きな励みになります。ありがとうございます。

<img src="docs/rico/zanshangma.jpg" alt="支援用 QR コード" width="280" height="auto" style="display:inline-block;margin:12px;">

---

⭐ このプロジェクトが役に立ったら、Star を付けていただけると嬉しいです。
