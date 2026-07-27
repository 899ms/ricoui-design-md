import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import {
  APP_LOCALE_COOKIE,
  getLocaleFromAcceptLanguage,
  isLocale,
} from "@/lib/i18n/config"
import { getMessages } from "@/lib/i18n/messages"

export default getRequestConfig(async () => {
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ])
  const savedLocale = cookieStore.get(APP_LOCALE_COOKIE)?.value
  const locale = isLocale(savedLocale)
    ? savedLocale
    : getLocaleFromAcceptLanguage(requestHeaders.get("accept-language"))

  return {
    locale,
    messages: await getMessages(locale),
  }
})
