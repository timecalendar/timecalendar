import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

export function HomeScreenStatus({
  isError,
  onRetry,
}: {
  isError: boolean
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()

  if (!isError) return null

  return (
    <View
      style={styles.error}
      accessibilityLiveRegion="polite"
      testID="home-sync-error"
    >
      <ThemedText
        type="small"
        themeColor="textSecondary"
        accessibilityRole="alert"
        style={styles.errorText}
      >
        {t("calendar.sync.error")}
      </ThemedText>
      <Pressable
        testID="home-sync-retry"
        accessibilityRole="button"
        accessibilityLabel={t("calendar.sync.retryLabel")}
        onPress={onRetry}
        style={[
          styles.retryButton,
          { backgroundColor: theme.backgroundElement },
        ]}
      >
        <ThemedText type="smallBold">{t("calendar.sync.retry")}</ThemedText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  error: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  errorText: { flex: 1 },
  retryButton: {
    minHeight: Platform.OS === "android" ? 48 : 44,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
})
