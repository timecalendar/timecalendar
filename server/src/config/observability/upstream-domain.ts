import { isIP } from "node:net"

export const REVIEWED_UPSTREAM_DOMAINS = [
  "ensea.fr",
  "esiee.fr",
  "grenet.fr",
  "u-bourgogne.fr",
  "u-pec.fr",
  "univ-amu.fr",
  "univ-angers.fr",
  "univ-eiffel.fr",
  "univ-lehavre.fr",
  "univ-lyon1.fr",
  "univ-orleans.fr",
  "univ-poitiers.fr",
  "univ-rennes1.fr",
  "univ-rouen.fr",
  "univ-st-etienne.fr",
] as const

export type ReviewedUpstreamDomain = (typeof REVIEWED_UPSTREAM_DOMAINS)[number]
export type UpstreamDomain = ReviewedUpstreamDomain | "custom" | "invalid"

const MAX_UPSTREAM_INPUT_LENGTH = 2048
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

const isPrivateIpv4 = (hostname: string) => {
  const octets = hostname.split(".").map(Number)
  if (octets.length !== 4) return false
  const [first, second] = octets
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}

const isUnsafeAddress = (hostname: string) => {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true
  const ipVersion = isIP(hostname)
  if (ipVersion === 4) return isPrivateIpv4(hostname)
  if (ipVersion === 6) {
    const normalized = hostname.toLowerCase()
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized)
    )
  }
  return false
}

const parseHostname = (input: string): string | undefined => {
  const value = input.trim()
  if (!value || value.length > MAX_UPSTREAM_INPUT_LENGTH) return undefined

  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
  if (!hasScheme && /[/@?#]/.test(value)) return undefined

  try {
    const url = new URL(hasScheme ? value : `http://${value}`)
    if (!/^https?:$/.test(url.protocol) || url.username || url.password)
      return undefined
    const hostname = url.hostname.toLowerCase().replace(/\.+$/, "")
    if (!hostname || hostname.length > 253 || isUnsafeAddress(hostname))
      return undefined
    if (
      isIP(hostname) === 0 &&
      !hostname.split(".").every((label) => HOST_LABEL.test(label))
    )
      return undefined
    return hostname
  } catch {
    return undefined
  }
}

export function classifyUpstreamDomain(input: string): UpstreamDomain {
  const hostname = parseHostname(input)
  if (!hostname) return "invalid"

  return (
    REVIEWED_UPSTREAM_DOMAINS.find(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    ) ?? "custom"
  )
}
