import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import {
  NativeList,
  NativeListChoiceRow,
  NativeListSection,
} from "@/components/chrome"
import { useNotificationPreferences } from "@/features/notifications/data"

import { NOTIFICATION_FREQUENCIES } from "./notification-choices"
import { NotificationSyncStatus } from "./notification-sync-status"

export function NotificationFrequencyScreen() {
  const { t } = useTranslation()
  const preferences = useNotificationPreferences()
  return (
    <>
      <Stack.Screen options={{ title: t("notifications.frequency.title") }} />
      <NativeList>
        <NativeListSection>
          {NOTIFICATION_FREQUENCIES.map(({ value, labelKey }) => (
            <NativeListChoiceRow
              key={value}
              label={t(labelKey)}
              selected={preferences.frequency === value}
              selectedAccessibilityLabel={t("notifications.selected")}
              testID={`notifications-frequency-choice-${value}`}
              onSelect={() => {
                preferences.setFrequency(value)
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
