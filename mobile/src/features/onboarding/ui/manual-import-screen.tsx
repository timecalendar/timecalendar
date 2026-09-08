import { router, Stack } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet } from "react-native"

import { PageIntro, RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import {
  useImportDraft,
  useProtectedImportRoute,
} from "@/features/onboarding/draft"
import { Radii, Spacing, useTheme } from "@/theme"

import { stepStyles } from "./step-styles"

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
  const { dispatch } = useImportDraft()
  const legal = useProtectedImportRoute("manual", "/onboarding/import")

  if (!legal) return null

  return (
    <>
      <Stack.Screen options={{ title: t("onboarding.import.title") }} />
      <RootPage
        testID="onboarding-import-content"
        lane="readable"
        style={stepStyles.fill}
        contentContainerStyle={stepStyles.safeArea}
      >
        <PageIntro caption={t("onboarding.import.body")} style={styles.intro} />

        <Pressable
          testID="onboarding-import-qr"
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.import.qrLabel")}
          accessibilityHint={t("onboarding.import.qrHint")}
          hitSlop={Spacing.two}
          onPress={() => {
            dispatch({ type: "set-manual-handoff", target: "qr" })
            router.push("/onboarding/qr-scan")
          }}
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
          onPress={() => {
            dispatch({ type: "set-manual-handoff", target: "ical" })
            router.push("/onboarding/ical-url")
          }}
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
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  // Extra breathing room under the intro so the two offers below read as a pair
  // rather than as a third paragraph.
  intro: {
    marginBottom: Spacing.two,
  },
  // The QR/link pair stays local and stays together: the filled-vs-outlined
  // contrast is what tells the student QR is the recommended route.
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
