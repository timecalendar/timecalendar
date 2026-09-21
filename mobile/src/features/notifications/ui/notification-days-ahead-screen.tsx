import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import {
  NativeSettingsChoiceRow,
  NativeSettingsHost,
  NativeSettingsSection,
} from "@/components/chrome"
import { useNotificationPreferences } from "@/features/notifications/data"

import {
  NOTIFICATION_DAY_CHOICES,
  selectedDaysChoice,
} from "./notification-choices"
import { NotificationSyncStatus } from "./notification-sync-status"

export function NotificationDaysAheadScreen() {
  const { t } = useTranslation()
  const preferences = useNotificationPreferences()
  const selected = selectedDaysChoice(preferences.nbDaysAhead)
  const savedValue = t("notifications.days.value", {
    count: preferences.nbDaysAhead,
  })
  return (
    <>
      <Stack.Screen options={{ title: t("notifications.days.title") }} />
      <NativeSettingsHost>
        <NativeSettingsSection>
          {NOTIFICATION_DAY_CHOICES.map(({ value, days }) => (
            <NativeSettingsChoiceRow
              key={value}
              label={
                days === null
                  ? t("notifications.days.customWithValue", {
                      value: savedValue,
                    })
                  : t("notifications.days.value", { count: days })
              }
              selected={selected === value}
              selectedAccessibilityLabel={t("notifications.selected")}
              testID={`notifications-days-choice-${value}`}
              onSelect={() => {
                if (value === "custom") {
                  router.push("/notification-days-custom")
                  return
                }
                preferences.setNbDaysAhead(Number(value))
                router.back()
              }}
            />
          ))}
        </NativeSettingsSection>
        <NotificationSyncStatus
          status={preferences.status}
          retry={preferences.retry}
        />
      </NativeSettingsHost>
    </>
  )
}
