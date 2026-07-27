# 04 · Supabase 配置

Supabase 为可选的登录、个人同步、交付版本元数据和私有 ZIP Storage 提供后端。
不配置 Supabase 时，应用保持纯本地模式。

本章面向全新的 Supabase 项目。当前 migration 是干净基线，不提供从历史 V9 schema
升级的兼容步骤。已有生产数据的项目不能直接照搬，必须先单独设计迁移和回滚。

官方参考：[Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)。

## 1. 准备内容

- 一个 Supabase 账户和新项目；
- 项目数据库密码；
- Supabase CLI；
- 本仓库 `supabase/migrations/` 下的三个 SQL 文件；
- 一个用于本地测试的独立浏览器或浏览器 Profile。

## 2. 创建项目

1. 在 Supabase Dashboard 创建新项目。
2. 选择接近主要用户的区域。
3. 生成并妥善保存高强度数据库密码。
4. 等待项目初始化完成。
5. 暂时不要手工创建业务表、RLS policy 或 Storage Bucket。

Migration 会创建项目需要的表、函数、触发器、RLS 和私有 Bucket。先手工创建不同
结构会导致 `db push` 失败或产生难以审计的差异。

## 3. 安装并使用 Supabase CLI

按 Supabase 官方 CLI 文档安装后，在仓库根目录执行：

```bash
supabase --version
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

`<project-ref>` 是 Project URL 中 `.supabase.co` 前的项目标识。`supabase link` 可能
要求输入数据库密码。

`db push` 会按照文件名顺序应用：

1. `0001_v13_cloud_baseline.sql`
2. `0002_v15_workspace_separation_limits.sql`
3. `0003_v15_workspace_revision.sql`

不要跳过第三个 migration。它为文档、设计库、偏好和 tombstone 更新增加工作区版本
触发器，使设备可以用轻量 revision 判断云端是否变化。

### SQL Editor 备用方式

无法使用 CLI 时，可以在 Dashboard SQL Editor 中按上述顺序完整执行三个文件。
每个文件成功后再执行下一个，并保存执行记录。不要把三个文件复制到一个未审阅的大
查询中后忽略中间错误。

## 4. 验证数据库对象

在 Table Editor 或 SQL Editor 确认存在：

- `workspaces`
- `documents`
- `library_entries`
- `workspace_preferences`
- `sync_tombstones`
- `cloud_controls`
- `account_usage`
- `document_releases`

确认 `documents`、`library_entries`、`workspace_preferences` 和 `sync_tombstones` 的
变化会推进父 `workspaces.version`。确认 `workspace_revision_ready()` 对
`authenticated` 可执行，对 `anon` 不开放。

### RLS

以下表必须启用 RLS：

- `workspaces`
- `documents`
- `library_entries`
- `workspace_preferences`
- `sync_tombstones`
- `account_usage`
- `document_releases`
- `cloud_controls`

业务表只能由所有者访问。`cloud_controls` 允许匿名和登录用户只读，但禁止它们写入。
不要为了快速测试关闭 RLS，也不要添加允许所有用户读取业务表的临时 policy。

## 5. 验证 Storage

在 Storage 中确认存在：

| 项目       | 预期值            |
| ---------- | ----------------- |
| Bucket     | `design-releases` |
| Public     | 关闭              |
| MIME       | `application/zip` |
| 单文件限制 | 2 MiB             |

Migration 不会为浏览器创建直接 list/read/write/delete 的 Storage policy。交付包只能由
服务端使用 server secret 操作，下载通过所有权校验后的短时签名 URL 完成。

直接打开 Storage 对象得到 `403` 是预期结果，不要通过公开 Bucket 解决。

## 6. 获取项目密钥

从 Supabase Connect 或 API Keys 页面获取：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<public-key>
SUPABASE_SECRET_KEY=sb_secret_<server-secret>
```

| 值              | 是否可公开 | 用途                                     |
| --------------- | ---------- | ---------------------------------------- |
| Project URL     | 是         | 浏览器和服务端连接项目                   |
| publishable key | 是         | 浏览器 Auth 与受 RLS 保护的数据访问      |
| server secret   | 否         | 管理私有 Storage、签名下载、完整账户删除 |

