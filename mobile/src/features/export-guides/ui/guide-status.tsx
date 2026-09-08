import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native"

import { PrimaryAction } from "@/components/primary-action"
import { PageIntro, RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

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
  const theme = useTheme()
  return (
    <RootPage lane="readable" contentContainerStyle={styles.container}>
      <PageIntro
        title={t("exportGuide.error.title")}
        caption={t("exportGuide.error.body")}
      />
      <View accessibilityLiveRegion="polite" accessibilityRole="alert">
        <ThemedText themeColor="textSecondary">
          {busy ? t("exportGuide.loading") : t("exportGuide.error.required")}
        </ThemedText>
      </View>
      <PrimaryAction
        testID="export-guide-retry"
        label={t("exportGuide.retry")}
        busy={busy}
        onPress={retry}
      />
      <Pressable
        testID="export-guide-back"
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        onPress={() => router.back()}
        style={[styles.back, { borderColor: theme.primary }]}
      >
        <ThemedText type="smallBold" themeColor="primary">
          {t("common.back")}
        </ThemedText>
      </Pressable>
    </RootPage>
  )
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four, paddingBottom: Spacing.four },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  back: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: Radii.medium,
  },
})
