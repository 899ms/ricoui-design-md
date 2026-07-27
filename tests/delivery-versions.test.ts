import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

describe("delivery-version information architecture", () => {
  it("keeps delivery versions out of primary navigation", () => {
    const appRail = readFileSync(
      path.join(root, "components", "app-rail.tsx"),
      "utf8"
    )

    expect(appRail).not.toContain('id: "releases"')
  })

  it("distinguishes delivery versions from sync and public sharing", () => {
    const messages = JSON.parse(
      readFileSync(path.join(root, "messages", "zh-CN.json"), "utf8")
    ) as {
      Releases: { description: string; emptyDetail: string }
      Editor: { toolbar: { cloudRelease: string; cloudPublish: string } }
    }

    expect(messages.Editor.toolbar.cloudRelease).toBe("交付版本")
    expect(messages.Editor.toolbar.cloudPublish).toBe("生成交付版本")
    expect(messages.Releases.description).toContain("不属于自动云同步")
    expect(messages.Releases.description).toContain("不会产生公开分享链接")
    expect(messages.Releases.emptyDetail).toContain(
      "日常编辑和跨设备同步不需要使用"
    )
  })
})
