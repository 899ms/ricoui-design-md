export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">数据与隐私</h1>
      <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">本地优先</h2>
          <p className="mt-2">
            无需登录即可编辑、使用 AI、预览和本地导出。AI Key
            只保存在当前浏览器，不进入工作区同步、日志或发布文件。
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            Supabase 云同步
          </h2>
          <p className="mt-2">
            未登录的本地工作区与登录后的云端工作区互相独立。登录不会自动合并或
            覆盖本地内容；你可以明确选择项目，以新 ID 复制到云端。登录期间，草稿
            DESIGN.md、设计库 Markdown 和偏好同步到 Postgres。
          </p>
          <p className="mt-2">
            为支持自动保存和离线编辑，云端工作区会在当前设备保留按账号隔离的缓存。
            退出前应用会先尝试同步；确认退出后会清除该账号的云端缓存和同步记录，再
            恢复本地工作区。云端数据不应作为唯一或永久备份。
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">云端额度</h2>
          <p className="mt-2">
            每个账户最多保存 75 份草稿、50 个设计库项目；单项 Markdown 最大 250
            KiB，全部云端 Markdown 合计最大 1 MiB。达到上限时仍可读取、编辑已有
            内容、导出和删除，但需要释放额度后才能新增。
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">交付版本</h2>
          <p className="mt-2">
            手动生成交付版本会在私有 Storage Bucket 保存一个
            不会随后续编辑变化的
            ZIP。它不会产生公开分享链接；下载链接仅在验证所有权后生成，有效期 60
            秒。每个来源保留最新两个完成版本。
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">删除</h2>
          <p className="mt-2">
            删除草稿不会自动删除交付版本。可在交付版本管理中单独删除；删除账户会先删除交付包，再删除应用数据与登录账户。失败时停止并允许重试，不会假装已完成。
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">分析</h2>
          <p className="mt-2">
            部署者可通过环境变量启用 Google Analytics。未配置追踪 ID
            时不会加载该组件。
          </p>
        </section>
      </div>
    </main>
  )
}
