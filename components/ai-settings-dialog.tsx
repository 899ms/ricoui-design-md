"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  Cloud,
  Database,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  Moon,
  Plus,
  RefreshCw,
  Settings2,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import { testAiConnection } from "@/lib/ai/ai-client"
import {
  getAiUserFacingError,
  isProviderBusyError,
} from "@/lib/ai/provider-error"
import {
  AI_PROVIDERS,
  getAiProvider,
  type AiProviderPresetId,
} from "@/lib/ai/providers"
import { useAiSettingsStore } from "@/lib/store/ai-settings-store"
import { useUiPreferences } from "@/lib/store/ui-preferences"
import { isAppThemeId } from "@/lib/themes/app-themes"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { useSyncState } from "@/lib/sync/sync-state"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { markLanguagePromptHandled, setAppLocale } from "@/lib/i18n/client"
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/config"

export type SettingsSection = "general" | "ai" | "data" | "account"

const SECTIONS = [
  { id: "general" as const, icon: Settings2 },
  { id: "ai" as const, icon: Bot },
  { id: "data" as const, icon: Database },
  { id: "account" as const, icon: UserRound },
]

export function AiSettingsDialog({
  open,
  section,
  onSectionChange,
  onClose,
}: {
  open: boolean
  section: SettingsSection
  onSectionChange: (section: SettingsSection) => void
  onClose: () => void
}) {
  const t = useTranslations("Settings")
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      label={t("title")}
      overlayClassName="p-0 md:p-4"
      className="h-[100dvh] max-h-[100dvh] max-w-none overflow-hidden rounded-none md:h-[min(680px,88dvh)] md:max-h-[88vh] md:max-w-[min(920px,92vw)] md:rounded-xl"
      hideCloseButton
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr] md:grid-cols-[190px_1fr] md:grid-rows-1">
        <aside className="border-b border-border/70 bg-muted/50 p-2 md:border-r md:border-b-0 md:p-3">
          <div className="hidden h-11 items-center px-2 text-base font-semibold md:flex">
            {t("title")}
          </div>
          <nav
            className="flex [scrollbar-width:none] gap-1 overflow-x-auto md:flex-col [&::-webkit-scrollbar]:hidden"
            aria-label={t("sectionsAria")}
          >
            {SECTIONS.map((item) => {
              const Icon = item.icon
              const label = t(`sections.${item.id}`)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm transition-colors active:translate-y-px md:w-full",
                    section === item.id
                      ? "bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              )
            })}
          </nav>
        </aside>
        <main className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 md:px-8 md:py-7">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              {t(`sections.${section}`)}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={t("close")}
            >
              <X />
            </Button>
          </div>
          {section === "general" && <GeneralSettings />}
          {section === "ai" && <AiServiceSettings />}
          {section === "data" && <DataSettings onClose={onClose} />}
          {section === "account" && <AccountSettings onClose={onClose} />}
        </main>
      </div>
    </Dialog>
  )
}

function GeneralSettings() {
  const t = useTranslations("Settings.general")
  const locale = useLocale() as Locale
  const router = useRouter()
  const [languagePending, startLanguageTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const activeTheme = isAppThemeId(theme) ? theme : "default"
  const railExpanded = useUiPreferences((state) => state.railExpanded)
  const setRailExpanded = useUiPreferences((state) => state.setRailExpanded)
  const themes = [
    { id: "default", label: t("light"), icon: Sun },
    { id: "codex-dark", label: t("dark"), icon: Moon },
  ]
  const changeLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return
    setAppLocale(nextLocale)
    markLanguagePromptHandled()
    startLanguageTransition(() => router.refresh())
  }
  return (
    <div className="divide-y divide-border/70 border-y border-border/70">
      <SettingRow title={t("appearance")} detail={t("appearanceDetail")}>
        <div className="flex rounded-full bg-muted p-1">
          {themes.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs",
                  activeTheme === item.id
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </button>
            )
          })}
        </div>
      </SettingRow>
      <SettingRow title={t("language")} detail={t("languageDetail")}>
        <div
          className="flex rounded-full bg-muted p-1"
          aria-label={t("language")}
        >
          {(["zh-CN", "en", "ja"] as const).map((item) => (
            <button
              key={item}
              type="button"
              disabled={languagePending}
              aria-pressed={locale === item}
              onClick={() => changeLocale(item)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors active:translate-y-px disabled:opacity-60",
                locale === item
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Languages className="size-3.5" />
              {item === "zh-CN"
                ? t("chinese")
                : item === "en"
                  ? t("english")
                  : LOCALE_LABELS[item]}
            </button>
          ))}
        </div>
      </SettingRow>
      <SettingRow title={t("rail")} detail={t("railDetail")}>
        <Switch
          checked={railExpanded}
          onChange={setRailExpanded}
          label={t("rail")}
        />
      </SettingRow>
    </div>
  )
}

