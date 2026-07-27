import { describe, expect, it } from "vitest"
import {
  evaluateDesignDocument,
  formatDocumentEvaluationDiagnostics,
} from "@/lib/document-evaluation"

describe("unified document evaluation", () => {
  it("keeps parsing, structured editing, and derivation independent", () => {
    const sourceOnly = evaluateDesignDocument("# Notes\n\nKeep this source.")
    expect(sourceOnly.parse.status).toBe("ready")
    expect(sourceOnly.structured.status).toBe("unavailable")
    expect(sourceOnly.derived.status).toBe("unavailable")
    expect(formatDocumentEvaluationDiagnostics(sourceOnly)).toContain(
      "structured-content-unavailable"
    )
  })

  it("reports a structured document with invalid tokens as partially capable", () => {
    const evaluation = evaluateDesignDocument(`# Example — Style Reference
> Example.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Primary | unknown | primary | Action |
`)
    expect(evaluation.parse.status).toBe("ready")
    expect(evaluation.structured.status).toBe("ready")
    expect(evaluation.derived.status).toBe("unavailable")
    expect(evaluation.derived.issues.length).toBeGreaterThan(0)
  })

  it("marks an exportable document ready at every level", () => {
    const evaluation = evaluateDesignDocument(`# Example — Style Reference
> Example.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Primary | #112233 | --color-primary | Action |
`)
    expect(evaluation.parse.status).toBe("ready")
    expect(evaluation.structured.status).toBe("ready")
    expect(evaluation.derived.status).toBe("ready")
  })
})
