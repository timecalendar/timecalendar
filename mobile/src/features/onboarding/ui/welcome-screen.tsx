import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The onboarding welcome surface (Phase-3 ship 1 / ADR 015) — PRESENTATIONAL
// (70% floor): a native-default brand/intro surface that opens the existing
// school step. It owns no data — render + a single navigation only — so it lives
// in a presentation-only feature folder (src/features/onboarding/ui/, splash-
// shaped) with a thin src/app/onboarding/index.tsx re-export (route-structure
// rule; the colocated test stays out of the Metro route tree). It imports no
// seams (B-1) and not its own feature barrel (B-2); it navigates by route path
// (the loosest coupling) into the unchanged SchoolPickerScreen.
//
// Native-default (R-3): a single clean centered surface, NOT a Flutter-era paged
// carousel with hand-drawn illustrations (those are the inboxed designer polish,
// design D7) — typography + the brand `primary` accent on @/theme tokens, no
// Material port, no raw color literal. Static (no motion) → the reduced-motion
// obligation is trivially met (design D5).
export default function WelcomeScreen() {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.intro}>
          <ThemedText type="title">{t("onboarding.welcome.title")}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {t("onboarding.welcome.tagline")}
          </ThemedText>
        </View>

        <View style={styles.values}>
          <ThemedText>{t("onboarding.welcome.value.calendar")}</ThemedText>
          <ThemedText>{t("onboarding.welcome.value.notifications")}</ThemedText>
          <ThemedText>{t("onboarding.welcome.value.welcome")}</ThemedText>
        </View>

        {/* The CTA — the app's first surface tempted to put white text on a brand
            fill. Per the load-bearing contrast rule in tokens.ts, white-on-bright-
            `#E91E63` is only 4.35:1 (below the body floor), and a `#C2185B`
            primaryStrong token is deferred (R-2 — no white-on-brand consumer yet,
            that decision is inboxed in the designer-polish note). So the brand is
            used as an ACCENT, not a white-text fill: a brand-tinted border + the
            token `text` label (AAA) on the `backgroundElement` surface. The brand
            border meets the 3:1 UI-component bar (#E91E63 on #fff = 4.35:1,
            #FF4081 on #000 = 6.30:1); the label rides `text`/`backgroundElement`
            (light 18.4:1 / dark 16.0:1, AAA). hitSlop + minHeight give the
            ≥44pt/48dp touch target (mirrors the Profile links / school retry). */}
        <Pressable
          testID="onboarding-welcome-cta"
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.welcome.ctaLabel")}
          hitSlop={Spacing.two}
          onPress={() => router.push("/onboarding/school")}
          style={[
            styles.cta,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.primary,
            },
          ]}
        >
          <ThemedText type="smallBold">
            {t("onboarding.welcome.cta")}
          </ThemedText>
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
    paddingBottom: Spacing.four,
    justifyContent: "center",
    gap: Spacing.five,
  },
  intro: {
    gap: Spacing.three,
  },
  values: {
    gap: Spacing.three,
  },
  cta: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: Radii.medium,
    borderWidth: 2,
  },
})
