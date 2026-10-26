import { router, Stack } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useHeaderActions } from "@/components/chrome"
import { Button } from "@/design"
import {
  CHANGELOG_VERSION,
  getChangelogReleasesAfter,
} from "@/features/changelog/data"
import {
  getChangelogSeenVersion,
  setChangelogSeenVersion,
} from "@/features/changelog/store"

import { ChangelogContent } from "./changelog-content"

export function ChangelogSheetScreen() {
  const { t } = useTranslation()
  const [initialSeenVersion] = useState(
    () => getChangelogSeenVersion() ?? CHANGELOG_VERSION,
  )
  const acknowledged = useRef(false)

  const acknowledge = useCallback(() => {
    if (acknowledged.current) return
    setChangelogSeenVersion(CHANGELOG_VERSION)
    acknowledged.current = true
  }, [])

  const acknowledgeAndDismiss = useCallback(() => {
    acknowledge()
    router.dismiss()
  }, [acknowledge])

  useEffect(() => acknowledge, [acknowledge])

  const headerActions = useHeaderActions({
    right: [
      {
        label: t("changelog.close.label"),
        accessibilityLabel: t("changelog.close.label"),
        accessibilityHint: t("changelog.close.hint"),
        testID: "changelog-close",
        onPress: acknowledgeAndDismiss,
      },
    ],
  })

  const footer = (
    <Button
      variant="filled"
      label={t("changelog.continue.label")}
      accessibilityHint={t("changelog.continue.hint")}
      onPress={acknowledgeAndDismiss}
      testID="changelog-continue"
    />
  )

  return (
    <>
      <Stack.Screen
        options={{
          title: t("changelog.sheet.title"),
          ...headerActions,
        }}
      />
      <ChangelogContent
        footer={footer}
        releases={getChangelogReleasesAfter(initialSeenVersion)}
      />
    </>
  )
}
