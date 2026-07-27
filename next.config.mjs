import createNextIntlPlugin from "next-intl/plugin"

/** @type {import('next').NextConfig} */
const nextConfig = {}

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts")

export default withNextIntl(nextConfig)
