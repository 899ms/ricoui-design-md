import type {
  ColorToken,
  ImportDiagnosticsReport,
  ImportSuggestion,
  ParseResult,
  PreviewSemanticValue,
} from "@/lib/types/tokens"

function includesRole(currentRole: string, nextRole: string) {
  return currentRole
    .toLowerCase()
    .split(/[,\s/|]+/)
    .filter(Boolean)
    .includes(nextRole.toLowerCase())
}

function appendRole(currentRole: string, nextRole: string) {
  if (includesRole(currentRole, nextRole)) return currentRole
  if (!currentRole.trim()) return nextRole
  return `${currentRole}, ${nextRole}`
}

function findColorIndexBySemanticValue(
  colors: ColorToken[],
  semantic: PreviewSemanticValue<string>
) {
  if (semantic.token) {
    const tokenIndex = colors.findIndex(
      (color) => color.token === semantic.token
    )
    if (tokenIndex >= 0) return tokenIndex
  }

  if (semantic.label) {
    const labelIndex = colors.findIndex(
      (color) => color.name === semantic.label
    )
    if (labelIndex >= 0) return labelIndex
  }

  return colors.findIndex(
    (color) =>
      color.value.trim().toLowerCase() === semantic.value.trim().toLowerCase()
  )
}

function confidenceFromResolution(
  resolution: PreviewSemanticValue<unknown>["resolution"]
): ImportSuggestion["confidence"] {
  switch (resolution) {
    case "explicit":
      return "high"
    case "inferred":
      return "medium"
    case "fallback":
      return "low"
  }
}

function formatResolution(
  resolution: PreviewSemanticValue<unknown>["resolution"]
) {
  switch (resolution) {
    case "explicit":
      return "显式配置"
    case "inferred":
      return "推断"
    case "fallback":
      return "备用值"
  }
}

function createDescriptionDraft(result: ParseResult) {
  const { meta } = result.tokens
  const componentCount = result.tokens.components.length
  const colorCount =
    result.tokens.colors.length + result.tokens.gradients.length
  const typeCount =
    result.tokens.typography.fontFamilies.length +
    result.tokens.typography.typeScale.length
  const mood = meta.theme === "dark" ? "深色" : "浅色"

  return `${meta.name || "这个设计系统"} 是一套${mood}模式设计系统，包含 ${colorCount} 个色彩条目、${typeCount} 个字体与字阶定义，以及 ${componentCount} 个已记录组件。`
}

function createComponentRoleSuggestion(name: string) {
  const normalized = name.toLowerCase()

  if (normalized.includes("button")) return "Primary action"
  if (normalized.includes("card")) return "Surface container"
  if (normalized.includes("input") || normalized.includes("field"))
    return "Form control"
  if (normalized.includes("nav") || normalized.includes("menu"))
    return "Navigation"
  if (normalized.includes("badge") || normalized.includes("tag"))
    return "Status indicator"
  if (normalized.includes("alert") || normalized.includes("toast"))
    return "Feedback"

  return ""
}

function createMetadataDraft(result: ParseResult) {
  const { meta, components } = result.tokens
  const semantics = result.previewSemantics

  return [
    `# 建议的预览元数据`,
    "",
    `文档：${meta.name || "未命名文档"}`,
    `主题模式：${meta.theme}`,
    `主色：${semantics.colors.primary.label || semantics.colors.primary.token || semantics.colors.primary.value}`,
    `界面层颜色：${semantics.colors.surface.label || semantics.colors.surface.token || semantics.colors.surface.value}`,
    `文本颜色：${semantics.colors.text.label || semantics.colors.text.token || semantics.colors.text.value}`,
    `展示字体：${semantics.typography.displayFont.label || semantics.typography.displayFont.token || semantics.typography.displayFont.value}`,
    `正文字体：${semantics.typography.bodyFont.label || semantics.typography.bodyFont.token || semantics.typography.bodyFont.value}`,
    `关键组件：${
      components
        .slice(0, 4)
        .map((component) => component.name)
        .join(", ") || "暂无"
    }`,
    "",
    "可将这份草稿作为清单，用于完善预览元数据或记录语义别名。",
  ].join("\n")
}

