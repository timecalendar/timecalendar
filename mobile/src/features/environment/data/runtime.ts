import Constants from "expo-constants"

import {
  type BackendEnvironmentCapability,
  parseBackendEnvironmentCapability,
} from "@/config/backend-environment"

export function getBackendEnvironmentCapability(): BackendEnvironmentCapability {
  return parseBackendEnvironmentCapability(
    Constants.expoConfig?.extra?.backendEnvironmentCapability,
  )
}

export function getCompiledLocalApiUrl(): string | undefined {
  return process.env.EXPO_PUBLIC_API_URL
}
