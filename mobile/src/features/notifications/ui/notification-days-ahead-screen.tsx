import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import {
  NativeList,
  NativeListChoiceRow,
  NativeListSection,
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
      <NativeList>
        <NativeListSection>
          {NOTIFICATION_DAY_CHOICES.map(({ value, days }) => (
            <NativeListChoiceRow
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
        </NativeListSection>
        <NotificationSyncStatus
          status={preferences.status}
          retry={preferences.retry}
        />
      </NativeList>
    </>
  )
}
