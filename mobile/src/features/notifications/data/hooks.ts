import { useCallback, useEffect } from "react"

import { onFcmTokenRefresh } from "@/firebase"

import {
  setFrequency,
  setIsActive,
  setNbDaysAhead,
  useFrequency,
  useIsActive,
  useNbDaysAhead,
} from "./prefs"
import {
  type UseSubscriptionRegistration,
  useSubscriptionRegistration,
} from "./subscription"
import { type NotificationFrequency } from "./types"

// The screen-facing preferences hook (design Decision 5): the reactive prefs
// values + the mutators that write the local store FIRST then trigger an
// idempotent re-PUT, plus the registration state (isPending / isError / reset /
// a bare register for the Retry control). It also wires onFcmTokenRefresh →
// re-PUT with the new token (Decision 5) and cleans the subscription up.
//
// The screen MAY debounce rapid nbDaysAhead taps (a UI concern); the WIRE
// contract is "every committed change re-PUTs". Idempotency makes an extra PUT
// harmless, so no coalescing machinery is built (R-2).

export interface UseNotificationPreferences {
  frequency: NotificationFrequency
  nbDaysAhead: number
  isActive: boolean
  setFrequency: (frequency: NotificationFrequency) => void
  setNbDaysAhead: (nbDaysAhead: number) => void
  setIsActive: (isActive: boolean) => void
  register: UseSubscriptionRegistration["register"]
  isPending: boolean
  isError: boolean
  reset: () => void
}

export function useNotificationPreferences(): UseNotificationPreferences {
  const frequency = useFrequency()
  const nbDaysAhead = useNbDaysAhead()
  const isActive = useIsActive()
  const { register, isPending, isError, reset } = useSubscriptionRegistration()

  // Re-PUT on token-refresh with the new token (Decision 5). A background re-PUT
  // has no on-screen surface; register swallows-then-rethrows after recordError,
  // so guard the floating promise here.
  useEffect(() => {
    return onFcmTokenRefresh((token) => {
      void register(token).catch(() => {})
    })
  }, [register])

  const changeFrequency = useCallback(
    (next: NotificationFrequency) => {
      setFrequency(next)
      void register().catch(() => {})
    },
    [register],
  )

  const changeNbDaysAhead = useCallback(
    (next: number) => {
      setNbDaysAhead(next)
      void register().catch(() => {})
    },
    [register],
  )

  const changeIsActive = useCallback(
    (next: boolean) => {
      setIsActive(next)
      void register().catch(() => {})
    },
    [register],
  )

  return {
    frequency,
    nbDaysAhead,
    isActive,
    setFrequency: changeFrequency,
    setNbDaysAhead: changeNbDaysAhead,
    setIsActive: changeIsActive,
    register,
    isPending,
    isError,
    reset,
  }
}
