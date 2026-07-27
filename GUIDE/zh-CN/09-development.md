# 09 · 开发与贡献

本章面向修改源码、添加功能或准备 Pull Request 的贡献者。开始前先阅读根目录 README
和相关指南，再检查对应实现与现有测试。

## 1. 技术栈

| 层       | 技术                                        |
| -------- | ------------------------------------------- |
| 应用     | Next.js App Router、React、TypeScript       |
| UI       | Tailwind CSS、lucide-react、Base UI、Motion |
| 状态     | Zustand                                     |
| 国际化   | next-intl，中文和英文同一路由               |
| 本地存储 | IndexedDB                                   |
| 可选云端 | Supabase Auth、Postgres、Storage            |
| AI       | AI SDK、OpenAI-compatible Provider          |
| Markdown | marked、Shiki、自定义 DESIGN.md 解析与派生  |
| 测试     | Vitest、TypeScript、ESLint、Prettier        |

准确版本以 `package.json` 和 `pnpm-lock.yaml` 为准。

## 2. 目录

| 目录                   | 责任                                          |
| ---------------------- | --------------------------------------------- |
| `app/`                 | 页面、Route Handlers、Auth callback、全局样式 |
| `components/`          | App Shell、编辑器、AI、同步、对话框和 UI      |
| `lib/`                 | 解析、派生、存储、同步、AI、导出和领域类型    |
| `messages/`            | `zh-CN.json` 与 `en.json` 界面文案            |
| `public/brands/`       | 内置只读品牌参考包                            |
| `supabase/migrations/` | 云端 schema、RLS、容量和 workspace revision   |
| `supabase/templates/`  | Supabase Auth 邮件模板源文件                  |
| `tests/`               | Vitest 单元和领域回归测试                     |
| `GUIDE/`               | 开源使用、配置、部署和运维文档                |

## 3. 架构边界

### Markdown 真源

`rawMarkdown` / `DESIGN.md` 是唯一可编辑真源。结构化控件必须保留未知 Markdown；
JSON、CSS 和 ZIP 是只读派生结果。

### 本地优先

没有账号和 Supabase 时核心功能必须可用。不要让可选服务失败阻止本地编辑、预览或
导出原文。

### 工作区隔离

未登录本地工作区和登录账户云端工作区互相独立。登录不自动合并；选择复制使用新 ID。
退出清理账号缓存并恢复原本本地工作区。

### AI

用户自带 Provider 和 Key。打开面板不发送文档；修改必须显示候选和差异，并经过明确
应用。Key 不进入 Supabase。

### 云端交付

浏览器不能向私有 Bucket 上传任意 ZIP。服务端从已同步 Markdown 生成确定性包，并
执行所有权、版本、摘要、大小、配额和保留检查。

## 4. 主要数据流

### 本地编辑

```text
Editor action
  → Zustand store
  → canonical Markdown revision
  → IndexedDB persistence
  → parser / preview / derived artifacts
```

### 可选同步

```text
owner-scoped IndexedDB cache
  → per-source sync queue
  → Supabase tables protected by RLS
  → workspace revision check
```

冲突只暂停对应来源，其他队列继续。不要重新引入自动冲突副本。

### AI 修订

```text
explicit user action
  → selected provider profile
  → direct request or same-origin proxy
  → explanation or complete candidate
  → deterministic checks and diff
  → explicit apply
```

### 交付版本

```text
synced source + version + digest
  → authenticated Route Handler
  → server-side deterministic ZIP
  → private Storage + release metadata
  → owner-checked signed download URL
```

## 5. Route Handlers

| 路由                             | 用途                                |
| -------------------------------- | ----------------------------------- |
| `/api/fetch-url`                 | 安全抓取公开 HTTPS 网站，最大 60 秒 |
| `/api/ai-models`                 | 通过安全代理读取 Provider 模型列表  |
| `/api/ai-proxy`                  | AI 请求代理和流式转发，最大 300 秒  |
| `/api/account`                   | 账户用量读取与完整账户删除          |
| `/api/releases`                  | 列表和创建私有交付版本              |
| `/api/releases/:id`              | 删除交付版本                        |
| `/api/releases/:id/download-url` | 所有权校验后的短时签名 URL          |
| `/auth/callback`                 | Supabase PKCE code exchange         |

所有写操作要保持同源检查、认证、所有权和服务端输入验证。

