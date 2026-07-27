# 07 · 运维与安全

部署成功不是结束。本章说明数据实际存放位置、需要保护的凭据、容量开关、备份恢复和
公开 Beta 的日常检查。云功能尚未在你的环境完成真实验收前，应保持 Beta 标识。

## 1. 数据存放位置

| 位置              | 保存                                                                 | 不保存                              |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------- |
| 浏览器 IndexedDB  | 未登录本地工作区、登录账户缓存、同步队列、AI 配置和 Key、网址缓存    | 其他设备的数据、可靠的长期备份      |
| Supabase Postgres | 云端草稿、设计库 Markdown、元数据、偏好、tombstone、交付元数据、用量 | AI Key、每次本地导出的 CSS/JSON/ZIP |
| Supabase Storage  | 手动创建的私有交付 ZIP                                               | 普通本地导出、任意附件、AI Key      |
| Vercel            | 请求处理、构建产物、函数日志                                         | 用户文档的长期持久化存储            |

`DESIGN.md` 是同步和恢复的主要内容。JSON、CSS 和普通 ZIP 都可从当前 Markdown
重新生成，不应建立另一份可编辑真源。

## 2. 凭据清单

### 可以公开

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 中的 publishable key
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

公开只表示可以进入客户端，不代表可以随意填写其他类型的值。

### 必须保密

- `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- 数据库密码
- Resend API Key / SMTP 密码
- Google OAuth Client Secret
- Turnstile Secret
- Supabase Access Token
- 每位用户自己的 AI API Key

### 禁止位置

- Git 历史、README 和示例截图；
- 浏览器 `NEXT_PUBLIC_` 变量；
- Issue、Pull Request、聊天记录和公开构建日志；
- 不受信任的 Preview；
- DESIGN.md、设计库描述和备份文件名。

## 3. 密钥轮换

建议维护一份不含明文值的资产登记表，记录凭据用途、负责人、创建日期、最近轮换和
影响环境。

发生疑似泄露时：

1. 先在供应商处撤销或轮换泄露凭据。
2. 更新 Vercel、Supabase 或对应 Secret Store。
3. 重新部署使用构建时公开变量的应用。
4. 检查泄露时间范围内的 Auth、函数、数据库、Storage 和邮件日志。
5. 如凭据进入 Git，轮换后再清理历史；只删除当前文件不够。
6. 记录影响、修复和后续预防措施。

## 4. 容量与 `cloud_controls`

`cloud_controls` 是单行部署开关表：

| 字段                   | 作用                             |
| ---------------------- | -------------------------------- |
| `registration_enabled` | 是否允许应用显示并接受新注册     |
| `sync_growth_enabled`  | 是否允许新增或增加 Markdown 用量 |
| `releases_enabled`     | 是否允许创建新的交付版本         |
| `message`              | 可选维护说明，最多 500 bytes     |

匿名和登录用户只有读取权限。维护者只能通过受控管理流程修改。

### 推荐容量响应

以下百分比是项目运维策略，不是 migration 自动执行的阈值：

| 项目资源使用率 | 建议操作                                       |
| -------------- | ---------------------------------------------- |
| 70%            | 调查增长来源，确认备份和清理策略               |
| 80%            | 关闭新注册，通知维护者和用户清理               |
| 85%            | 关闭同步增长和新交付版本，保留读取、下载和删除 |

示例 SQL 仅应由有权限的维护者在确认目标项目后执行：

```sql
update public.cloud_controls
set registration_enabled = false,
    message = 'Cloud capacity is under maintenance.',
    updated_at = now()
where singleton = true;
```

严重容量压力下：

```sql
update public.cloud_controls
set registration_enabled = false,
    sync_growth_enabled = false,
    releases_enabled = false,
    message = 'New cloud usage is temporarily paused.',
    updated_at = now()
