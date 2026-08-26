import Constants from "expo-constants"
import * as Device from "expo-device"

export interface DeviceInfoParts {
  model?: string | null | undefined
  osName?: string | null | undefined
  osVersion?: string | null | undefined
  appName?: string | null | undefined
  appVersion?: string | null | undefined
  buildVersion?: string | null | undefined
  appVariant?: unknown
}

const fallback = (value: string | null | undefined, missing: string) =>
  value?.trim() || missing

export function formatDeviceInfo(parts: DeviceInfoParts): string {
  const model = fallback(parts.model, "Unknown device")
  const osName = fallback(parts.osName, "Unknown OS")
  const osVersion = fallback(parts.osVersion, "unknown")
  const appName = fallback(parts.appName, "TimeCalendar")
  const appVersion = fallback(parts.appVersion, "unknown")
  const buildVersion = fallback(parts.buildVersion, "unknown")
  const variant =
    typeof parts.appVariant === "string" && parts.appVariant.trim()
      ? parts.appVariant.trim()
      : "unknown"

  return `${model} (${osName} ${osVersion}) · ${appName} ${appVersion} (${buildVersion}) · ${variant}`
}

export function getDeviceInfo(): string {
  return formatDeviceInfo({
    model: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    appName: Constants.expoConfig?.name,
    appVersion: Constants.expoConfig?.version,
    buildVersion: Constants.nativeBuildVersion,
    appVariant: Constants.expoConfig?.extra?.appVariant,
  })
}
