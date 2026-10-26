import { router } from "expo-router"
import { useTranslation } from "react-i18next"

import { RootPage, StatusView } from "@/design"

export function GuideProgress() {
  const { t } = useTranslation()
  return (
    <RootPage lane="readable">
      <StatusView
        kind="loading"
        presentation="screen"
        title={t("exportGuide.loading")}
      />
    </RootPage>
  )
}

export function GuideBlockingError({
  retry,
  busy,
}: {
  retry: () => void
  busy: boolean
}) {
  const { t } = useTranslation()
  return (
    <RootPage lane="readable">
      <StatusView
        kind="error"
        presentation="screen"
        title={t("exportGuide.error.title")}
        caption={`${t("exportGuide.error.body")} ${t("exportGuide.error.required")}`}
        action={{
          testID: "export-guide-retry",
          label: t("exportGuide.retry"),
          busy,
          onPress: retry,
        }}
        secondaryAction={{
          testID: "export-guide-back",
          label: t("common.back"),
          onPress: () => router.back(),
        }}
      />
    </RootPage>
  )
}
