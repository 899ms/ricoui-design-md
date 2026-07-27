import "./globals.css"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/components/app-shell"

export const metadata: Metadata = {
  metadataBase: new URL("https://design.ricoui.com"),
  title: {
    default: "RICOUI DESIGN",
    template: "%s · RICOUI DESIGN",
  },
  description:
    "A local-first workspace for authoring, checking, previewing, and exporting DESIGN.md design systems.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "RICOUI DESIGN",
    title: "RICOUI DESIGN",
    description:
      "A local-first workspace for authoring, checking, previewing, and exporting DESIGN.md design systems.",
    images: [
      {
        url: "/og.jpg",
        width: 1500,
        height: 1000,
        alt: "RICOUI DESIGN workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RICOUI DESIGN",
    description:
      "A local-first workspace for authoring, checking, previewing, and exporting DESIGN.md design systems.",
    images: ["/og.jpg"],
  },
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <TooltipProvider>
              <AppShell>{children}</AppShell>
            </TooltipProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
      {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
    </html>
  )
}
