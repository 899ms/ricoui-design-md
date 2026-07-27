# 05 · 登录、邮件与 CAPTCHA

本章在已经完成 [Supabase 配置](./04-supabase-setup.md)的基础上启用 Magic Link、
可选 Google OAuth、生产邮件和 Cloudflare Turnstile。

官方参考：

- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Google 登录](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)
- [Resend 域名](https://resend.com/docs/dashboard/domains/introduction)
- [Turnstile 测试密钥](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)

第三方 Dashboard 的菜单名可能调整，应以官方控制台当前界面为准。

## 1. 规划环境与域名

至少区分：

| 环境       | 示例                             | 推荐后端                   |
| ---------- | -------------------------------- | -------------------------- |
| 本地       | `http://localhost:3000`          | 开发 Supabase 项目或纯本地 |
| Preview    | `https://branch-name.vercel.app` | 独立测试项目或纯本地       |
| Production | `https://design.example.com`     | 生产 Supabase 项目         |

不要把生产 server secret 配给任意分支 Preview。公开注册、邮件和 CAPTCHA 最好先在
独立测试项目完成验收，再复制经审查的配置到生产项目。

## 2. 配置 Site URL 和 Redirect URLs

应用在发起 Magic Link 和 Google OAuth 时，把当前浏览器 Origin 加上
`/auth/callback` 作为 `redirectTo`。因此所有实际使用的回调都必须在 Supabase 允许
列表中。

在 Authentication 的 URL Configuration 中设置：

```text
Site URL
https://design.example.com
```

添加精确的生产和本地回调：

```text
http://localhost:3000/auth/callback
https://design.example.com/auth/callback
```

如果本地使用其他端口，也要添加对应地址。

### Preview URL

最安全做法是 Preview 不连接生产 Supabase。若测试项目确实需要 Vercel Preview，按
Supabase 官方 Redirect URLs 文档为测试项目添加受控通配规则，例如：

```text
https://*-<team-or-account-slug>.vercel.app/**
```

生产回调使用精确路径，不要为了省事在生产项目允许任意域名。

### 验证

1. 在本地发送 Magic Link。
2. 打开邮件链接。
3. 浏览器先经过 Supabase 验证，再到当前环境的 `/auth/callback`。
4. Callback 完成 code exchange 后返回应用。
5. 账户入口显示当前邮箱和独立云端工作区。

## 3. 启用 Email 与 Magic Link

在 Supabase Authentication Providers 中启用 Email。应用使用一次性链接，不需要
用户设置或记住密码。首次完成验证时可以创建账户，之后发送登录链接。

Supabase 默认发信服务只适合项目成员测试，存在严格收件人和速率限制。面向公众前
必须配置自有 SMTP。

## 4. 使用 Resend 配置生产 SMTP

### 4.1 添加发信域

1. 在 Resend 添加你拥有的域名，推荐使用独立子域，例如 `mail.example.com`。
2. 到 DNS 服务商添加 Resend 提供的 SPF 与 DKIM 记录。
3. 可选添加 DMARC；先用监控策略确认投递，再按组织政策逐步收紧。
4. 等待 Resend 显示域名已验证。
5. 创建只用于 Auth 发信的 API Key。

不要把 Auth 邮件和营销邮件混用同一发信身份。生产域名、测试域名和对应 Key 应分开。

### 4.2 配置 Supabase Custom SMTP

在 Supabase Authentication 的 SMTP 设置中启用 Custom SMTP。以 Resend 为例：

| 项目         | 值                                 |
| ------------ | ---------------------------------- |
| Host         | `smtp.resend.com`                  |
| Port         | `465`                              |
| Username     | `resend`                           |
| Password     | Resend API Key                     |
| Sender email | `noreply@mail.example.com`         |
| Sender name  | 你的部署名称，例如 `RICOUI DESIGN` |

如果 Resend 或 Supabase 当前官方说明推荐其他端口或安全方式，以官方控制台为准。
保存后检查 Authentication Rate Limits。自定义 SMTP 的默认限制可能变化，不要在没有
滥用保护的情况下直接提高到很大数值。

Resend API Key 只保存在 Supabase Dashboard，不进入 `.env.local`、Vercel、Git、
截图或日志。

## 5. 配置邮件模板

仓库提供：

- [`supabase/templates/magic-link.html`](../../supabase/templates/magic-link.html)
- [`supabase/templates/confirm-signup.html`](../../supabase/templates/confirm-signup.html)

在粘贴前必须检查并替换模板中的：

- `RICOUI DESIGN` 品牌名；
- `https://design.ricoui.com` 链接和显示域名；
- 中文和英文说明；
- 发件人身份和隐私链接（如果你的部署需要）。

模板使用 `{{ .ConfirmationURL }}`。不要手动拼接 token，也不要删除 Supabase 生成的
验证参数。

推荐主题：

```text
Magic Link: 登录 RICOUI DESIGN · Sign in
Confirm signup: 欢迎使用 RICOUI DESIGN · Confirm your sign-up
```

自定义部署应同步替换主题中的品牌名。

### 模板验收

- [ ] 新用户收到 Confirm signup，而不是错误的普通登录文案。
- [ ] 已有用户收到 Magic Link。
- [ ] 按钮和备用纯链接都能打开。
- [ ] 链接只使用一次，过期后会失败。
- [ ] 手机和桌面邮箱均可阅读。
- [ ] SPF、DKIM 通过；DMARC 结果符合当前策略。
- [ ] 邮件没有指向 `design.ricoui.com` 等原项目域名。

## 6. 配置 Google OAuth

Google 登录是可选项。Magic Link 可以单独工作。

### 6.1 Google Cloud

1. 创建或选择 Google Cloud 项目。
2. 在 Google Auth Platform 配置 Branding、Audience 和 Data Access。
3. Scopes 至少包含 `openid`、邮箱和基础 profile。
4. 创建 OAuth Client，Application type 选择 Web application。
5. Authorized JavaScript origins 添加：

```text
http://localhost:3000
https://design.example.com
```

6. Authorized redirect URIs 添加 Supabase Provider 页面给出的 callback：

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

这里是 Supabase callback，不是应用的 `/auth/callback`。Google 先回到 Supabase，
Supabase 再回到应用。

### 6.2 Supabase

1. 在 Authentication Providers 打开 Google。
2. 填入 Client ID 和 Client Secret。
3. Client Secret 只保存在 Supabase Dashboard，不进入 Vercel。
4. 保存后用独立测试账号完成登录。

如果 Google Consent Screen 仍处于测试状态，只有配置的测试用户可以登录。正式开放前
检查 Audience、品牌验证、隐私政策和授权域名要求。

## 7. 配置 Cloudflare Turnstile

项目只在浏览器使用 Turnstile Site Key；Secret 交给 Supabase Auth 验证。

### 7.1 生产 Widget

1. 在 Cloudflare Turnstile 创建 Widget。
2. Hostname 只添加生产域名，例如 `design.example.com`。
3. 复制公开 Site Key 和私密 Secret。
4. 在 Supabase Authentication 的 Bot and Abuse Protection 中选择 Turnstile，填入
   Secret 并启用 CAPTCHA。
5. 在 Vercel Production 设置：

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<production-site-key>
```

6. 重新部署。

不要把 Turnstile Secret 填入应用环境变量。不要把 localhost 加入生产 Widget。

### 7.2 本地与自动化测试

Cloudflare 提供专用测试 Site Key 和 Secret。始终成功的可见 Widget 组合为：

```text
Site Key:   1x00000000000000000000AA
Secret Key: 1x0000000000000000000000000000000AA
```

测试 Key 只能配测试 Supabase 项目。生产 Secret 不接受测试 token，测试 Secret 也不应
进入生产项目。

开发 `.env.local`：

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

同时在开发 Supabase 项目的 CAPTCHA 设置中使用对应测试 Secret。

### 7.3 CAPTCHA 验收

- [ ] 不配置 Site Key 时，未错误开启 Supabase CAPTCHA。
- [ ] 同时配置 Site Key 和 Secret 后可以发送登录链接。
- [ ] 使用失败测试 Key 时，登录请求被拒绝并可重新挑战。
- [ ] token 过期或重复使用时失败。
- [ ] 生产 Widget 的 Hostname 不包含 localhost 或未知域名。

只在 Supabase 打开 CAPTCHA、却没有给应用配置 Site Key，会导致所有登录请求缺少
captcha token。只渲染 Widget、却没有在 Supabase 启用验证，则不能形成服务端保护。

## 8. 完整登录验收

使用至少两个真实邮箱和一个独立浏览器 Profile：

1. 注册 A，确认邮件和回调正确。
2. 退出，再用 Magic Link 登录 A。
3. 如启用 Google，用与 A 不同的测试账号登录。
4. 确认 A 和 B 看不到彼此的草稿、设计库、用量和交付版本。
5. 确认退出后恢复未登录本地工作区。
6. 检查 Supabase Auth Logs、Resend Logs 和浏览器错误。

失败时按[排障与验收](./08-troubleshooting-and-acceptance.md)逐项检查，不要通过关闭
RLS、公开 Bucket 或移除 CAPTCHA 来掩盖配置问题。
