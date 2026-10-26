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

// Only orchestrates: the QR and iCal-URL routes it pushes own camera permission,
// URL validation, pending/error state and failure reporting.
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
