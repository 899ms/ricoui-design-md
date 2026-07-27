# 03 · AI 配置

AI 是可选能力。不开启 AI 时，编辑、预览、设计库、品牌参考和本地导出仍可使用。
本项目不提供平台统一 Key；每位使用者在自己的浏览器中配置 Provider 和 API Key。

## 1. AI 可以做什么

- 从公开 HTTPS 网站生成一份可编辑的 `DESIGN.md` 草稿；
- 分析当前文档的结构、Token 和导出影响；
- 解释错误或回答与当前文档有关的问题；
- 定点修复 Token、格式和结构问题；
- 规范化普通 Markdown；
- 在保留内容的前提下调整颜色、字体、圆角、阴影和组件说明。

打开 AI 面板不会发送文档。只有点击分析、生成、发送或修复时，相关内容才会传给
当前选中的 Provider。任何文档修改都必须先显示候选和差异，再由使用者明确应用。

## 2. 内置 Provider

以下配置来自当前 `lib/ai/providers.ts`。模型列表会随代码和服务商变化，最终以应用中
显示的配置、Provider 官方控制台和“测试连接”结果为准。

| Provider           | 默认 Base URL                                 | 模型列表   | 默认传输           |
| ------------------ | --------------------------------------------- | ---------- | ------------------ |
| DeepSeek           | `https://api.deepseek.com/v1`                 | 支持获取   | 自动，通常使用代理 |
| Anthropic / Claude | `https://api.anthropic.com/v1`                | 不自动获取 | 自动，通常使用代理 |
| 火山方舟           | `https://ark.cn-beijing.volces.com/api/v3`    | 支持获取   | 自动，通常使用代理 |
| OpenRouter         | `https://openrouter.ai/api/v1`                | 支持获取   | 自动，可浏览器直连 |
| Z.AI / GLM         | `https://open.bigmodel.cn/api/paas/v4`        | 支持获取   | 自动，通常使用代理 |
| GLM Coding Plan    | `https://open.bigmodel.cn/api/coding/paas/v4` | 使用预设   | 自动，实验性兼容   |
| 自定义             | 自行填写                                      | 视端点而定 | 默认代理           |

Anthropic 预设只使用项目现有的兼容调用方式，高级原生能力不在本项目范围内。配置后
必须实际运行“测试连接”，不要仅凭 Base URL 判断可用。

## 3. 创建配置

1. 打开“设置 → AI 服务”。
2. 确认“启用 AI”已经打开。
3. 选择内置 Provider，或新增自定义配置。
4. 填写 API Key。
5. 选择预设模型，或输入账户实际可用的模型 ID。
6. Provider 支持模型列表时，点击“获取模型”再选择。
7. 点击“测试连接”。
8. 保存并将该配置设为当前使用项。

一个浏览器可以保存多个配置，例如分别用于快速分析和复杂网站生成。每次任务都可以
切换配置，不需要修改环境变量。

### 成功标准

- 测试连接明确显示成功；
- 当前模型存在于账户权限范围；
- 发起一个短问题后能收到可见正文；
- 刷新浏览器后配置仍存在；
- 登录或退出 Supabase 不会把 Key 复制到云端。

## 4. 自定义 OpenAI-compatible 服务

自定义服务至少需要：

- HTTPS Base URL；
- `chat/completions` 兼容端点；
- 该服务签发的 API Key；
- 可用模型 ID；
- 如需“获取模型”，还应提供兼容的 `models` 端点。

填写 Base URL 时不要手动附加 `/chat/completions`。例如：

```text
https://api.example.com/v1
```

服务端代理会按任务追加 `/chat/completions` 或 `/models`。

### 地址校验规则

代理只接受：

- `https://`；
- 不包含用户名和密码；
- 不包含 query 或 hash；
- 路径中没有 `..`；
- 不是 `localhost`、`.local`、云元数据地址或私有 IP；
- DNS 解析结果不指向私有网络；
- 配置白名单时，hostname 必须精确出现在白名单中。

因此，部署在家庭局域网、公司内网或本机的兼容服务不能通过该代理访问。这是 SSRF
安全边界，不应为了方便而关闭。

## 5. 选择传输方式

### 自动

根据 Provider 预设选择。已知浏览器 CORS 可用的 Provider 可以直连，其余通过应用的
同源 Route Handler 转发。自定义 Provider 默认走代理。

