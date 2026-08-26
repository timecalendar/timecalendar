const MAX_SERVICE_INSTANCE_ID_LENGTH = 253
const SAFE_SERVICE_INSTANCE_ID = /^[A-Za-z0-9._-]+$/

export const UNKNOWN_SERVICE_INSTANCE_ID = "unknown"

export function resolveServiceInstanceId(hostname?: string): string {
  if (
    !hostname ||
    hostname.length > MAX_SERVICE_INSTANCE_ID_LENGTH ||
    !SAFE_SERVICE_INSTANCE_ID.test(hostname)
  ) {
    return UNKNOWN_SERVICE_INSTANCE_ID
  }

  return hostname
}
