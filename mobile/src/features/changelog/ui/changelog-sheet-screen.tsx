import { router, Stack } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable } from "react-native"

import { Button } from "@/components/button"
import { ThemedText } from "@/components/themed-text"
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
          headerRight: () => (
            <Pressable
              accessibilityHint={t("changelog.close.hint")}
              accessibilityLabel={t("changelog.close.label")}
              accessibilityRole="button"
              hitSlop={12}
              onPress={acknowledgeAndDismiss}
              testID="changelog-close"
            >
              <ThemedText>{t("changelog.close.label")}</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ChangelogContent
        footer={footer}
        releases={getChangelogReleasesAfter(initialSeenVersion)}
      />
    </>
  )
}
