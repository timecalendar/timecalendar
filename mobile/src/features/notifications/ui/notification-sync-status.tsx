import { useTranslation } from "react-i18next"

import { NativeSettingsAlert } from "@/components/chrome"
import type { NotificationSyncStatus as SyncStatus } from "@/features/notifications/data"

export function NotificationSyncStatus({
  status,
  retry,
}: {
  status: SyncStatus
  retry: () => void
}) {
  const { t } = useTranslation()
  if (status.state !== "error") return null
  return (
    <NativeSettingsAlert
      title={t("errors.syncTitle")}
      message={t("notifications.sync.error")}
      testID="notifications-sync-error"
      messageTestID="notifications-sync-message"
      action={{
        label: t("notifications.error.retry"),
        accessibilityLabel: t("notifications.error.retryLabel"),
        testID: "notifications-retry",
        onPress: retry,
      }}
    />
  )
}
