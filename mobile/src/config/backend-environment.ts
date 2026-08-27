export const BACKEND_ENVIRONMENTS = ["local", "preprod", "production"] as const

export type BackendEnvironment = (typeof BACKEND_ENVIRONMENTS)[number]

export const BACKEND_CAPABILITIES = [
  "development",
  "preview",
  "production",
] as const

export type BackendEnvironmentCapability = (typeof BACKEND_CAPABILITIES)[number]

export const PREPROD_API_URL = "https://preprod-api.timecalendar.app"
export const PRODUCTION_API_URL = "https://api-v2.timecalendar.app"

export function parseBackendEnvironmentCapability(
  value: unknown,
): BackendEnvironmentCapability {
  return BACKEND_CAPABILITIES.includes(value as BackendEnvironmentCapability)
    ? (value as BackendEnvironmentCapability)
    : "production"
}

export function getAllowedBackendEnvironments(
  capability: BackendEnvironmentCapability,
): readonly BackendEnvironment[] {
  if (capability === "development") return BACKEND_ENVIRONMENTS
  if (capability === "preview") return ["preprod", "production"]
  return ["production"]
}

export function getDefaultBackendEnvironment(
  capability: BackendEnvironmentCapability,
): BackendEnvironment {
  return getAllowedBackendEnvironments(capability)[0]!
}

export function parseBackendEnvironment(
  value: unknown,
  capability: BackendEnvironmentCapability,
): BackendEnvironment {
  const allowed = getAllowedBackendEnvironments(capability)
  return allowed.includes(value as BackendEnvironment)
    ? (value as BackendEnvironment)
    : getDefaultBackendEnvironment(capability)
}

export function isAllowedBackendEnvironment(
  value: unknown,
  capability: BackendEnvironmentCapability,
): value is BackendEnvironment {
  return getAllowedBackendEnvironments(capability).includes(
    value as BackendEnvironment,
  )
}

export function parseLocalApiUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString().replace(/\/$/, "")
      : undefined
  } catch {
    return undefined
  }
}

export function resolveBackendApiUrl(
  environment: BackendEnvironment,
  localApiUrl: unknown,
): string {
  if (environment === "production") return PRODUCTION_API_URL
  if (environment === "preprod") return PREPROD_API_URL

  const parsedLocalUrl = parseLocalApiUrl(localApiUrl)
  if (parsedLocalUrl === undefined) return PRODUCTION_API_URL
  return parsedLocalUrl
}
