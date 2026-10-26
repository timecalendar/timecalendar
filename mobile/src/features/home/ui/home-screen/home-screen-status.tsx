import { useTranslation } from "react-i18next"

import { ErrorNotice } from "@/design"

export function HomeScreenStatus({
  isError,
  isSyncing = false,
  onRetry,
}: {
  isError: boolean
  isSyncing?: boolean
  onRetry: () => void
}) {
  const { t } = useTranslation()
  if (!isError) return null
  return (
    <ErrorNotice
      compact
      testID="home-sync-error"
      message={t("calendar.sync.error")}
      action={{
        label: t("calendar.sync.retry"),
        accessibilityLabel: t("calendar.sync.retryLabel"),
        testID: "home-sync-retry",
        onPress: onRetry,
        busy: isSyncing,
      }}
    />
  )
}
