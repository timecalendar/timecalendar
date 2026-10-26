import { router, Stack } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import { Button, ButtonRow, PageIntro, RootPage } from "@/design"
import {
  safeIntranetUrl,
  useImportDraft,
  useJourneyGateRoute,
} from "@/features/onboarding/draft"
import { Spacing } from "@/theme"

import { stepStyles } from "./step-styles"

// The intranet link is gated on safeIntranetUrl: the URL is a server-owned
// string reaching a browser opener, so only http(s) renders a button.
// Continue is a plain push to the export guide with no state beyond the draft,
// so a later assistant step can be inserted there without touching this screen.
export default function ConnectScreen() {
  const { t } = useTranslation()
  const { state, draft, dispatch } = useImportDraft()
  const legal = useJourneyGateRoute(state, "connect")

  // An unlisted institution has no school row, hence no trusted URL.
  const school =
    draft?.institution.kind === "listed" ? draft.institution.school : null
  const intranetUrl = safeIntranetUrl(school?.intranetUrl)

  if (!legal) return null

  return (
    <>
      <Stack.Screen options={{ title: t("onboarding.connect.title") }} />
      <RootPage
        testID="onboarding-connect-content"
        lane="readable"
        style={stepStyles.fill}
        contentContainerStyle={[stepStyles.safeArea, styles.safeArea]}
      >
        <PageIntro caption={t("onboarding.connect.body")} />

        {school !== null && intranetUrl !== null && (
          <Button
            variant="outlined"
            testID="onboarding-connect-intranet"
            label={school.name}
            accessibilityRole="link"
            accessibilityLabel={t("onboarding.connect.intranetLabel", {
              institution: school.name,
            })}
            icon={{ ios: "arrow.up.right", android: "open_in_new" }}
            iconPosition="trailing"
            onPress={() => void WebBrowser.openBrowserAsync(intranetUrl)}
            style={styles.stretch}
          />
        )}

        <ButtonRow
          secondary={
            <Button
              variant="outlined"
              testID="onboarding-connect-back"
              label={t("common.back")}
              onPress={() => router.back()}
            />
          }
          primary={
            <Button
              variant="filled"
              testID="onboarding-connect-continue"
              label={t("onboarding.connect.continue")}
              accessibilityLabel={t("onboarding.connect.continueLabel")}
              onPress={() => {
                dispatch({ type: "complete-connect" })
                router.push("/onboarding/export-guide/0")
              }}
            />
          }
        />
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  // Wider than the shared step gap: this step's three blocks (intro, optional
  // link, footer) read as separate offers rather than one form.
  safeArea: {
    gap: Spacing.four,
  },
  stretch: { alignSelf: "stretch" },
})
