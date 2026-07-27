"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

// Layout-only UI preferences. Deliberately separate from document data —
// never mixed into rawMarkdown, parser output, Library entry Markdown, or
// Brand package metadata (V7-PRD §8.5, §10).
interface UiPreferencesState {
  hasHydrated: boolean
  // Global left navigation rail (icon-only vs pinned expanded with labels).
  railExpanded: boolean
  // /editor secondary Workspace document sidebar.
  workspaceSidebarCollapsed: boolean
  // /editor Document view right Outline panel.
  outlineCollapsed: boolean
  outlineSummaryCollapsed: boolean
  sourceEditorWrap: boolean
  // Resource (/documents, /library, /brands) filter sidebars.
  resourceFilterCollapsed: boolean
  aiWorkspaceWidth: number
  setRailExpanded: (expanded: boolean) => void
  toggleRailExpanded: () => void
  setWorkspaceSidebarCollapsed: (collapsed: boolean) => void
  toggleWorkspaceSidebarCollapsed: () => void
  setOutlineCollapsed: (collapsed: boolean) => void
  toggleOutlineCollapsed: () => void
  setOutlineSummaryCollapsed: (collapsed: boolean) => void
  toggleOutlineSummaryCollapsed: () => void
  setSourceEditorWrap: (enabled: boolean) => void
  toggleSourceEditorWrap: () => void
  setResourceFilterCollapsed: (collapsed: boolean) => void
  setAiWorkspaceWidth: (width: number) => void
  toggleResourceFilterCollapsed: () => void
  setHasHydrated: (hydrated: boolean) => void
}

export const useUiPreferences = create<UiPreferencesState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      railExpanded: true,
      workspaceSidebarCollapsed: false,
      outlineCollapsed: false,
      outlineSummaryCollapsed: false,
      sourceEditorWrap: true,
      resourceFilterCollapsed: false,
      aiWorkspaceWidth: 520,
      setRailExpanded: (railExpanded) => set({ railExpanded }),
      toggleRailExpanded: () =>
        set((state) => ({ railExpanded: !state.railExpanded })),
      setWorkspaceSidebarCollapsed: (workspaceSidebarCollapsed) =>
        set({ workspaceSidebarCollapsed }),
      toggleWorkspaceSidebarCollapsed: () =>
        set((state) => ({
          workspaceSidebarCollapsed: !state.workspaceSidebarCollapsed,
        })),
      setOutlineCollapsed: (outlineCollapsed) => set({ outlineCollapsed }),
      toggleOutlineCollapsed: () =>
        set((state) => ({ outlineCollapsed: !state.outlineCollapsed })),
      setOutlineSummaryCollapsed: (outlineSummaryCollapsed) =>
        set({ outlineSummaryCollapsed }),
      toggleOutlineSummaryCollapsed: () =>
        set((state) => ({
          outlineSummaryCollapsed: !state.outlineSummaryCollapsed,
        })),
      setSourceEditorWrap: (sourceEditorWrap) => set({ sourceEditorWrap }),
      toggleSourceEditorWrap: () =>
        set((state) => ({ sourceEditorWrap: !state.sourceEditorWrap })),
      setResourceFilterCollapsed: (resourceFilterCollapsed) =>
        set({ resourceFilterCollapsed }),
      setAiWorkspaceWidth: (aiWorkspaceWidth) => set({ aiWorkspaceWidth }),
      toggleResourceFilterCollapsed: () =>
        set((state) => ({
          resourceFilterCollapsed: !state.resourceFilterCollapsed,
        })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "design-md-ui-prefs",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Defer rehydration to the client only — AppShell triggers it after
      // mount so the first client render matches the SSR defaults and avoids
      // hydration mismatches on layout-driven widths.
      skipHydration: true,
      partialize: (state) => ({
        railExpanded: state.railExpanded,
        workspaceSidebarCollapsed: state.workspaceSidebarCollapsed,
        outlineCollapsed: state.outlineCollapsed,
        outlineSummaryCollapsed: state.outlineSummaryCollapsed,
        sourceEditorWrap: state.sourceEditorWrap,
        resourceFilterCollapsed: state.resourceFilterCollapsed,
        aiWorkspaceWidth: state.aiWorkspaceWidth,
      }),
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<UiPreferencesState>
        return {
          ...state,
          // Apply the new expanded-by-default decision once to existing
          // device preferences. Later manual collapses are stored as v1.
          railExpanded: version < 1 ? true : (state.railExpanded ?? true),
        } as UiPreferencesState
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
