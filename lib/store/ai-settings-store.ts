"use client"

import { create } from "zustand"
import {
  loadAiSettings,
  saveAiSettings,
} from "@/lib/storage/workspace-persistence"
import { fetchAiModels } from "@/lib/ai/ai-client"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"
import {
  createProviderProfile,
  type AiProviderPresetId,
  type AiProviderProfile,
  type AiSettings,
  type AiSettingsState,
} from "@/lib/ai/providers"

const DEFAULT_PROFILE = createProviderProfile("deepseek", "default-deepseek")

export const DEFAULT_AI_SETTINGS: AiSettingsState = {
  version: 2,
  aiEnabled: true,
  activeProfileId: DEFAULT_PROFILE.id,
  profiles: [DEFAULT_PROFILE],
}

interface AiSettingsStore extends AiSettingsState, AiSettings {
  hydrated: boolean
  hydrating: boolean
  updateSettings: (patch: Partial<AiSettings>) => void
  selectProvider: (providerId: string) => void
  selectProfile: (profileId: string) => void
  createProfile: (providerId: AiProviderPresetId) => string
  updateProfile: (profileId: string, patch: Partial<AiProviderProfile>) => void
  deleteProfile: (profileId: string) => void
  setAiEnabled: (enabled: boolean) => void
  setDiscoveredModels: (profileId: string, models: string[]) => void
  fetchModels: (
    profileId: string,
    signal?: AbortSignal,
    locale?: Locale
  ) => Promise<string[]>
  saveNow: () => Promise<void>
  hydrate: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function activeFields(profile: AiProviderProfile): AiSettings {
  return {
    providerId: profile.providerId,
    baseURL: profile.baseURL,
    model: profile.model,
    apiKey: profile.apiKey,
    transport: profile.transport,
    thinkingMode: profile.thinkingMode,
  }
}

function persisted(state: AiSettingsStore): AiSettingsState {
  return {
    version: 2,
    aiEnabled: state.aiEnabled,
    activeProfileId: state.activeProfileId,
    profiles: state.profiles,
  }
}

function scheduleSave(state: AiSettingsStore) {
  if (!state.hydrated) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void saveAiSettings(persisted(state)), 250)
}

export function migrateAiSettings(saved: unknown): AiSettingsState {
  if (saved && typeof saved === "object") {
    const value = saved as Record<string, unknown>
    if (value.version === 2 && Array.isArray(value.profiles)) {
      const profiles = value.profiles as AiProviderProfile[]
      if (profiles.length > 0) {
        const activeProfileId = profiles.some(
          (p) => p.id === value.activeProfileId
        )
          ? String(value.activeProfileId)
          : profiles[0].id
        return {
          version: 2,
          aiEnabled: value.aiEnabled !== false,
          activeProfileId,
          profiles,
        }
      }
    }
    if (typeof value.providerId === "string") {
      const providerId = value.providerId as AiProviderPresetId
      const legacy = createProviderProfile(providerId, `migrated-${providerId}`)
      Object.assign(legacy, {
        baseURL:
          typeof value.baseURL === "string" ? value.baseURL : legacy.baseURL,
        model: typeof value.model === "string" ? value.model : legacy.model,
        apiKey: typeof value.apiKey === "string" ? value.apiKey : "",
        transport: value.transport ?? legacy.transport,
        thinkingMode: value.thinkingMode !== false,
      })
      return {
        version: 2,
        aiEnabled: value.aiEnabled !== false,
        activeProfileId: legacy.id,
        profiles: [legacy],
      }
    }
  }
  return DEFAULT_AI_SETTINGS
}

export const useAiSettingsStore = create<AiSettingsStore>((set, get) => ({
  ...DEFAULT_AI_SETTINGS,
  ...activeFields(DEFAULT_PROFILE),
  hydrated: false,
  hydrating: false,

  updateSettings: (patch) => {
    get().updateProfile(get().activeProfileId, patch)
  },
  selectProvider: (providerId) => {
    const existing = get().profiles.find((p) => p.providerId === providerId)
    if (existing) get().selectProfile(existing.id)
    else get().createProfile(providerId as AiProviderPresetId)
  },
  selectProfile: (profileId) => {
    const profile = get().profiles.find((item) => item.id === profileId)
    if (!profile) return
    set({ activeProfileId: profileId, ...activeFields(profile) })
    scheduleSave(get())
  },
  createProfile: (providerId) => {
    const profile = createProviderProfile(providerId)
    const sameProviderCount = get().profiles.filter(
      (item) => item.providerId === providerId
    ).length
    if (sameProviderCount > 0)
      profile.name = `${profile.name} ${sameProviderCount + 1}`
    set((state) => ({
      profiles: [...state.profiles, profile],
      activeProfileId: profile.id,
      ...activeFields(profile),
    }))
    scheduleSave(get())
    return profile.id
  },
  updateProfile: (profileId, patch) => {
    set((state) => {
      const profiles = state.profiles.map((profile) =>
        profile.id === profileId ? { ...profile, ...patch } : profile
      )
      const active = profiles.find(
        (profile) => profile.id === state.activeProfileId
      )
      return { profiles, ...(active ? activeFields(active) : {}) }
    })
    scheduleSave(get())
  },
  deleteProfile: (profileId) => {
    set((state) => {
      if (state.profiles.length <= 1) return state
      const profiles = state.profiles.filter(
        (profile) => profile.id !== profileId
      )
      const activeProfileId =
        state.activeProfileId === profileId
          ? profiles[0].id
          : state.activeProfileId
      const active = profiles.find((profile) => profile.id === activeProfileId)!
      return { profiles, activeProfileId, ...activeFields(active) }
    })
    scheduleSave(get())
  },
  setAiEnabled: (aiEnabled) => {
    set({ aiEnabled })
    scheduleSave(get())
  },
  setDiscoveredModels: (profileId, discoveredModels) => {
    get().updateProfile(profileId, { discoveredModels })
  },
  fetchModels: async (profileId, signal, locale = DEFAULT_LOCALE) => {
    const profile = get().profiles.find((item) => item.id === profileId)
    if (!profile)
      throw new Error(
        locale === "en" ? "AI configuration not found" : "AI 配置不存在"
      )
    const models = await fetchAiModels(profile, signal, locale)
    get().setDiscoveredModels(profileId, models)
    return models
  },
  saveNow: async () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    await saveAiSettings(persisted(get()))
  },
  hydrate: async () => {
    if (get().hydrated || get().hydrating) return
    set({ hydrating: true })
    try {
      const next = migrateAiSettings(await loadAiSettings<unknown>())
      const active =
        next.profiles.find((p) => p.id === next.activeProfileId) ??
        next.profiles[0]
      set({
        ...next,
        ...activeFields(active),
        hydrated: true,
        hydrating: false,
      })
    } catch {
      set({ hydrated: true, hydrating: false })
    }
  },
}))
