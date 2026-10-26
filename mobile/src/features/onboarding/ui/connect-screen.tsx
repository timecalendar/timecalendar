import { router, Stack } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/button"
import { PageIntro, RootPage } from "@/components/root-page"
import {
  safeIntranetUrl,
  useImportDraft,
  useJourneyGateRoute,
} from "@/features/onboarding/draft"
import { Spacing } from "@/theme"

import { stepStyles } from "./step-styles"

// The Connect step (TIM-391 / design D6) — behavioural parity with Flutter's
// app/lib/modules/assistant/screens/connect_screen.dart (read-only reference):
// explain that the student should open their institution's site on a computer or
// in the device browser to reach their timetable, offer the institution's own
// link when there is one, and always offer Back and Continue.
//
// The link is gated on safeIntranetUrl, not on `intranetUrl != null` as Flutter
// gates it. The schools API is a server-owned string reaching a browser opener:
// http(s) only, so a `javascript:`/`file:` value renders NO button rather than
// being handed to WebBrowser. An unlisted institution always takes that branch —
// there is no trusted URL for a school the student typed by hand.
//
// ── Assistant insertion point ────────────────────────────────────────────────
// Continue → /onboarding/import is the boundary a later assistant project
// inserts at (school → programme → connect → [ASSISTANT] → import). It is a
// plain push with no state handed forward beyond the draft, so inserting a step
// here requires no change to this screen or the ones before it.
// ─────────────────────────────────────────────────────────────────────────────
export default function ConnectScreen() {
  const { t } = useTranslation()
  const { state, draft, dispatch } = useImportDraft()
  const legal = useJourneyGateRoute(state, "connect")

  // An unlisted institution has no school row and therefore no trusted URL, so
  // both the link's label and its target come from the listed school or not at
  // all. `safeIntranetUrl` is total on null/undefined, which is what lets the
  // two live on one narrowing instead of two parallel ternaries.
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

        <View style={styles.footer}>
          <Button
            variant="outlined"
            testID="onboarding-connect-back"
            label={t("common.back")}
            onPress={() => router.back()}
          />
          <Button
            variant="filled"
            testID="onboarding-connect-continue"
            label={t("onboarding.connect.continue")}
            accessibilityLabel={t("onboarding.connect.continueLabel")}
            onPress={() => {
              dispatch({ type: "complete-connect" })
              router.push("/onboarding/export-guide/0")
            }}
            style={styles.grow}
          />
        </View>
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  grow: { flex: 1 },
})
