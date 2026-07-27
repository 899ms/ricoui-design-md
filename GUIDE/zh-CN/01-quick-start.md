# 01 · 快速开始

本章从一台没有项目依赖的电脑开始，完成本地安装、启动、首次检查和生产构建。
完成本章不需要 Supabase、AI Key 或任何第三方云服务。

## 1. 准备工具

需要以下软件：

| 工具    | 要求          | 检查命令         |
| ------- | ------------- | ---------------- |
| Git     | 当前稳定版本  | `git --version`  |
| Node.js | 22 或更高版本 | `node --version` |
| pnpm    | 当前稳定版本  | `pnpm --version` |

推荐从 Node.js 和 pnpm 官方渠道安装。团队协作时应以仓库 lockfile 为准，不要混用
`npm install`、`yarn` 和 `pnpm install`，否则可能产生不同的依赖解析结果。

如果系统尚未安装 pnpm，可参考 <https://pnpm.io/installation>。安装后关闭并重新打开
终端，再执行上述检查命令。

## 2. 获取代码

```bash
git clone https://github.com/ricocc/ricoui-design-md.git
cd ricoui-design-md
```

若使用 fork，请克隆自己的 fork，并把上游
`https://github.com/ricocc/ricoui-design-md.git` 配置为 `upstream`。

```bash
git remote -v
```

确认当前目录包含 `package.json`、`pnpm-lock.yaml`、`app/`、`components/` 和
`supabase/`。

## 3. 安装并启动

```bash
pnpm install
pnpm dev
```

终端显示服务已启动后，打开 <http://localhost:3000>。开发模式使用 Next.js
Turbopack，修改源码后页面会自动更新。

### 端口被占用

如果 3000 端口已经使用，可指定其他端口：

```bash
pnpm dev -- --port 3001
```

随后打开 <http://localhost:3001>。如果之后启用 Supabase Auth，还要把对应的
`http://localhost:3001/auth/callback` 加入 Redirect URLs。

### 安装失败

按顺序检查：

1. `node --version` 是否为 22 或更高；
2. 是否在包含 `pnpm-lock.yaml` 的仓库根目录运行命令；
3. 删除命令输出中提到的损坏缓存后重新执行，而不是删除用户文档数据；
4. 网络代理是否允许访问 npm registry；
5. 不要用 `--force` 跳过依赖错误后直接部署。

## 4. 先验证纯本地模式

不要创建 `.env.local`，直接完成以下操作：

1. 在首页选择“新建草稿”。
2. 输入一段 Markdown，等待“已保存到本机”。
3. 刷新页面，确认草稿仍然存在。
4. 导入一个 `.md` 文件。
5. 将草稿保存到设计库，再从设计库打开。
6. 从品牌参考创建一份新草稿。
7. 导出 `DESIGN.md`；若文档 Token 有效，再导出 JSON、CSS 和 ZIP。

成功标准：未登录时应用完整可用，刷新不会丢失内容，开发者工具中没有持续报错。

本地数据保存在浏览器 IndexedDB。换浏览器、清除站点数据、使用无痕窗口或更换设备
都会得到不同的本地工作区。云同步不是本地保存的前置条件。

## 5. 创建环境变量文件

只有需要可选能力时才创建 `.env.local`。

macOS / Linux：

```bash
cp .env.example .env.local
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
```

然后删除暂时不用的变量或保持它们未设置。不要保留示例占位值后误以为服务已经
配置完成。Next.js 读取环境变量后通常需要重启 `pnpm dev`。

### 常见组合

纯本地：不创建 `.env.local`。

仅关闭 AI：

```dotenv
NEXT_PUBLIC_AI_ENABLED=false
```

登录与同步：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<public-key>
```

完整云端能力还需要服务端 Secret：

```dotenv
SUPABASE_SECRET_KEY=sb_secret_<server-secret>
```

这些值的获取与安全边界见 [Supabase 配置](./04-supabase-setup.md)。

## 6. 常用命令

| 命令                     | 用途                | 什么时候运行              |
| ------------------------ | ------------------- | ------------------------- |
| `pnpm dev`               | 启动开发服务器      | 日常开发                  |
| `pnpm typecheck`         | TypeScript 类型检查 | 修改 TypeScript 后        |
| `pnpm lint`              | ESLint 检查         | 修改代码后                |
| `pnpm test`              | 运行全部 Vitest     | 跨模块改动或发布前        |
| `pnpm vitest run <file>` | 运行定向测试        | 小范围功能改动            |
| `pnpm build`             | Next.js 生产构建    | 部署或发布前              |
| `pnpm start`             | 启动已构建产物      | 本地检查 production build |

小改动优先运行最相关的检查；准备发布时再依次运行：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## 7. 本地生产构建

```bash
pnpm build
pnpm start
```

默认打开 <http://localhost:3000>。构建失败时先处理第一条真实错误，不要只看最后的
汇总信息。环境变量带 `NEXT_PUBLIC_` 前缀时会进入浏览器构建结果，修改后必须重新
构建。

## 8. 下一步

- 学习产品：[完整使用教程](./02-user-tutorial.md)
- 配置 AI：[AI 配置](./03-ai-configuration.md)
- 开启云同步：[Supabase 配置](./04-supabase-setup.md)
- 部署上线：[Vercel 部署](./06-vercel-deployment.md)
- 修改代码：[开发与贡献](./09-development.md)
