# 06 · Vercel 部署

Vercel 是当前仓库的推荐部署平台。项目使用 Next.js App Router、Route Handlers、
服务端 DNS 校验和最长 300 秒的 AI 流式请求，不是静态站点。

官方参考：

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel 环境变量](https://vercel.com/docs/environment-variables)
- [添加自定义域名](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [函数最大时长](https://vercel.com/docs/functions/configuring-functions/duration/)

套餐限制和 Dashboard 名称会变化，部署时以 Vercel 当前官方说明为准。

## 1. 部署前检查

在本地执行：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

确认：

- 纯本地模式可以启动；
- `.env.local`、用户 Key 和生产数据没有进入 Git；
- Supabase 的三个 migration 已在目标环境完成；
- Production 和 Preview 的后端边界已经决定；
- 已拥有目标域名的 DNS 管理权限。

## 2. 导入 Git 仓库

1. 将仓库推送到受支持的 Git Provider。
2. 在 Vercel 选择“Add New Project”并导入仓库。
3. Framework Preset 选择或自动识别为 Next.js。
4. Root Directory 使用仓库根目录。
5. Install Command 使用 lockfile 默认行为，或明确填写 `pnpm install`。
6. Build Command 使用 `pnpm build`。
7. 不填写 Output Directory；Next.js 由 Vercel 管理输出。

首次可先不配置 Supabase，以纯本地模式部署并验证页面、品牌和导出。浏览器本地数据
仍只保存在访问者自己的设备中。

## 3. 环境变量矩阵

Vercel 的变量修改只对之后的新部署生效。修改后必须重新部署。

| 变量                             | Development          | Preview              | Production           |
| -------------------------------- | -------------------- | -------------------- | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | 开发项目或不设       | 测试项目或不设       | 生产项目             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | 开发 publishable key | 测试 publishable key | 生产 publishable key |
| `SUPABASE_SECRET_KEY`            | 按需本地使用         | 默认不设             | 完整云能力必需       |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 测试 Site Key        | 测试 Site Key        | 生产 Site Key        |
| `NEXT_PUBLIC_AI_ENABLED`         | 可选                 | 可选                 | 可选                 |
| `AI_PROXY_ALLOWED_HOSTS`         | 可选                 | 推荐                 | 公开部署推荐         |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`  | 不建议               | 不建议               | 可选                 |

不要让任意分支 Preview 连接生产数据库并持有 server secret。安全选择是 Preview 保持
纯本地；需要云端验收时使用独立测试 Supabase 项目。

### Production 示例

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<public-key>
SUPABASE_SECRET_KEY=sb_secret_<server-secret>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<production-site-key>
AI_PROXY_ALLOWED_HOSTS=api.deepseek.com,api.anthropic.com,open.bigmodel.cn
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

只填写实际使用的可选变量。不要把示例占位值直接保存到 Production。

## 4. 第一次部署

点击 Deploy，等待安装、类型处理和 Next.js 构建完成。成功后 Vercel 会分配
`*.vercel.app` 地址。

立即检查：

1. 首页、编辑器、设计库、品牌、搜索和指南页面可以打开。
2. 新建草稿、刷新和本地导出可用。
3. `/api/fetch-url` 和 `/api/ai-proxy` 没有在空闲时持续报错。
4. 配置 Supabase 时，登录入口出现；未配置时，应用仍保持本地可用。
5. 浏览器控制台没有暴露 server secret。

## 5. 函数时长

当前代码设置：

| Route Handler    | `maxDuration` |
| ---------------- | ------------- |
| `/api/ai-proxy`  | 300 秒        |
| `/api/fetch-url` | 60 秒         |

部署前确认所用套餐和 Fluid Compute 设置支持这些时长。Vercel 可能在超时后终止函数；
等待流式模型响应的时间也计入执行时长。不要通过无限增加时长掩盖 Provider 不返回正文
或网址抓取卡住的问题。

如果日志出现超时：

- 确认实际失败的是 AI 代理还是网址抓取；
- 测试更快的模型；
- 检查 Provider 是否持续输出正文；
- 检查目标网站响应速度；
- 核对当前 Vercel 套餐最大时长。

## 6. 绑定自定义域名

1. 打开 Vercel Project Settings → Domains。
2. 添加 `design.example.com` 或你的目标域名。
3. 根据 Vercel 给出的实际记录到 DNS 服务商配置。
4. 子域通常使用 CNAME；根域可能使用 A 记录或 nameserver。
5. 等待 Vercel 显示域名有效并签发 SSL。

不要复制其他项目文档中的固定 DNS 值。以当前项目 Domains 页面显示的记录为准。

### 域名生效后同步配置

在 Supabase URL Configuration 更新：

```text
Site URL
https://design.example.com

Redirect URL
https://design.example.com/auth/callback
```

在 Google OAuth Authorized JavaScript origins 添加：

```text
https://design.example.com
```

Google Authorized redirect URI 仍是 Supabase callback：

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

在 Turnstile 生产 Widget 中允许 `design.example.com`，并确认邮件模板和发件品牌没有
保留原项目域名。

## 7. Preview 部署

Vercel 会为非生产分支创建 Preview。推荐策略：

- 默认不配置生产 Supabase 变量；
- 如需登录测试，使用独立测试项目和测试 Turnstile Key；
- 在测试 Supabase 添加受控的 Preview Redirect URL；
- 不加载生产 GA4；
- 不向未知贡献分支提供 server secret；
- 合并前在 Preview 检查中文、英文、桌面和窄屏。

公开 fork 的 Pull Request 可能执行不受信任代码。不要让此类构建读取组织级生产 Secret。

## 8. 可选 GA4

在 Production 设置公开 Measurement ID：

```dotenv
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

重新部署后才会加载。未设置时应用不加载 Google Analytics。该变量只能包含公开的
Measurement ID，不能填写 Google 服务账号、OAuth Secret 或其他私密凭据。

部署者应根据所在地区和目标用户评估隐私说明、Cookie 同意和数据保留要求。

## 9. 发布后的完整验收

- [ ] 自定义域名 HTTPS 正常，`vercel.app` 与主域跳转符合预期。
- [ ] 本地模式完整可用。
- [ ] Magic Link 和可选 Google 登录回到正确生产域名。
- [ ] Turnstile 正常挑战，失败 token 会被拒绝。
- [ ] 两个账号互相不可见。
- [ ] AI 直连和代理各按预期工作。
- [ ] 网址抓取拒绝 localhost 和私网地址。
- [ ] 交付版本可生成、下载、删除和恢复。
- [ ] server secret 没有出现在客户端 bundle、日志或截图。
- [ ] Preview 没有生产数据库和 Secret。

完整场景见[排障与验收](./08-troubleshooting-and-acceptance.md)。

## 10. 其他平台边界

本仓库没有 Dockerfile、OpenNext、Cloudflare Workers 或 Netlify 专用配置。尤其是 AI
代理的 Node.js DNS `lookup()` 安全检查和长流式请求不能假定在其他 runtime 中直接
工作。在完成适配、测试和安全复核前，不要把通用 `pnpm build` 描述成已支持的多平台
生产部署方案。
