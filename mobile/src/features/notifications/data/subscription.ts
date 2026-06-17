import { useCallback } from "react"

import { useNotificationSubscriptionControllerCreateOrUpdateSubscription } from "@/api/generated/notification-subscription/notification-subscription"
import { useUserCalendars } from "@/features/calendar-sources/data"
import { getFcmToken, recordError } from "@/firebase"

import { getFrequency, getIsActive, getNbDaysAhead } from "./prefs"

// The subscription registration seam (design Decisions 3/4/5/6 / ADR 027) — the
// ONLY generated-client import site for the feature (B-1). It wraps the
// already-generated PUT mutation over the single customFetch mutator and exposes
// a `register()` that assembles the full NotificationSubscriptionCreate DTO fresh
// each call (the local prefs + the user_calendars server ids + the Ship-A token)
// and PUTs it IDEMPOTENTLY (create-or-update keyed server-side by the token/user).
//
// calendarIds are the user_calendars rows' SERVER ids (the row `id` IS the server
// calendar id per fromCalendarForPublic — distinct from the irreplaceable token),
// read cross-feature by full @/ path (a legitimate data → data read). The
// generated import + the cross-feature read both live in data/ (B-1).

export interface UseSubscriptionRegistration {
  // PUTs the assembled DTO. Pass an explicit token on a token-refresh (the
  // refreshed token isn't yet readable via getFcmToken); omit it on a prefs
  // change to resolve the current token. A null token (iOS APNS not ready) does
  // NOT PUT (Decision 3) — the next refresh fires it. Zero held calendars STILL
  // PUTs calendarIds: [] (Decision 4) so the server can prune.
  register: (token?: string) => Promise<void>
  isPending: boolean
  isError: boolean
  reset: () => void
}

export function useSubscriptionRegistration(): UseSubscriptionRegistration {
  const mutation =
    useNotificationSubscriptionControllerCreateOrUpdateSubscription()
  const calendars = useUserCalendars()

  const register = useCallback(
    async (token?: string): Promise<void> => {
      const fcmToken = token ?? (await getFcmToken())
      if (fcmToken === null) {
        // iOS APNS not ready (Decision 3): do nothing; onFcmTokenRefresh fires
        // the registration when a token lands.
        return
      }
      try {
        await mutation.mutateAsync({
          data: {
            frequency: getFrequency(),
            nbDaysAhead: getNbDaysAhead(),
            isActive: getIsActive(),
            calendarIds: calendars.map((calendar) => calendar.id),
            fcmToken,
          },
        })
      } catch (error) {
        // Decision 6: a failed PUT is recorded; the isError flag drives the
        // screen's accessible failure surface (the background trigger has none).
        recordError(
          error instanceof Error ? error : new Error(String(error)),
          "notifications/subscription",
        )
        throw error
      }
    },
    [mutation, calendars],
  )

  return {
    register,
    isPending: mutation.isPending,
    isError: mutation.isError,
    reset: mutation.reset,
  }
}
