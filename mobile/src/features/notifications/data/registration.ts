import { useEffect, useRef } from "react"

import { onFcmTokenRefresh, requestNotificationPermission } from "@/firebase"

import { useSubscriptionRegistration } from "./subscription"

// The first-PUT trigger (design Decision 3) — a fire-and-forget once-effect
// mirroring useStartupSync, mounted in the root layout. On mount it requests
// notification permission (idempotent; the OS prompt shows once), resolves the
// token via register() — which does nothing on a null token (iOS APNS not
// ready) — and PUTs the assembled DTO. It subscribes onFcmTokenRefresh so a
// token landing later (or rotating) re-PUTs with the new token.
//
// It goes through the feature data/ seam (useSubscriptionRegistration), never
// the generated client / @/db directly (B-3/B-4). A failed PUT is recorded
// inside register (Decision 6) and self-heals on the next change/refresh; the
// trigger has no on-screen surface, so the rejections are swallowed here. The
// ref guards a double-fire under strict-mode / re-render.
export function useNotificationRegistration(): void {
  const { register } = useSubscriptionRegistration()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    void (async () => {
      await requestNotificationPermission()
      await register().catch(() => {})
    })()
  }, [register])

  useEffect(() => {
    return onFcmTokenRefresh((token) => {
      void register(token).catch(() => {})
    })
  }, [register])
}
