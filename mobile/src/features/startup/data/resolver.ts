import type { TapRoute } from "@/features/notifications"
import type { StartupTabPreference } from "@/features/settings"

export type LaunchDestination =
  | "/"
  | "/calendar"
  | "/onboarding"
  | `/event-details/${string}`
  | string

export interface LaunchResolutionInput {
  initialPath: string
  notificationIntent: TapRoute | null
  hasHeldCalendar: boolean
  preference: StartupTabPreference
}

export function notificationIntentPath(intent: TapRoute): LaunchDestination {
  return intent.kind === "calendar"
    ? "/calendar"
    : `/event-details/${intent.uid}`
}

export function resolveLaunchDestination({
  initialPath,
  notificationIntent,
  hasHeldCalendar,
  preference,
}: LaunchResolutionInput): LaunchDestination {
  if (initialPath !== "/" && initialPath !== "") return initialPath
  if (notificationIntent != null)
    return notificationIntentPath(notificationIntent)
  if (!hasHeldCalendar) return "/onboarding"
  return preference === "calendar" ? "/calendar" : "/"
}
