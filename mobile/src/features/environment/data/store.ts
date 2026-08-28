import {
  type BackendEnvironment,
  parseBackendEnvironment,
  resolveBackendApiUrl,
} from "@/config/backend-environment"
import {
  getString,
  setString,
  STORAGE_KEYS,
  useParsedStoredString,
} from "@/storage"

import {
  getBackendEnvironmentCapability,
  getCompiledLocalApiUrl,
} from "./runtime"

export function getEffectiveBackendEnvironment(): BackendEnvironment {
  return parseBackendEnvironment(
    getString(STORAGE_KEYS.selectedBackendEnvironment),
    getBackendEnvironmentCapability(),
  )
}

export function useEffectiveBackendEnvironment(): BackendEnvironment {
  const capability = getBackendEnvironmentCapability()
  return useParsedStoredString(STORAGE_KEYS.selectedBackendEnvironment, (raw) =>
    parseBackendEnvironment(raw, capability),
  )
}

export function getEffectiveBackendApiUrl(): string {
  return resolveBackendApiUrl(
    getEffectiveBackendEnvironment(),
    getCompiledLocalApiUrl(),
  )
}

export function commitSelectedBackendEnvironment(
  environment: BackendEnvironment,
): void {
  setString(STORAGE_KEYS.selectedBackendEnvironment, environment)
}
