import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { retryLaunch, useLaunchState } from "@/features/startup/data"
import { Spacing, useTheme } from "@/theme"

export function LaunchFailureScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const launch = useLaunchState()
  if (launch.kind !== "failure") return null

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      testID="startup-failure"
      style={[styles.overlay, { backgroundColor: theme.background }]}
    >
      <ThemedText type="title">{t("startup.failure.title")}</ThemedText>
      <ThemedText>{t("startup.failure.message")}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("startup.failure.retryLabel")}
        onPress={retryLaunch}
        style={[styles.button, { backgroundColor: theme.primaryStrong }]}
      >
        <ThemedText style={{ color: theme.onPrimary }}>
          {t("startup.failure.retry")}
        </ThemedText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.four,
    zIndex: 2,
  },
  button: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
  },
})
