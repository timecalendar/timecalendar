import { getEffectiveBackendApiUrl } from "@/features/environment/data/store"

export function getApiBaseUrl(): string {
  return getEffectiveBackendApiUrl()
}
