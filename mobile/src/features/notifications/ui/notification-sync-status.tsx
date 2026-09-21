import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { AccessibilityInfo } from "react-native"

import {
  NativeSettingsRow,
  NativeSettingsSection,
  NativeSettingsText,
} from "@/components/chrome"
import type { NotificationSyncStatus as SyncStatus } from "@/features/notifications/data"

export function NotificationSyncStatus({
  status,
  retry,
}: {
  status: SyncStatus
  retry: () => void
}) {
  const { t } = useTranslation()
  const message =
    status.state === "pending"
      ? t("notifications.sync.pending")
      : status.state === "waiting"
        ? t(`notifications.sync.waiting.${status.reason}`)
        : status.state === "error"
          ? t("notifications.sync.error")
          : t("notifications.sync.acknowledged")

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message)
  }, [message])

  return (
    <NativeSettingsSection
      title={t("notifications.section.status")}
      testID={`notifications-sync-${status.state}`}
    >
      <NativeSettingsText testID="notifications-sync-message">
        {message}
      </NativeSettingsText>
      {status.state === "error" ? (
        <NativeSettingsRow
          kind="action"
          label={t("notifications.error.retry")}
          accessibilityLabel={t("notifications.error.retryLabel")}
          testID="notifications-retry"
          onPress={retry}
        />
      ) : null}
    </NativeSettingsSection>
  )
}
