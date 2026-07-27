# RICOUI DESIGN 开源使用与部署指南

这套文档面向三类读者：想直接使用 RICOUI DESIGN 的设计师与开发者、准备部署
自己实例的维护者，以及希望二次开发的开源贡献者。

RICOUI DESIGN 是一个本地优先的 `DESIGN.md` 工作台。创建、编辑、预览、设计库、
品牌参考和本地导出不依赖账号或云服务；AI、跨设备同步、私有交付版本和访问分析
都是按需开启的可选能力。

> 当前项目处于 Beta。代码已经包含完整的本地工作流和云端候选实现，但真实
> Supabase、邮件、双账户隔离、容量保护和生产部署验收仍需由每位部署者自行完成。
> 不要把“代码存在”当成“你的生产环境已经验证”。

## 项目信息

| 项目     | 地址                                                                             |
| -------- | -------------------------------------------------------------------------------- |
| 网站     | <https://design.ricoui.com/>                                                     |
| 开源仓库 | [github.com/ricocc/ricoui-design-md](https://github.com/ricocc/ricoui-design-md) |
| 仓库名   | `ricoui-design-md`                                                               |

## 先选择你需要的运行模式

| 模式         | 需要配置                                         | 可以使用                                            |
| ------------ | ------------------------------------------------ | --------------------------------------------------- |
| 纯本地       | Node.js、pnpm                                    | 编辑、导入、预览、设计库、品牌参考、本地导出        |
| 本地 + AI    | 上述内容；用户在浏览器内填写自己的 AI API Key    | 网址生成、分析、问答、修订建议                      |
| 登录与同步   | Supabase Project URL 和 publishable key          | Magic Link、Google 登录、个人云端工作区、跨设备同步 |
| 完整云端能力 | Supabase server secret、Storage、SMTP、Turnstile | 私有交付版本、签名下载、完整账户删除、公开注册      |
| 可选分析     | GA4 Measurement ID                               | 页面访问分析；不配置时不加载 GA                     |

如果只是体验或在单台设备上使用，请先完成纯本地模式。它不需要创建 Supabase、
Vercel、Resend、Google Cloud 或 Cloudflare 账户。

## 推荐配置顺序

1. 在本地完成安装，确认不配置环境变量也能创建和导出文档。
2. 如需 AI，在应用内添加一个 Provider 配置并测试连接。
3. 如需跨设备同步，创建全新的 Supabase 项目并应用三个 migration。
4. 配置 Auth 回调、Magic Link、自有 SMTP、可选 Google OAuth 和 Turnstile。
5. 将仓库部署到 Vercel，填写对应环境的变量并绑定域名。
6. 用两个真实测试账户完成隔离、冲突、交付版本和删除账户验收。
7. 上线后持续检查数据库、Storage、邮件和容量状态。

## 最短启动路径

需要 Git、Node.js 22 或更高版本，以及 pnpm。

```bash
git clone https://github.com/ricocc/ricoui-design-md.git
cd ricoui-design-md
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。此时不要创建 `.env.local`，先确认以下功能可用：

- 新建和导入 `DESIGN.md`；
- 在源码、阅读、结构化和预览视图之间切换；
- 保存到设计库并从品牌参考创建草稿；
- 导出原始 Markdown；当 Token 有效时导出 JSON、CSS 和 ZIP；
- 刷新浏览器后，草稿仍保存在当前设备。

完整步骤见[快速开始](./01-quick-start.md)。

## 文档导航

| 文档                                                      | 适合什么时候阅读                                      |
| --------------------------------------------------------- | ----------------------------------------------------- |
| [01 · 快速开始](./01-quick-start.md)                      | 安装依赖、启动本地环境、理解环境变量和命令            |
| [02 · 完整使用教程](./02-user-tutorial.md)                | 从第一份 DESIGN.md 到 AI、设计库、同步和交付版本      |
| [03 · AI 配置](./03-ai-configuration.md)                  | 选择 Provider、配置模型、直连或代理、处理常见 AI 错误 |
| [04 · Supabase](./04-supabase-setup.md)                   | 建库、执行 migration、配置 RLS、Storage、额度和密钥   |
| [05 · 登录、邮件与 CAPTCHA](./05-auth-email-captcha.md)   | Magic Link、Resend、Google OAuth、Turnstile           |
| [06 · Vercel 部署](./06-vercel-deployment.md)             | 环境变量、Preview、Production、域名和回调地址         |
| [07 · 运维与安全](./07-operations-security.md)            | 备份、密钥、容量、冻结开关、恢复和开源前检查          |
| [08 · 排障与验收](./08-troubleshooting-and-acceptance.md) | 按症状排查并执行上线前真实验收                        |
| [09 · 开发与贡献](./09-development.md)                    | 技术栈、目录、数据流、测试和贡献约束                  |

## 技术栈速览

- Next.js 16 App Router、React 19、TypeScript；
- Tailwind CSS 4、next-intl、Zustand；
- IndexedDB 本地持久化；
- 可选 Supabase Auth、Postgres 和私有 Storage；
- OpenAI-compatible AI SDK 接口；
- Vitest、ESLint、Prettier。

版本以仓库的 [`package.json`](../../package.json) 和 lockfile 为准，不要只依赖本文中的
文字说明。

## 环境变量总表

| 变量                             | 是否必需            | 可见范围   | 用途                                       |
| -------------------------------- | ------------------- | ---------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`       | 云同步必需          | 浏览器公开 | Supabase Project URL                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | 云同步必需          | 浏览器公开 | publishable key；兼容旧 anon key           |
| `SUPABASE_SECRET_KEY`            | 完整云能力必需      | 仅服务端   | 交付 Storage、签名链接、完整账户删除       |
| `SUPABASE_SERVICE_ROLE_KEY`      | 兼容旧项目          | 仅服务端   | server secret 的旧版回退，不建议新项目使用 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 开启 CAPTCHA 时必需 | 浏览器公开 | 渲染 Turnstile Widget                      |
| `NEXT_PUBLIC_AI_ENABLED`         | 可选                | 构建后公开 | 设为 `false` 时全局关闭 AI                 |
| `AI_PROXY_ALLOWED_HOSTS`         | 可选                | 仅服务端   | 逗号分隔的 AI Provider 主机白名单          |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`  | 可选                | 浏览器公开 | GA4 `G-...` Measurement ID                 |

公开变量可以进入浏览器包，不等于可以填写私密凭据。所有 Secret、service role key、
SMTP 密码、OAuth Secret 和用户 AI Key 都不得使用 `NEXT_PUBLIC_` 前缀或提交到 Git。

## 支持边界

当前文档将 Vercel 作为推荐部署平台，因为仓库直接使用 Next.js Route Handlers，且
AI 代理和网址抓取设置了服务端执行时长。Cloudflare Workers、Netlify、Docker 和
其他自托管方式没有配套适配或验收，本指南只说明这一边界，不提供看似可用但未经
验证的步骤。

公开仓库使用 Apache License 2.0。发布代码时必须保留仓库现有的 `LICENSE`，并继续完成
敏感信息、第三方素材和部署专属配置检查。
