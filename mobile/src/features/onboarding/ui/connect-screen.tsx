import { router } from "expo-router"
import { SymbolView } from "expo-symbols"
import * as WebBrowser from "expo-web-browser"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { safeIntranetUrl, useImportDraft } from "@/features/onboarding/draft"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

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

  const institution = draft?.institution
  const intranetUrl =
    institution?.kind === "listed"
      ? safeIntranetUrl(institution.school.intranetUrl)
      : null
  const institutionName =
    institution?.kind === "listed" ? institution.school.name : null

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.intro}>
          <ThemedText type="title">{t("onboarding.connect.title")}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {t("onboarding.connect.body")}
          </ThemedText>
        </View>

        {intranetUrl !== null && institutionName !== null && (
          <Pressable
            testID="onboarding-connect-intranet"
            accessibilityRole="link"
            accessibilityLabel={t("onboarding.connect.intranetLabel", {
              institution: institutionName,
            })}
            hitSlop={Spacing.two}
            onPress={() => void WebBrowser.openBrowserAsync(intranetUrl)}
            style={[
              styles.cta,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.primary,
              },
            ]}
          >
            <ThemedText type="smallBold">{institutionName}</ThemedText>
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
    gap: Spacing.four,
  },
  intro: {
    gap: Spacing.three,
  },
  cta: {
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