export function buildImportDiagnostics(
  result: ParseResult,
  rawMarkdown: string
): ImportDiagnosticsReport {
  const suggestions: ImportSuggestion[] = []
  const warnings: string[] = []

  Object.entries(result.previewSemantics.colors).forEach(([slot, semantic]) => {
    if (semantic.resolution === "explicit") return

    const colorIndex = findColorIndexBySemanticValue(
      result.tokens.colors,
      semantic
    )
    if (colorIndex < 0) return

    const color = result.tokens.colors[colorIndex]
    const nextRole = appendRole(color.role, slot)
    if (nextRole === color.role) return

    suggestions.push({
      id: `color-role-${slot}-${colorIndex}`,
      category: "semantic-role",
      title: `将 ${color.name} 标记为 ${slot}`,
      description: `明确 ${slot} 语义映射，让预览和导出不再依赖推断。`,
      rationale: `预览当前通过${formatResolution(semantic.resolution)}解析 ${slot}。把该角色写回颜色 token 后，就能在 DESIGN.md 中追踪这条映射。`,
      confidence: confidenceFromResolution(semantic.resolution),
      preview: `${color.role || "(空)"} -> ${nextRole}`,
      action: {
        type: "set-color-role",
        index: colorIndex,
        role: nextRole,
      },
    })
  })
  ;(
    [
      ["display", result.previewSemantics.typography.displayFont],
      ["body", result.previewSemantics.typography.bodyFont],
    ] as const
  ).forEach(([slot, semantic]) => {
    if (semantic.resolution === "explicit") return

    const fontIndex = result.tokens.typography.fontFamilies.findIndex(
      (font) =>
        (semantic.token && font.token === semantic.token) ||
        (semantic.label && font.name === semantic.label) ||
        font.substitute === semantic.value ||
        font.name === semantic.value
    )

    if (fontIndex < 0) return

    const font = result.tokens.typography.fontFamilies[fontIndex]
    const nextRole = appendRole(font.role, slot)
    if (nextRole === font.role) return

    suggestions.push({
      id: `font-role-${slot}-${fontIndex}`,
      category: "semantic-role",
      title: `将 ${font.name} 标记为 ${slot} 字体`,
      description: `把 ${slot} 字体映射从推断改为显式配置，让预览排版更稳定。`,
      rationale: `当前预览在文档中没有显式角色标签的情况下解析了 ${slot} 字体。`,
      confidence: confidenceFromResolution(semantic.resolution),
      preview: `${font.role || "(空)"} -> ${nextRole}`,
      action: {
        type: "set-font-role",
        index: fontIndex,
        role: nextRole,
      },
    })
  })

  result.tokens.components.forEach((component, index) => {
    if (component.role.trim()) return
    const suggestedRole = createComponentRoleSuggestion(component.name)
    if (!suggestedRole) return

    suggestions.push({
      id: `component-role-${index}`,
      category: "semantic-role",
      title: `为 ${component.name} 添加角色`,
      description: `记录这个组件的用途，方便理解导入和导出的语义。`,
      rationale: `组件已有说明文字，但显式角色字段目前为空。`,
      confidence: "medium",
      preview: `(空) -> ${suggestedRole}`,
      action: {
        type: "set-component-role",
        index,
        role: suggestedRole,
      },
    })
  })

  if (!result.tokens.meta.description.trim()) {
    const draftDescription = createDescriptionDraft(result)
    suggestions.push({
      id: "meta-description",
      category: "missing-field",
      title: "添加文档描述",
      description:
        "补齐顶层摘要，让文档更像一份持续维护的设计规范，而不只是 token 列表。",
      rationale: "文档开头缺少描述区块，会削弱上下文说明和导出质量。",
      confidence: "medium",
      preview: draftDescription,
      action: {
        type: "set-meta-description",
        description: draftDescription,
      },
    })
  }

  const hasExplicitTheme = /\*\*Theme:\*\*\s*(light|dark)/i.test(rawMarkdown)
  if (!hasExplicitTheme) {
    suggestions.push({
      id: "meta-theme",
      category: "missing-field",
      title: "显式写入主题模式",
      description: `将当前 ${result.tokens.meta.theme} 主题写入源文档，保证导入结果稳定。`,
      rationale: "解析器可以推断备用主题，但当前 Markdown 没有显式声明。",
      confidence: "medium",
      preview: `Theme -> ${result.tokens.meta.theme}`,
      action: {
        type: "set-meta-theme",
        theme: result.tokens.meta.theme,
      },
    })
  }

  if (result.sectionSkeleton.some((section) => !section.modeled)) {
    warnings.push(
      "文档仍包含未建模区块。结构化编辑会保留这些内容，但相关导入指导只能只读展示。"
    )
  }

  if (result.previewSemantics.diagnostics.length > 0) {
    warnings.push(
      ...result.previewSemantics.diagnostics.map(
        (diagnostic) => `${diagnostic.slot}: ${diagnostic.message}`
      )
    )
  }

  if (result.tokens.components.length === 0) {
    warnings.push(
      "没有解析到组件区块。预览语义仍可渲染，但源文档缺少组件层面的指导。"
    )
  }

  if (!result.rawSections.layout.trim()) {
    warnings.push(
      "布局说明为空。建议补充数字化布局 token 之外的间距意图和容器行为。"
    )
  }

  if (
    result.tokens.typography.fontFamilies.length === 0 ||
    result.tokens.typography.typeScale.length === 0
  ) {
    warnings.push(
      "当前解析结果未包含字体栈或字阶条目；如有需要，可补充这些信息以改善排版预览。"
    )
  }

  return {
    summary: {
      suggestions: suggestions.length,
      actionable: suggestions.filter(
        (suggestion) => suggestion.action.type !== "none"
      ).length,
      warnings: warnings.length,
    },
    suggestions,
    warnings,
    metadataDraft: createMetadataDraft(result),
  }
}