function AiServiceSettings() {
  const t = useTranslations("Settings.ai")
  const common = useTranslations("Common")
  const locale = useLocale() as Locale
  const store = useAiSettingsStore()
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [savedSignature, setSavedSignature] = useState("")
  const [feedback, setFeedback] = useState<{
    text: string
    tone: "success" | "error" | "info"
  } | null>(null)
  const hydrate = useAiSettingsStore((state) => state.hydrate)
  useEffect(() => {
    void hydrate()
  }, [hydrate])
  const profile =
    store.profiles.find((item) => item.id === store.activeProfileId) ??
    store.profiles[0]
  const provider = getAiProvider(profile.providerId)
  const models = useMemo(
    () =>
      Array.from(new Set([...profile.discoveredModels, ...provider.models])),
    [profile.discoveredModels, provider.models]
  )
  const profileSignature = JSON.stringify(profile)
  const saved = savedSignature === profileSignature
  const update = (patch: Parameters<typeof store.updateProfile>[1]) => {
    store.updateProfile(profile.id, patch)
    setSavedSignature("")
    setFeedback(null)
  }
  const addProfile = (providerId: AiProviderPresetId) => {
    store.createProfile(providerId)
    setSavedSignature("")
    setFeedback(null)
  }
  const handleModels = async () => {
    setFetching(true)
    setFeedback(null)
    try {
      const list = await store.fetchModels(profile.id, undefined, locale)
      setSavedSignature("")
      setFeedback({
        text: list.length
          ? t("modelsFetched", { count: list.length })
          : t("noModelsReturned"),
        tone: list.length ? "success" : "info",
      })
    } catch (error) {
      setFeedback({
        text: getAiUserFacingError(error, locale, t("fetchFailed")),
        tone: "error",
      })
    } finally {
      setFetching(false)
    }
  }
  const handleTest = async () => {
    setTesting(true)
    setFeedback(null)
    try {
      await testAiConnection(profile, undefined, locale)
      setFeedback({ text: t("connectionSuccess"), tone: "success" })
    } catch (error) {
      setFeedback({
        text: isProviderBusyError(error)
          ? t("providerBusy")
          : getAiUserFacingError(error, locale, t("connectionFailed")),
        tone: isProviderBusyError(error) ? "info" : "error",
      })
    } finally {
      setTesting(false)
    }
  }
  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      await store.saveNow()
      setSavedSignature(profileSignature)
      setFeedback({
        text: t("savedLocal"),
        tone: "success",
      })
    } catch {
      setSavedSignature("")
      setFeedback({
        text: t("saveFailed"),
        tone: "error",
      })
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-y border-border/70 py-4">
        <div>
          <p className="text-sm font-medium">{t("enabled")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("enabledDetail")}
          </p>
        </div>
        <Switch
          checked={store.aiEnabled}
          onChange={store.setAiEnabled}
          label={t("enabled")}
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[190px_1fr]">
        <section>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {t("profiles")}
            </p>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() =>
                addProfile(profile.kind === "custom" ? "custom" : "deepseek")
              }
              aria-label={t("addProfile")}
            >
              <Plus />
            </Button>
          </div>
          <p className="mb-2 text-[10px] leading-4 text-muted-foreground">
            {t("selectHint")}
          </p>
          <div
            role="radiogroup"
            aria-label={t("activeProfiles")}
            className="max-h-72 space-y-1 overflow-y-auto pr-1"
          >
            {store.profiles.map((item) => {
              const active = item.id === store.activeProfileId
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    store.selectProfile(item.id)
                    setSavedSignature("")
                    setFeedback(null)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-primary/25 bg-primary/[0.06]"
                      : "border-transparent hover:bg-muted/55"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full border",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    )}
                  >
                    {active && <Check className="size-2.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">
                        {item.name}
                      </span>
                      {active && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                          {t("active")}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {getAiProvider(item.providerId).label} ·{" "}
                      {item.model || t("noModel")}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
        <section className="min-w-0 space-y-4 border-t border-border/70 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div className="flex items-center gap-3">
            <div className="flex rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  if (profile.kind === "custom") {
                    const preset = getAiProvider("deepseek")
                    update({
                      providerId: "deepseek",
                      kind: "preset",
                      name: preset.label,
                      baseURL: preset.baseURL,
                      model: preset.defaultModel,
                      apiKey: "",
                      transport: "auto",
                      discoveredModels: [],
                    })
                  }
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  profile.kind === "preset" && "bg-background shadow-sm"
                )}
              >
                {t("preset")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (profile.kind !== "custom") {
                    const custom = getAiProvider("custom")
                    update({
                      providerId: "custom",
                      kind: "custom",
                      name: t("custom"),
                      baseURL: custom.baseURL,
                      model: "",
                      apiKey: "",
                      transport: "proxy",
                      discoveredModels: [],
                    })
                  }
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  profile.kind === "custom" && "bg-background shadow-sm"
                )}
              >
                {t("custom")}
              </button>
            </div>
          </div>
          {profile.kind === "preset" && (
            <Field label={t("provider")}>
              <select
                value={profile.providerId}
                onChange={(event) => {
                  const id = event.target.value as AiProviderPresetId
                  const preset = getAiProvider(id)
                  update({
                    providerId: id,
                    name: preset.label,
                    kind: "preset",
                    baseURL: preset.baseURL,
                    model: preset.defaultModel,
                    apiKey: "",
                    transport: "auto",
                    thinkingMode: false,
                    discoveredModels: [],
                  })
                }}
                className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm"
              >
                {AI_PROVIDERS.filter((item) => item.id !== "custom").map(
                  (item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                      {item.recommended ? ` · ${t("recommended")}` : ""}
                    </option>
                  )
                )}
              </select>
              <span className="block text-[11px] leading-4 font-normal text-muted-foreground">
                {provider.description}
              </span>
            </Field>
          )}
          {profile.providerId === "glm-coding" && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50/70 px-3 py-2.5 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100"
              role="note"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0 text-[11px] leading-5">
                <p className="font-semibold">{t("codingPlanExperimental")}</p>
                <p className="text-amber-900/80 dark:text-amber-100/75">
                  {t("codingPlanExperimentalDetail")}{" "}
                  <a
                    href="https://docs.bigmodel.cn/cn/coding-plan/quick-start"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-200"
                  >
                    {t("codingPlanDocs")}
                  </a>
                </p>
              </div>
            </div>
          )}
          <Field label={t("profileName")}>
            <Input
              value={profile.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </Field>
          <Field label="Base URL">
            <Input
              value={profile.baseURL}
              onChange={(event) => update({ baseURL: event.target.value })}
              spellCheck={false}
            />
          </Field>
          <Field label="API Key" detail={t("keyDetail")}>
            <span className="relative block">
              <Input
                type={showKey ? "text" : "password"}
                value={profile.apiKey}
                onChange={(event) => update({ apiKey: event.target.value })}
                className="pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-muted-foreground"
                aria-label={showKey ? t("hideKey") : t("showKey")}
              >
                {showKey ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </span>
          </Field>
          <Field label={t("defaultModel")}>
            <ModelCombobox
              value={profile.model}
              models={models}
              onChange={(model) => update({ model })}
            />
            {!provider.supportsModelList && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {t("noModelList")}
              </p>
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("transport")}>
              <select
                value={profile.transport}
                onChange={(event) =>
                  update({
                    transport: event.target.value as typeof profile.transport,
                  })
                }
                className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm"
              >
                <option value="auto">{t("transportAuto")}</option>
                <option value="direct">{t("transportDirect")}</option>
                <option value="proxy">{t("transportProxy")}</option>
              </select>
            </Field>
            {provider.reasoningContent ? (
              <div className="flex items-end">
                <div className="flex h-10 w-full items-center justify-between rounded-lg border border-border/70 px-3">
                  <span className="text-xs font-medium">{t("thinking")}</span>
                  <Switch
                    checked={profile.thinkingMode}
                    onChange={(thinkingMode) => update({ thinkingMode })}
                    label={t("thinking")}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-end">
                <p className="flex min-h-10 items-center text-[11px] leading-4 text-muted-foreground">
                  {t("fastMode")}
                </p>
              </div>
            )}
          </div>
          {provider.reasoningContent && (
            <p className="-mt-2 text-[11px] leading-4 text-muted-foreground">
              {t("thinkingDetail")}
            </p>
          )}
          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                feedback.tone === "success" &&
                  "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
                feedback.tone === "error" &&
                  "border-destructive/25 bg-destructive/5 text-destructive",
                feedback.tone === "info" &&
                  "border-border/70 bg-muted/35 text-muted-foreground"
              )}
            >
              {feedback.text}
            </p>
          )}
          <div className="border-t border-border/70 pt-4">
            <p className="mb-3 text-[11px] leading-4 text-muted-foreground">
              {t("saveHint")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
              <div className="contents sm:flex sm:items-center sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleModels()}
                  disabled={
                    fetching || !profile.apiKey || !provider.supportsModelList
                  }
                >
                  {fetching ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <RefreshCw />
                  )}
                  {t("fetchModels")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleTest()}
                  disabled={testing || !profile.apiKey || !profile.model}
                >
                  {testing ? <Loader2 className="animate-spin" /> : <Check />}
                  {t("testConnection")}
                </Button>
              </div>
              <div className="contents sm:flex sm:items-center sm:gap-2">
                <Button
                  variant="destructive"
                  disabled={store.profiles.length <= 1}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 />
                  {common("delete")}
                </Button>
                <Button
                  onClick={() => void handleSave()}
                  disabled={saving || !store.hydrated}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Check />}
                  {saving
                    ? t("saving")
                    : saved
                      ? common("saved")
                      : common("save")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t("deleteTitle", { name: profile.name })}
        description={t("deleteDetail")}
        confirmLabel={t("deleteProfile")}
        tone="destructive"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          const deletedName = profile.name
          store.deleteProfile(profile.id)
          setDeleteConfirmOpen(false)
          setSavedSignature("")
          setFeedback({
            text: t("deleted", { name: deletedName }),
            tone: "success",
          })
        }}
      />
    </div>
  )
}

