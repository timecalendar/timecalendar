import { runMigrations } from "@/db/migrate"
import { findAll } from "@/features/calendar-sources"
import { resolveInitialNotificationIntent } from "@/features/notifications"
import { getStartupTabPreference } from "@/features/settings"
import { recordUnknownError } from "@/firebase"

import { type LaunchDestination, resolveLaunchDestination } from "./resolver"

export async function resolveLaunchPrerequisites(
  initialPath: string,
  sync: () => Promise<unknown>,
  getCurrentPath: () => string = () => initialPath,
  explicitPathDidChange?: Promise<LaunchDestination>,
): Promise<LaunchDestination> {
  await runMigrations()
  // Phase 09 insertion point: import Flutter-owned data here, before any RN
  // preference or held-calendar read.
  // An explicit initial route has already won the launch decision. Commit it
  // after the mandatory migration/import boundary without waiting for lower-
  // priority native notification or identity reads; some native messaging
  // implementations do not settle getInitialNotification() for deep-link
  // launches that contain no notification response.
  const currentPath = getCurrentPath()
  if (currentPath !== "/" && currentPath !== "") return currentPath
  const notificationResult = await waitForValueOrExplicitPath(
    resolveInitialNotificationIntent(sync),
    explicitPathDidChange,
  )
  if (notificationResult.kind === "explicit") return notificationResult.path

  const calendarsResult = await waitForValueOrExplicitPath(
    findAll(),
    explicitPathDidChange,
  )
  if (calendarsResult.kind === "explicit") return calendarsResult.path

  const preference = getStartupTabPreference()
  return resolveLaunchDestination({
    initialPath,
    notificationIntent: notificationResult.value,
    hasHeldCalendar: calendarsResult.value.length > 0,
    preference,
  })
}

async function waitForValueOrExplicitPath<T>(
  value: Promise<T>,
  explicitPathDidChange?: Promise<LaunchDestination>,
): Promise<
  { kind: "value"; value: T } | { kind: "explicit"; path: LaunchDestination }
> {
  const valueResult = value.then((resolved): { kind: "value"; value: T } => ({
    kind: "value",
    value: resolved,
  }))
  if (explicitPathDidChange == null) return valueResult

  return Promise.race([
    valueResult,
    explicitPathDidChange.then(
      (path): { kind: "explicit"; path: LaunchDestination } => ({
        kind: "explicit",
        path,
      }),
    ),
  ])
}

export function recordLaunchFailure(error: unknown): void {
  recordUnknownError(error, "startup/launch-resolution")
}
