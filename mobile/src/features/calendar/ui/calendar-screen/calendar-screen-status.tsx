import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { ErrorNotice } from "@/components/error-surfaces"
import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

export function CalendarScreenStatus({
  isEmpty,
  isError,
  isSyncing,
  onRetry,
}: {
  isEmpty: boolean
  isError: boolean
  isSyncing: boolean
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  if (!isEmpty && !isError) return null
  return (
    <View style={styles.banners}>
      {isEmpty && !isError && (
        <View style={styles.emptyState}>
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
            testID="calendar-empty"
          >
            {t("calendar.empty")}
          </ThemedText>
          <Pressable
            testID="calendar-empty-refresh"
            accessibilityRole="button"
            accessibilityLabel={t("calendar.sync.refreshLabel")}
            accessibilityState={{ disabled: isSyncing }}
            disabled={isSyncing}
            hitSlop={Spacing.two}
            onPress={onRetry}
            style={[
              styles.retryButton,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText type="smallBold">
              {t("calendar.sync.refresh")}
            </ThemedText>
          </Pressable>
        </View>
      )}
      {isError && (
        <ErrorNotice
          compact
          testID="calendar-sync-error"
          message={t("calendar.sync.error")}
          action={{
            label: t("calendar.sync.retry"),
            accessibilityLabel: t("calendar.sync.retryLabel"),
            testID: "calendar-sync-retry",
            onPress: onRetry,
            busy: isSyncing,
          }}
        />
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
  emptyState: { gap: Spacing.two, alignItems: "flex-start" },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
})