function DataSettings({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Settings.data")
  const common = useTranslations("Common")
  const status = useSyncState((state) => state.status)
  const { openAccount } = useAccountDialog()
  const manage = () => {
    onClose()
    window.setTimeout(openAccount, 0)
  }
  return (
    <div className="divide-y divide-border/70 border-y border-border/70">
      <SettingRow title={t("localFirst")} detail={t("localFirstDetail")}>
        <span className="text-xs text-muted-foreground">{t("enabled")}</span>
      </SettingRow>
      <SettingRow title={t("cloudSync")} detail={t("cloudSyncDetail")}>
        <span className="inline-flex items-center gap-2 text-xs">
          <Cloud className="size-4" />
          {common(`syncStatus.${status}`)}
        </span>
      </SettingRow>
      <SettingRow title={t("backup")} detail={t("backupDetail")}>
        <Button variant="outline" size="sm" onClick={manage}>
          {t("manageBackup")}
        </Button>
      </SettingRow>
    </div>
  )
}
function AccountSettings({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Settings.account")
  const { user, openAccount } = useAccountDialog()
  const manage = () => {
    onClose()
    window.setTimeout(openAccount, 0)
  }
  return (
    <div className="border-y border-border/70 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{user?.email ?? t("signedOut")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user ? t("signedInDetail") : t("signedOutDetail")}
          </p>
        </div>
        <Button variant="outline" onClick={manage}>
          {user ? t("manage") : t("signIn")}
        </Button>
      </div>
    </div>
  )
}
function Field({
  label,
  detail,
  children,
}: {
  label: string
  detail?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5 text-xs font-medium">
      {label}
      {children}
      {detail && (
        <span className="block text-[11px] leading-4 font-normal text-muted-foreground">
          {detail}
        </span>
      )}
    </label>
  )
}
function ModelCombobox({
  value,
  models,
  onChange,
}: {
  value: string
  models: string[]
  onChange: (value: string) => void
}) {
  const t = useTranslations("Settings.ai")
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const filtered = models
    .filter((model) => model.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 50)
  return (
    <div
      className="relative min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(false)
      }}
    >
      <Input
        role="combobox"
        aria-expanded={open}
        aria-controls="ai-model-options"
        value={value}
        onFocus={() => {
          setQuery("")
          setOpen(true)
        }}
        onChange={(event) => {
          onChange(event.target.value)
          setQuery(event.target.value)
          setOpen(true)
        }}
        placeholder={t("modelPlaceholder")}
        className="pr-9"
        spellCheck={false}
      />
      <button
        type="button"
        aria-label={t("expandModels")}
        onClick={() => {
          setQuery("")
          setOpen(!open)
        }}
        className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          id="ai-model-options"
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border/70 bg-popover p-1 shadow-lg"
        >
          {filtered.length > 0 ? (
            filtered.map((model) => (
              <button
                key={model}
                type="button"
                role="option"
                aria-selected={model === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(model)
                  setOpen(false)
                }}
                className={cn(
                  "block w-full truncate rounded-md px-2.5 py-2 text-left text-xs hover:bg-muted",
                  model === value && "bg-muted font-medium"
                )}
              >
                {model}
              </button>
            ))
          ) : (
            <p className="px-2.5 py-3 text-xs font-normal text-muted-foreground">
              {t("noModelMatch")}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
function SettingRow({
  title,
  detail,
  children,
}: {
  title: string
  detail: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-20 items-center justify-between gap-6 py-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}
