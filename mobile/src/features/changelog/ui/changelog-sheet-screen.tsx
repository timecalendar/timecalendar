import { router, Stack } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet } from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  CHANGELOG_VERSION,
  getChangelogReleasesAfter,
} from "@/features/changelog/data"
import {
  getChangelogSeenVersion,
  setChangelogSeenVersion,
} from "@/features/changelog/store"
import { Radii, Spacing, useTheme } from "@/theme"

import { ChangelogContent } from "./changelog-content"

export function ChangelogSheetScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
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
    <Pressable
      accessibilityHint={t("changelog.continue.hint")}
      accessibilityRole="button"
      onPress={acknowledgeAndDismiss}
      style={({ pressed }) => [
        styles.continueButton,
        { backgroundColor: theme.primaryStrong, opacity: pressed ? 0.8 : 1 },
      ]}
      testID="changelog-continue"
    >
      <ThemedText themeColor="onPrimary">
        {t("changelog.continue.label")}
      </ThemedText>
    </Pressable>
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
              <ThemedText themeColor="actionText">
                {t("changelog.close.label")}
              </ThemedText>
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

const styles = StyleSheet.create({
  continueButton: {
    minHeight: 48,
    borderRadius: Radii.medium,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
})
