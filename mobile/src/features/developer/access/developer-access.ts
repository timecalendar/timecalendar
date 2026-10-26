import { getBackendEnvironmentCapability } from "@/features/environment"

export function isDeveloperSurfaceEnabled(): boolean {
  return getBackendEnvironmentCapability() !== "production"
}
