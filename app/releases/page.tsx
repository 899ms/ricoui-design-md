import { getTranslations } from "next-intl/server"
import { Archive, CirclePause, LockKeyhole } from "lucide-react"
import { ReleaseManager } from "@/components/release-manager"

export default async function ReleasesPage() {
  const t = await getTranslations("Releases")

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-border/70 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Archive className="h-3.5 w-3.5" />
            {t("manual")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="h-3.5 w-3.5" />
            {t("private")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CirclePause className="h-3.5 w-3.5" />
            {t("immutable")}
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {t("retention")}
        </p>
      </div>

      <div className="mt-8">
        <ReleaseManager />
      </div>
    </main>
  )
}
