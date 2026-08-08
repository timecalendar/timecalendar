import { useEffect, useRef } from "react"

import { useDisplayZone } from "@/features/settings/prefs"
import { onFcmTokenRefresh, requestNotificationPermission } from "@/firebase"
import i18n from "@/i18n"

import { useSubscriptionRegistration } from "./subscription"

// The first-PUT trigger (design Decision 3) — a fire-and-forget once-effect
// mirroring useStartupSync, mounted in the root layout. On mount it requests
// notification permission (idempotent; the OS prompt shows once), resolves the
// token via register() — which does nothing on a null token (iOS APNS not
// ready) — and PUTs the assembled DTO. It subscribes onFcmTokenRefresh so a
// token landing later (or rotating) re-PUTs with the new token; a language
// change (i18next `languageChanged` — fired by the settings override and by an
// Android device-language change while the pref is "system") and an EFFECTIVE
// timezone change (the display-timezone preference, or a device-zone change
// while the preference is "system" — keyed on the RESOLVED zone via
// useDisplayZone, so a device change under an explicit preference is inert)
// each re-PUT so the server renders in the new locale/zone. Every cold start
// PUTs the full DTO, which backstops any change the live triggers miss.
//
// It goes through the feature data/ seam (useSubscriptionRegistration), never
// the generated client / @/db directly (B-3/B-4). A failed PUT is recorded
// inside register (Decision 6) and self-heals on the next change/refresh/cold
// start; the trigger has no on-screen surface, so the rejections are swallowed
// here. The ref guards a double-fire under strict-mode / re-render.
export function useNotificationRegistration(): void {
  const { register } = useSubscriptionRegistration()
  const fired = useRef(false)
  // The mount PUT already carried the initial zone (via getEffectiveTimezone),
  // so the timezone effect skips the first value and re-PUTs only on change.
  const timezone = useDisplayZone()
  const lastTimezone = useRef(timezone)

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

  useEffect(() => {
    // Subscribed after mount, so an init-time languageChanged never fires it
    // (and a duplicate re-PUT would be harmless — the PUT is idempotent).
    const onLanguageChanged = () => {
      void register().catch(() => {})
    }
    i18n.on("languageChanged", onLanguageChanged)
    return () => {
      i18n.off("languageChanged", onLanguageChanged)
    }
  }, [register])

  useEffect(() => {
    if (lastTimezone.current === timezone) return
    lastTimezone.current = timezone
    void register().catch(() => {})
  }, [timezone, register])
}