where singleton = true;
```

恢复前确认数据库和 Storage 已回到安全范围，再逐项打开。不要删除用户内容来静默恢复
容量，也不要关闭读取和删除通道。

## 5. 日常检查

### 每周

- Supabase Database 和 Storage 使用量；
- `account_usage` 是否持续异常增长；
- pending / deleting 交付记录是否长期残留；
- Auth 失败、异常注册和 CAPTCHA 拒绝；
- Resend 投递、退信和投诉；
- Vercel 函数错误、超时和流量；
- AI 代理是否出现未知 hostname 或异常费用。

### 每月

- 恢复一份数据库和 Storage 备份到隔离环境；
- 检查 RLS 和 Bucket 仍为私有；
- 检查 Redirect URL、OAuth Origin 和 Turnstile Hostname；
- 审查有权访问 Vercel、Supabase、Resend、Google 和 Cloudflare 的成员；
- 检查依赖、安全公告和供应商套餐变化；
- 用两个账号重新执行关键隔离路径。

## 6. 备份

### 用户级备份

账户设置可以导出草稿和设计库的原始 Markdown。提醒用户定期下载，云端不应是唯一
副本。AI Key 和设备设置不会进入备份。

### 部署级备份

至少覆盖：

- Postgres schema、业务表、Auth 关联数据和 migration history；
- `design-releases` Bucket 的对象；
- 交付元数据与对象路径的一致关系；
- 邮件模板源文件和当前外部配置记录；
- 不含明文 Secret 的环境变量名称与部署清单。

具体备份能力取决于 Supabase 套餐，应以官方控制台为准。仅导出数据库而不备份
Storage，会留下无法下载的交付元数据；只备份 Storage 而没有数据库，则无法可靠恢复
所有权和摘要。

## 7. 恢复演练

在隔离项目中执行，不要直接覆盖生产：

1. 创建与生产隔离的 Supabase 项目。
2. 应用与生产相同的 migration。
3. 恢复数据库数据并核对 owner/workspace 关系。
4. 恢复 Storage 对象，保持 object path 不变。
5. 抽样核对 ZIP SHA-256、大小和 manifest。
6. 使用测试部署和测试账号验证读取、签名下载和恢复草稿。
7. 确认没有把生产邮件、OAuth 或 CAPTCHA Secret 带入测试环境。

恢复完成的标准不是“SQL 导入成功”，而是所有权、RLS、对象、签名下载和应用行为均
通过验证。

## 8. 交付版本生命周期

- 创建前必须完成来源同步和派生检查；
- 服务端读取 Postgres 中同一版本 Markdown，不接受浏览器任意 ZIP 上传；
- 每来源保留最新两个完成版本；
- 第三个版本完全完成后才清理最旧版本；
- 删除来源不删除交付版本；
- 删除版本需要同时处理 Storage 对象和元数据；
- 恢复始终新建本地草稿；
- 下载通过短时签名 URL，不公开 Bucket。

长期 pending 或 deleting 记录需要先调查服务端日志和 Storage 状态，不能直接批量删表
行。先确认对象是否存在，再选择重试、补偿或人工清理。

## 9. 账户删除

完整删除需要 server secret。服务端先删除该账户的交付对象，再删除应用数据和 Auth
用户；任何阶段失败都应停止并允许重试，不能只在界面显示成功。

验收时确认：

- Storage 中没有该用户对象；
- 业务表、用量、交付元数据和 Auth 用户已删除；
- 当前设备清理账户缓存并恢复本地工作区；
- 另一个账号的数据不受影响；
- 部分失败后可以安全重试。

## 10. 日志与隐私

日志中可以记录请求 ID、阶段、状态码和非敏感错误码，但不要记录：

- AI 请求正文和 API Key；
- Magic Link、OAuth code、session token；
- server secret、SMTP 密码、Turnstile Secret；
- 用户完整 Markdown；
- 签名下载 URL。

公开部署者需要根据所在地区补充自己的隐私政策、数据保留、分析同意、供应商清单和
联系方式。仓库内 `/privacy` 说明的是产品代码的数据边界，不能自动替代部署者的法律
义务。

## 11. 免费方案和 SLA

免费 Supabase 或 Vercel 项目可能有暂停、额度、日志、备份和执行时长限制。不要向
用户承诺供应商没有提供的可用性。需要正式商业 SLA 时，应升级方案、增加监控和恢复
演练，而不是依赖未验证的免费配置。

## 12. 开源发布前检查

- [ ] 保留公开仓库现有的 Apache License 2.0 `LICENSE`。
- [ ] README、指南、域名、联系信息和隐私说明已替换私人部署内容。
- [ ] Git 历史和示例不含 Secret、生产数据或私人素材。
- [ ] 品牌参考、字体、图片和示例拥有可再分发权限。
- [ ] 配置示例只含占位值。
- [ ] 贡献与安全报告方式明确。
- [ ] 真实 Supabase/Vercel 验收记录仍诚实标注为完成或未完成。

公开发布时不得遗漏或覆盖目标仓库现有的 `LICENSE`。
