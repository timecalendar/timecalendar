import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

export function CalendarScreenStatus({
  isEmpty,
  isError,
  hasStaleSource,
  onRetry,
  onManageSources,
}: {
  isEmpty: boolean
  isError: boolean
  hasStaleSource: boolean
  onRetry: () => void
  onManageSources: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  if (!isEmpty && !isError && !hasStaleSource) return null
  return (
    <View style={styles.banners}>
      {isEmpty && (
        <ThemedText
          themeColor="textSecondary"
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
          testID="calendar-empty"
        >
          {t("calendar.empty")}
        </ThemedText>
      )}
      {isError && (
        <View
          style={styles.syncError}
          accessibilityLiveRegion="polite"
          testID="calendar-sync-error"
        >
          <ThemedText
            type="small"
            themeColor="textSecondary"
            accessibilityRole="alert"
            style={styles.syncErrorText}
          >
            {t("calendar.sync.error")}
          </ThemedText>
          <Pressable
            testID="calendar-sync-retry"
            accessibilityRole="button"
            accessibilityLabel={t("calendar.sync.retryLabel")}
            hitSlop={Spacing.two}
            onPress={onRetry}
            style={[
              styles.retryButton,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText type="smallBold">{t("calendar.sync.retry")}</ThemedText>
          </Pressable>
        </View>
      )}
      {hasStaleSource && (
        <View
          style={styles.sourceAttention}
          accessibilityLiveRegion="polite"
          testID="calendar-source-attention"
        >
          <ThemedText type="small" style={styles.sourceAttentionText}>
            {t("calendar.sourceHealth.attention")}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("calendar.sourceHealth.manageLabel")}
            onPress={onManageSources}
            style={[
              styles.retryButton,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText type="smallBold">
              {t("calendar.sourceHealth.manage")}
            </ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  banners: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  syncError: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  sourceAttention: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  sourceAttentionText: { flex: 1 },
  syncErrorText: { flex: 1 },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
})
