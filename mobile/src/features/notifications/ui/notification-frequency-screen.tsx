import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import {
  NativeSettingsChoiceRow,
  NativeSettingsHost,
  NativeSettingsSection,
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
      <NativeSettingsHost>
        <NativeSettingsSection>
          {NOTIFICATION_FREQUENCIES.map(({ value, labelKey }) => (
            <NativeSettingsChoiceRow
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
        </NativeSettingsSection>
        <NotificationSyncStatus
          status={preferences.status}
          retry={preferences.retry}
        />
      </NativeSettingsHost>
    </>
  )
}
