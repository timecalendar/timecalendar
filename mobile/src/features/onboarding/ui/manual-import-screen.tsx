import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import { Button, PageIntro, RootPage } from "@/design"
import {
  useImportDraft,
  useProtectedImportRoute,
} from "@/features/onboarding/draft"
import { Spacing } from "@/theme"

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

        <Button
          variant="filled"
          testID="onboarding-import-qr"
          label={t("onboarding.import.qr")}
          accessibilityLabel={t("onboarding.import.qrLabel")}
          accessibilityHint={t("onboarding.import.qrHint")}
          icon={{ ios: "qrcode.viewfinder", android: "qr_code_scanner" }}
          onPress={() => {
            dispatch({ type: "set-manual-handoff", target: "qr" })
            router.push("/onboarding/qr-scan")
          }}
        />

        <Button
          variant="outlined"
          testID="onboarding-import-url"
          label={t("onboarding.import.url")}
          accessibilityLabel={t("onboarding.import.urlLabel")}
          accessibilityHint={t("onboarding.import.urlHint")}
          icon={{ ios: "link", android: "link" }}
          onPress={() => {
            dispatch({ type: "set-manual-handoff", target: "ical" })
            router.push("/onboarding/ical-url")
          }}
        />
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
})
