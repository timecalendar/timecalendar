import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native"

import { ErrorState } from "@/components/error-surfaces"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import { Spacing, useTheme } from "@/theme"

export function GuideLoading() {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <RootPage lane="readable" contentContainerStyle={styles.container}>
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        style={styles.row}
      >
        <ActivityIndicator color={theme.primary} accessible={false} />
        <ThemedText>{t("exportGuide.loading")}</ThemedText>
      </View>
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
      <ScrollView contentContainerStyle={styles.container}>
        <ErrorState
          title={t("exportGuide.error.title")}
          message={`${t("exportGuide.error.body")} ${t("exportGuide.error.required")}`}
          primaryAction={{
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
      </ScrollView>
    </RootPage>
  )
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four, paddingBottom: Spacing.four },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
})