### 浏览器直连

请求从浏览器直接发到 Provider。优点是请求不经过部署者的服务器；缺点是 Provider
必须允许浏览器 CORS，而且 API Key 会出现在浏览器向 Provider 发出的网络请求中。

### 同源安全代理

浏览器把 Base URL、模型和 Key 发给当前应用的 `/api/ai-proxy`，服务端完成地址校验
后转发。应用代码不会把 Key 写入数据库或日志，但部署基础设施仍处于请求路径中。
自建实例的维护者应限制日志权限，并确认托管平台的数据处理政策。

## 6. 配置主机白名单

`AI_PROXY_ALLOWED_HOSTS` 是服务端环境变量，使用逗号分隔 hostname，不写协议、路径
或通配符。

```dotenv
AI_PROXY_ALLOWED_HOSTS=api.deepseek.com,api.anthropic.com,open.bigmodel.cn
```

设置后，代理只允许列表中的精确 hostname。新增 Provider 时必须同步更新并重新部署。
不设置时仍会执行 HTTPS、凭据、私网地址和 DNS 校验，但允许任意通过这些安全检查的
公网 hostname。

对于公开部署，建议配置白名单；对于需要大量自定义 Provider 的私人实例，可以保持
未设置，但要持续关注代理滥用和函数费用。

## 7. 全局关闭 AI

在 `.env.local` 或 Vercel 环境变量中设置：

```dotenv
NEXT_PUBLIC_AI_ENABLED=false
```

重新构建或重新部署后，服务端 AI 路由会拒绝请求，界面也会隐藏或禁用对应功能。
删除变量或改为其他值后需要再次构建。

应用内“启用 AI”开关只影响当前浏览器，不删除保存的配置；环境变量是整个部署实例的
总开关。

## 8. GLM Thinking 与 Coding Plan

GLM 可能将思考内容和可见正文分开返回。项目对任务做以下处理：

- 标准化、Assistant、修复和分析固定关闭 Thinking；
- 网址生成等复杂任务才会按“深度思考”开关启用；
- 响应结束仍没有可见正文时，任务明确失败，不保存空结果；
- Thinking 默认关闭。

GLM Coding Plan 是实验性兼容配置。服务商面向指定编码工具提供该端点，本项目可能
遇到套餐限制、限流或拒绝请求。优先使用标准 Z.AI / GLM API；只有确认账户套餐允许
时再尝试 Coding Plan。

## 9. 常见错误

| 现象                   | 可能原因                                 | 处理                                         |
| ---------------------- | ---------------------------------------- | -------------------------------------------- |
| `401`                  | Key 无效或缺失                           | 重新复制 Key，检查是否含空格                 |
| `403`                  | 模型、端点或套餐无权限                   | 在 Provider 控制台确认权限                   |
| `404`                  | Base URL 或模型 ID 错误                  | Base URL 不要包含 chat endpoint，核对模型 ID |
| `429` / `503` / `1305` | 服务繁忙或限流                           | 稍后重试、换模型或标准端点                   |
| 没有可见正文           | 模型只返回 reasoning，或响应中断         | 关闭 Thinking、换模型、使用标准端点          |
| 浏览器直连失败         | Provider 不允许 CORS                     | 改用同源代理                                 |
| 主机不在白名单         | `AI_PROXY_ALLOWED_HOSTS` 未包含 hostname | 更新服务端变量并重新部署                     |
| 地址解析到私网         | DNS 或 Base URL 指向内网                 | 使用公开 HTTPS Provider，不绕过安全检查      |
| 获取不到模型           | Provider 不提供兼容列表                  | 手动输入官方控制台显示的模型 ID              |

更多跨模块排查见[排障与验收](./08-troubleshooting-and-acceptance.md)。

## 10. 数据与隐私检查

- [ ] Key 没有写入 Markdown、截图、Issue、日志或 Git。
- [ ] 已阅读所选 Provider 的数据保留和训练政策。
- [ ] 敏感文档只在明确允许的情况下发送。
- [ ] 公共实例已考虑配置 `AI_PROXY_ALLOWED_HOSTS`。
- [ ] 修改 AI 总开关或公开变量后已经重新构建。
- [ ] 应用 AI 修订前已经检查完整差异。