## 6. 开发流程

```bash
pnpm install
pnpm dev
```

开始修改前：

1. 阅读根目录 README 和与改动相关的 GUIDE 章节。
2. 运行 `git status --short`，保留其他人的未提交修改。
3. 找到相关实现和现有测试。
4. 确认这是本地能力、可选 AI、可选同步还是部署运维改动。
5. 选择与风险相称的验证范围。

## 7. 测试和检查

### 小范围改动

优先运行最相关的 Vitest：

```bash
pnpm vitest run tests/<area>/<file>.test.ts
```

修改 TypeScript 时通常再运行：

```bash
pnpm typecheck
pnpm exec eslint <changed-files>
```

### 跨模块或发布前

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

### 文档

```bash
pnpm exec prettier --check GUIDE/**/*.md README.md
```

同时检查相对链接和代码块。文档改动不需要默认运行生产构建。

## 8. 国际化

- 新的用户可见文案必须进入 `messages/zh-CN.json` 和 `messages/en.json`；
- 不在组件中硬编码单一语言；
- 保留两边相同的 key 和 ICU 参数；
- 英文注意单复数，中文避免内部工程术语；
- 窄屏检查按钮、状态、表格和错误信息；
- 服务端原始错误不能替代面向用户的可理解文案。

## 9. 安全规则

- 不读取、打印或提交 `.env.local` 中的 Secret；
- 不把 service role/server secret 放进浏览器；
- 不关闭 RLS 或公开 `design-releases`；
- 不放宽 URL/AI 代理的私网、DNS 和 HTTPS 检查；
- 不允许 AI 静默修改 Markdown；
- 不让配额或云错误删除本地原件；
- 不在日志记录 AI 正文、Key、Magic Link、session 或签名 URL；
- 破坏性数据操作必须有精确目标和恢复方案。

## 10. 修改 Supabase

Schema 改动必须新增 migration，不修改已经作为基线发布的文件来伪造历史。同步修改：

- 数据库约束与 RLS；
- TypeScript 类型和同步引擎；
- 配额错误映射；
- `.env.example` 和 GUIDE；
- 两账户、离线、冲突和回滚验收。

对已有数据有影响时，必须说明迁移、回滚和兼容策略。

## 11. 修改邮件模板

仓库中的 `supabase/templates/` 是模板源文件。先改文件并审查，再粘贴到 Supabase
Dashboard。记录主题、变量、部署品牌和验收结果，不能只在 Dashboard 中修改后丢失
版本来源。

## 12. 文档维护

实现变化后按影响更新：

- 用户操作变化：`GUIDE/02-user-tutorial.md`；
- AI Provider 或安全边界：`GUIDE/03-ai-configuration.md`；
- schema、变量或 Auth：对应部署章节；
- 运维规则：`GUIDE/07-operations-security.md`；
- 已知故障：`GUIDE/08-troubleshooting-and-acceptance.md`；
- 用户可见能力或架构边界：README 和对应 GUIDE 章节；
- 未完成工程工作：公开仓库的 Issue 或 Pull Request；
- 长期产品选择：对应 GUIDE 章节及相关 Issue 或 Pull Request。

不要在 README、根 GUIDE、旧用户指南和新 GUIDE 中保留多份相互独立的正文。

## 13. Pull Request 检查

- [ ] 改动目标和用户影响清楚。
- [ ] 没有覆盖无关未提交修改。
- [ ] 本地优先、Markdown 真源和显式 AI 应用保持不变。
- [ ] 新文案完成中英文和窄屏检查。
- [ ] 新 schema 有 migration、RLS 和回滚说明。
- [ ] 相关定向测试通过。
- [ ] 跨模块改动完成 typecheck、lint、test 和 build。
- [ ] 文档和 `.env.example` 与代码一致。
- [ ] PR 不含 Secret、生产数据、无授权素材或临时截图。

## 14. 正式开源前

公开仓库使用 Apache License 2.0。准备公开时还应审查：

- `LICENSE`；
- `CONTRIBUTING.md`；
- `SECURITY.md` 和私密漏洞报告渠道；
- Code of Conduct（如项目需要）；
- 品牌参考、字体、图片和示例的再分发权；
- 私人部署域名、邮箱、统计 ID 和历史数据；
- 自动化 CI 和公开仓库保护规则。

发布时必须保留公开仓库现有的 `LICENSE`。
