"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { APP_THEME_IDS } from "@/lib/themes/app-themes"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="default"
      enableSystem={false}
      themes={APP_THEME_IDS}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
