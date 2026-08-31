import { runMigrations } from "@/db/migrate"
import { findAll } from "@/features/calendar-sources"
import { resolveInitialNotificationIntent } from "@/features/notifications"
import { getStartupTabPreference } from "@/features/settings"
import { recordUnknownError } from "@/firebase"

import { type LaunchDestination, resolveLaunchDestination } from "./resolver"

export async function resolveLaunchPrerequisites(
  initialPath: string,
  sync: () => Promise<unknown>,
): Promise<LaunchDestination> {
  await runMigrations()
  // Phase 09 insertion point: import Flutter-owned data here, before any RN
  // preference or held-calendar read.
  const notificationIntent = await resolveInitialNotificationIntent(sync)
  const calendars = await findAll()
  const preference = getStartupTabPreference()
  return resolveLaunchDestination({
    initialPath,
    notificationIntent,
    hasHeldCalendar: calendars.length > 0,
    preference,
  })
}

export function recordLaunchFailure(error: unknown): void {
  recordUnknownError(error, "startup/launch-resolution")
}
