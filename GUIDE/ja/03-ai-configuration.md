# 03 · AI 設定

[ガイド一覧](./README.md) · [English](../en/03-ai-configuration.md) · [简体中文](../zh-CN/03-ai-configuration.md)

AI は任意です。プロバイダープロファイルと API キーはブラウザ内にのみ保存され、Supabase に同期されることはありません。ドキュメントが送信されるのは、AI リクエストを明示した後だけです。

## 対応プリセット

| プロバイダー       | デフォルトエンドポイント                      |
| ------------------ | --------------------------------------------- |
| DeepSeek           | `https://api.deepseek.com/v1`                 |
| Anthropic / Claude | `https://api.anthropic.com/v1`                |
| Volcengine Ark     | `https://ark.cn-beijing.volces.com/api/v3`    |
| OpenRouter         | `https://openrouter.ai/api/v1`                |
| Z.AI / GLM         | `https://open.bigmodel.cn/api/paas/v4`        |
| GLM Coding Plan    | `https://open.bigmodel.cn/api/coding/paas/v4` |
| Custom             | 互換性のある公開エンドポイント                |

**設定 → AI** を開き、プロファイルを作成し、プリセットを選び、API キーとモデルを設定して、小さなタスクでテストします。利用可能なモデルと料金は、プロバイダーの最新ダッシュボードを確認してください。

## 通信モード

- **自動** は、プロファイルに適した経路を選択します。
- **ブラウザから直接** はブラウザからリクエストを送り、プロバイダーの CORS 対応が必要です。
- **同一オリジンプロキシ** は、明示したリクエストを `/api/ai-proxy` 経由で送ります。ブラウザ CORS に対応しないプロバイダーで使用します。

Custom プロバイダーでは、ベース URL は公開 HTTPS である必要があります。ユーザー名、パスワード、クエリ文字列、localhost、`.local` 名、プライベート IP、クラウドメタデータアドレスを含めることはできません。プロキシの検証では、プライベートネットワークに解決される DNS 結果も拒否します。

## デプロイスイッチ

```dotenv
# false の場合、すべての AI UI とリクエストを無効にする。
NEXT_PUBLIC_AI_ENABLED=false

# サーバープロキシ用の任意の完全一致ホスト名許可リスト。
AI_PROXY_ALLOWED_HOSTS=api.deepseek.com,api.anthropic.com,open.bigmodel.cn
```

許可リストに含めるのはホスト名のみです。プロトコル、パス、ポート、ワイルドカードは指定しません。変更後はデプロイを再起動してください。

## GLM に関する注意と復旧

分析、修復、正規化などの決定論的なタスクでは Thinking を無効にします。複雑な Web サイト生成では、設定した Thinking の選択を使用できます。GLM Coding Plan は実験的であり、リクエストが拒否されたり、混雑したりすることがあります。HTTP 429、503、またはプロバイダーコード 1305 は通常、無効なキーではなくサービス負荷を示します。応答が可視テキストなしで終了した場合、アプリケーションは空のドキュメントを保存せず、タスクを失敗として扱います。後で再試行する、モデルを変更する、標準の Z.AI エンドポイントを使用してください。
