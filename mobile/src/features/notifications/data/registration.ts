import { useEffect } from "react"
import { AppState } from "react-native"

import { useUserCalendarsSnapshot } from "@/features/calendar-sources/data"
import { useDisplayZone } from "@/features/settings/prefs"
import { onFcmTokenRefresh, requestNotificationPermission } from "@/firebase"
import i18n from "@/i18n"

import { getEffectiveLocale } from "./localization"
import { notificationSyncRuntime } from "./runtime-instance"

export function useNotificationSyncRuntime(): void {
  const calendars = useUserCalendarsSnapshot()
  const timezone = useDisplayZone()

  useEffect(() => {
    notificationSyncRuntime.updateCalendars(calendars)
  }, [calendars])

  useEffect(() => {
    notificationSyncRuntime.updateTimezone(timezone)
  }, [timezone])

  useEffect(() => {
    let mounted = true
    notificationSyncRuntime.updateLocale(getEffectiveLocale())
    notificationSyncRuntime.setActive(AppState.currentState === "active")

    const unsubscribeToken = onFcmTokenRefresh((token) => {
      notificationSyncRuntime.updateToken(token)
    })
    const onLanguageChanged = () => {
      notificationSyncRuntime.updateLocale(getEffectiveLocale())
    }
    i18n.on("languageChanged", onLanguageChanged)
    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") notificationSyncRuntime.foreground()
        else notificationSyncRuntime.setActive(false)
      },
    )

    void requestNotificationPermission()
      .then(() => {
        if (mounted) notificationSyncRuntime.start()
      })
      .catch(() => {})

    return () => {
      mounted = false
      unsubscribeToken()
      i18n.off("languageChanged", onLanguageChanged)
      appStateSubscription.remove()
      notificationSyncRuntime.dispose()
    }
  }, [])
}
