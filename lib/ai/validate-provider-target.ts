import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number)
  if (octets.length !== 4 || octets.some(Number.isNaN)) return false
  const [a, b] = octets
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  )
}

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) return isPrivateIpv4(address)
  if (isIP(address) !== 6) return false
  const value = address.toLowerCase()
  return (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    /^fe[89ab]/.test(value) ||
    value.startsWith("::ffff:127.") ||
    value.startsWith("::ffff:10.") ||
    value.startsWith("::ffff:192.168.") ||
    value.startsWith("::ffff:169.254.")
  )
}

export async function validateProviderTarget(
  rawBaseURL: string,
  endpoint: "chat/completions" | "models"
) {
  let baseURL: URL
  try {
    baseURL = new URL(rawBaseURL)
  } catch {
    throw new Error("Base URL 不是有效 URL")
  }
  if (baseURL.protocol !== "https:") throw new Error("AI 服务必须使用 HTTPS")
  if (baseURL.username || baseURL.password)
    throw new Error("Base URL 不允许携带凭据")
  const hostname = baseURL.hostname.toLowerCase()
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254" ||
    isPrivateAddress(hostname)
  )
    throw new Error("禁止访问本地或私有网络地址")

  const allowedHosts = (process.env.AI_PROXY_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
  if (allowedHosts.length > 0 && !allowedHosts.includes(hostname)) {
    throw new Error("服务地址不在 AI_PROXY_ALLOWED_HOSTS 白名单中")
  }
  const resolved = await lookup(hostname, { all: true, verbatim: true })
  if (resolved.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error("服务地址解析到了私有网络")
  }
  const path = baseURL.pathname.replace(/\/+$/, "")
  if (path.includes("..") || baseURL.search || baseURL.hash)
    throw new Error("Base URL 路径无效")
  return `${baseURL.origin}${path}/${endpoint}`
}
