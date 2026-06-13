import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Spacing } from "@/constants/theme"
import { crashTest, logEvent } from "@/firebase"
import { useTheme } from "@/hooks/use-theme"

// Dev-only surface for the step-8 end-to-end Firebase verification: one button
// logs an Analytics event, the other forces a native crash. Rendered behind
// __DEV__ so it never appears in production. It is also the first live exercise
// of the four react-native-a11y touchable rules (until now guarding an empty
// surface) — hence the explicit role + translated label on each Pressable.
export function FirebaseDebugPanel() {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <>
      <ThemedText type="smallBold">{t("debug.firebase.heading")}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("debug.firebase.logEvent")}
        onPress={() => {
          void logEvent("debug_test_event", { source: "debug_panel" })
        }}
        style={[styles.button, { borderColor: theme.text }]}
      >
        <ThemedText>{t("debug.firebase.logEvent")}</ThemedText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("debug.firebase.crash")}
        onPress={() => {
          crashTest()
        }}
        style={[styles.button, { borderColor: theme.text }]}
      >
        <ThemedText>{t("debug.firebase.crash")}</ThemedText>
      </Pressable>
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
})
