# 03 · AI configuration

[Guide index](./README.md) · [中文](../zh-CN/03-ai-configuration.md) · [日本語](../ja/03-ai-configuration.md)

AI is optional. Provider profiles and API keys are stored only in the browser;
they are never synchronized to Supabase. A document is sent only after an
explicit AI request.

## Supported presets

| Provider           | Default endpoint                              |
| ------------------ | --------------------------------------------- |
| DeepSeek           | `https://api.deepseek.com/v1`                 |
| Anthropic / Claude | `https://api.anthropic.com/v1`                |
| Volcengine Ark     | `https://ark.cn-beijing.volces.com/api/v3`    |
| OpenRouter         | `https://openrouter.ai/api/v1`                |
| Z.AI / GLM         | `https://open.bigmodel.cn/api/paas/v4`        |
| GLM Coding Plan    | `https://open.bigmodel.cn/api/coding/paas/v4` |
| Custom             | Your compatible public endpoint               |

Open **Settings → AI**, create a profile, select a preset, provide API key and
model, then test it with a small task. Use the provider's current dashboard for
model availability and billing.

## Traffic modes

- **Automatic** selects the appropriate route for the profile.
- **Browser direct** sends a request from the browser and requires provider CORS
  support.
- **Same-origin proxy** sends the explicit request through `/api/ai-proxy`; use
  it for providers without browser CORS support.

For a custom provider, the base URL must be public HTTPS and must not contain a
username, password, query string, localhost, `.local` name, private IP or cloud
metadata address. Proxy validation also rejects DNS results resolving to private
networks.

## Deployment switches

```dotenv
# Disable all AI UI and requests when false.
NEXT_PUBLIC_AI_ENABLED=false

# Optional exact hostname allowlist for the server proxy.
AI_PROXY_ALLOWED_HOSTS=api.deepseek.com,api.anthropic.com,open.bigmodel.cn
```

The allowlist contains hostnames only: no protocol, path, port or wildcard.
Restart the deployment after changing it.

## GLM notes and recovery

Thinking is disabled for deterministic tasks such as analysis, repair and
normalization. Complex website generation may use the configured Thinking
choice. GLM Coding Plan is experimental and may reject requests or be busy;
HTTP 429, 503 or provider code 1305 normally indicates service pressure, not an
invalid key. If a response finishes without visible text, the application fails
the task rather than saving an empty document. Retry later, switch a model or
use the standard Z.AI endpoint.
