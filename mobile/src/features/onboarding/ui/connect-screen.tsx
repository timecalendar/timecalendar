import { router } from "expo-router"
import { SymbolView } from "expo-symbols"
import * as WebBrowser from "expo-web-browser"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { safeIntranetUrl, useImportDraft } from "@/features/onboarding/draft"
import { Radii, Spacing, useTheme } from "@/theme"

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
  const theme = useTheme()
  const { draft } = useImportDraft()

  // An unlisted institution has no school row and therefore no trusted URL, so
  // both the link's label and its target come from the listed school or not at
  // all. `safeIntranetUrl` is total on null/undefined, which is what lets the
  // two live on one narrowing instead of two parallel ternaries.
  const school =
    draft?.institution.kind === "listed" ? draft.institution.school : null
  const intranetUrl = safeIntranetUrl(school?.intranetUrl)

  return (
    <ThemedView style={stepStyles.container}>
      <SafeAreaView style={[stepStyles.safeArea, styles.safeArea]}>
        <View style={stepStyles.intro}>
          <ThemedText type="title">{t("onboarding.connect.title")}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {t("onboarding.connect.body")}
          </ThemedText>
        </View>

        {school !== null && intranetUrl !== null && (
          <Pressable
            testID="onboarding-connect-intranet"
            accessibilityRole="link"
            accessibilityLabel={t("onboarding.connect.intranetLabel", {
              institution: school.name,
            })}
            hitSlop={Spacing.two}
            onPress={() => void WebBrowser.openBrowserAsync(intranetUrl)}
            style={[
              styles.intranetLink,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.primary,
              },
            ]}
          >
            <ThemedText type="smallBold">{school.name}</ThemedText>
            <SymbolView
              name={{
                ios: "arrow.up.right",
                android: "open_in_new",
                web: "open_in_new",
              }}
              size={18}
              tintColor={theme.primary}
              accessible={false}
            />
          </Pressable>
        )}

        <View style={styles.footer}>
          <Pressable
            testID="onboarding-connect-back"
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            hitSlop={Spacing.two}
            onPress={() => router.back()}
            style={[styles.secondary, { borderColor: theme.primary }]}
          >
            <ThemedText type="smallBold" themeColor="primary">
              {t("common.back")}
            </ThemedText>
          </Pressable>
          <Pressable
            testID="onboarding-connect-continue"
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.connect.continueLabel")}
            hitSlop={Spacing.two}
            onPress={() => router.push("/onboarding/import")}
            style={[styles.primary, { backgroundColor: theme.primaryStrong }]}
          >
            <ThemedText type="smallBold" themeColor="onPrimary">
              {t("onboarding.connect.continue")}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  // Wider than the shared step gap: this step's three blocks (intro, optional
  // link, footer) read as separate offers rather than one form.
  safeArea: {
    gap: Spacing.four,
  },
  intranetLink: {
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
  // The Back/Continue pair stays local and stays together: the outlined-vs-filled
  // contrast between the two is the thing worth reading side by side.
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  secondary: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radii.medium,
    borderWidth: 2,
  },
  primary: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radii.medium,
  },
})
