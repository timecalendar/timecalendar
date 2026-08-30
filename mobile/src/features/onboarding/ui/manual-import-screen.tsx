import { router } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The manual-import step (TIM-391 / design D7) — behavioural parity with
// Flutter's app/lib/modules/import_ical/screens/import_ical/import_ical_screen.dart
// (read-only reference): QR scanning and pasting an iCal link are offered from
// ONE screen, so the QR route finally has an in-app entry point (until now the
// only way to reach it was a deep link).
//
// It is deliberately an ORCHESTRATOR and nothing else: no camera permission
// lifecycle, no URL validation, no pending/error state, no create call, no
// failure reporting. All of that already exists — tested — on the two routes it
// pushes to, and duplicating any of it here would be a second, unproven copy of
// the app's only import path.
export default function ManualImportScreen() {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.intro}>
          <ThemedText type="title">{t("onboarding.import.title")}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {t("onboarding.import.body")}
          </ThemedText>
        </View>

        <Pressable
          testID="onboarding-import-qr"
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.import.qrLabel")}
          accessibilityHint={t("onboarding.import.qrHint")}
          hitSlop={Spacing.two}
          onPress={() => router.push("/onboarding/qr-scan")}
          style={[styles.primary, { backgroundColor: theme.primaryStrong }]}
        >
          <SymbolView
            name={{ ios: "qrcode.viewfinder", android: "qr_code_scanner" }}
            size={20}
            tintColor={theme.onPrimary}
            accessible={false}
          />
          <ThemedText type="smallBold" themeColor="onPrimary">
            {t("onboarding.import.qr")}
          </ThemedText>
        </Pressable>

        <Pressable
          testID="onboarding-import-url"
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.import.urlLabel")}
          accessibilityHint={t("onboarding.import.urlHint")}
          hitSlop={Spacing.two}
          onPress={() => router.push("/onboarding/ical-url")}
          style={[
            styles.secondary,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.primary,
            },
          ]}
        >
          <SymbolView
            name={{ ios: "link", android: "link" }}
            size={20}
            tintColor={theme.primary}
            accessible={false}
          />
          <ThemedText type="smallBold">{t("onboarding.import.url")}</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    justifyContent: "center",
    gap: Spacing.three,
  },
  intro: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  primary: {
    minHeight: 48,
    flexDirection: "row",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: Radii.medium,
  },
  secondary: {
    minHeight: 48,
    flexDirection: "row",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: Radii.medium,
    borderWidth: 2,
  },
})