变量名保留 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是为了兼容项目现有代码；新 Supabase 项目
可以把 publishable key 填入该变量。旧项目可用 `SUPABASE_SERVICE_ROLE_KEY` 作为
服务端回退，但新项目优先使用 `SUPABASE_SECRET_KEY`。

server secret 不得：

- 使用 `NEXT_PUBLIC_` 前缀；
- 提交到 Git；
- 放进公开 Issue、聊天记录、截图或客户端日志；
- 配到不受信任的 Preview deployment；
- 在浏览器代码中读取。

## 7. 配置本地环境

在仓库根目录创建 `.env.local`：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<public-key>
SUPABASE_SECRET_KEY=sb_secret_<server-secret>
```

如果当前只测试登录和同步，可以暂时不填 server secret；此时交付版本、签名下载和
完整账户删除不可用，但普通同步仍可测试。

重启开发服务器：

```bash
pnpm dev
```

## 8. 配额与服务端保护

### Markdown

| 限制               | 数值                      |
| ------------------ | ------------------------- |
| 草稿数             | 75                        |
| 设计库条目数       | 50                        |
| 单项 Markdown      | 256,000 bytes，即 250 KiB |
| 账户 Markdown 合计 | 1,048,576 bytes，即 1 MiB |

### 交付版本

| 限制              | 数值               |
| ----------------- | ------------------ |
| 单个 ZIP          | 2 MiB              |
| ZIP 解压内容合计  | 4 MiB              |
| 账户 Storage 合计 | 5 MiB              |
| 完成交付版本数    | 100                |
| 单来源保留        | 最新两个完成版本   |
| 生成尝试          | 每账户每小时 10 次 |
| 下载尝试          | 每账户每小时 30 次 |

`account_usage` 由触发器计算。达到个人上限后，读取、下载和删除仍应可用；增加用量的
写入会被拒绝。本地编辑不受云端额度影响。

交付下载接口会在校验所有权后创建 60 秒有效的签名 URL；不要把它记录到日志或长期分享。

## 9. `cloud_controls`

该单行表包含部署级开关：

- 是否允许新增注册；
- 是否允许增加同步用量；
- 是否允许生成交付版本；
- 可选维护提示。

客户端只能读取，维护者需要通过受控的 Dashboard/SQL 管理流程修改。关闭增长时，
应允许减少用量的编辑和删除，不能把整个云端工作区变成不可恢复的死锁。

具体运维阈值见[运维与安全](./07-operations-security.md)。

## 10. 首次功能验证

完成 [登录配置](./05-auth-email-captcha.md)后，用测试账户验证：

1. 登录后出现独立云端工作区。
2. 首次进入时可以选择性复制本地内容。
3. 复制项获得新 ID，本地原件不变。
4. 创建和编辑草稿后，Table Editor 中只出现该用户的数据。
5. 退出后恢复原本本地工作区。
6. 重新登录后恢复账户缓存并继续同步。
7. 账户界面显示服务端计算的草稿、设计库、Markdown 和交付版本用量。

这只是单账户冒烟检查。公开部署前还必须执行两个账户、两个设备、离线、冲突、配额、
交付版本和删除账户验收，见[排障与验收](./08-troubleshooting-and-acceptance.md)。

## 11. 常见 migration 问题

| 现象                     | 处理                                                     |
| ------------------------ | -------------------------------------------------------- |
| `db push` 提示历史不一致 | 停止操作，核对远端 migration history；不要盲目 repair    |
| 对象已经存在             | 检查是否手工创建过表或 Bucket，使用新的空项目最安全      |
| 第三个 migration 失败    | 确认前两个已完整成功，目标表和 `workspaces.version` 存在 |
| Bucket 公开              | 立即改为 private，检查是否误加 Storage policy            |
| 匿名用户能读业务表       | 检查 RLS 和 policy，不要继续上线                         |
| 用量与实际不一致         | 检查 usage triggers，测试新增、更新和删除后是否重算      |
