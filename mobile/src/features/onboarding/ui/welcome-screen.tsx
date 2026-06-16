import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// Entrance fade duration when motion is allowed. Skipped under reduced motion —
// the final frame (opacity 1) is identical, only the motion is lost (mirrors the
// splash's encoded contract).
const FADE_IN_MS = 300

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
// carousel with hand-drawn illustrations (those remain the inboxed designer
// polish) — typography + the brand tokens on @/theme, no Material port, no raw
// color literal. A subtle entrance fade honors reduced motion in the component
// (R-1: lint can't know which view animates), mirroring the splash pattern.
export default function WelcomeScreen() {
  const { t } = useTranslation()
  const theme = useTheme()

  // Reduced-motion state, read async on mount and kept current via the event
  // subscription. `null` until the read resolves so the fade is never scheduled
  // before we know motion is off (mirrors splash). The opacity starts at 0 and
  // animates (or snaps) to 1 — an entrance fade, so the pre-read frame is the
  // about-to-appear state, not a flash of wrong content.
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)
  const [opacity] = useState(() => new Animated.Value(0))

  useEffect(() => {
    let active = true
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled)
    })
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    )
    return () => {
      active = false
      sub.remove()
    }
  }, [])

  useEffect(() => {
    if (reduceMotion === null) return

    if (reduceMotion) {
      // No animation: show the final frame immediately (D5).
      opacity.setValue(1)
      return
    }

    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_IN_MS,
      useNativeDriver: true,
    })
    animation.start()
    return () => animation.stop()
  }, [reduceMotion, opacity])

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity }]}>
          <View style={styles.intro}>
            <ThemedText type="title">
              {t("onboarding.welcome.title")}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {t("onboarding.welcome.tagline")}
            </ThemedText>
          </View>

          <View style={styles.values}>
            <ThemedText>{t("onboarding.welcome.value.calendar")}</ThemedText>
            <ThemedText>
              {t("onboarding.welcome.value.notifications")}
            </ThemedText>
            <ThemedText>{t("onboarding.welcome.value.offline")}</ThemedText>
          </View>

          {/* The primary CTA — a FILLED white-on-brand button. White text on a
              brand fill rides `primaryStrong` #C2185B (onPrimary on primaryStrong
              = 5.87:1, AA body, both schemes — the load-bearing contrast rule in
              tokens.ts; the bright `primary` #E91E63 is accent-only at 4.35:1).
              The fill clears the 3:1 UI-component bar against `background` in both
              schemes. hitSlop + minHeight give the ≥44pt/48dp touch target. */}
          <Pressable
            testID="onboarding-welcome-cta"
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.welcome.ctaLabel")}
            hitSlop={Spacing.two}
            onPress={() => router.push("/onboarding/school")}
            style={[styles.cta, { backgroundColor: theme.primaryStrong }]}
          >
            <ThemedText type="smallBold" themeColor="onPrimary">
              {t("onboarding.welcome.cta")}
            </ThemedText>
          </Pressable>

          {/* The secondary "scan a QR code" path into the calendar-sources QR
              scanner (Phase-3 ship 3). A lower-emphasis accent-border button (the
              brand as a tint, not a fill): brand-tinted border + the `text` label
              on `backgroundElement` (AAA). */}
          <Pressable
            testID="onboarding-welcome-scan-cta"
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.welcome.scanCtaLabel")}
            hitSlop={Spacing.two}
            onPress={() => router.push("/onboarding/qr-scan")}
            style={[
              styles.cta,
              styles.ctaSecondary,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.primary,
              },
            ]}
          >
            <ThemedText type="smallBold">
              {t("onboarding.welcome.scanCta")}
            </ThemedText>
          </Pressable>

          {/* The secondary "add by URL" path into the calendar-sources iCal-URL
              entry screen (Phase-3 ship 4). Same accent-border pattern. */}
          <Pressable
            testID="onboarding-welcome-url-cta"
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.welcome.urlCtaLabel")}
            hitSlop={Spacing.two}
            onPress={() => router.push("/onboarding/ical-url")}
            style={[
              styles.cta,
              styles.ctaSecondary,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.primary,
              },
            ]}
          >
            <ThemedText type="smallBold">
              {t("onboarding.welcome.urlCta")}
            </ThemedText>
          </Pressable>
        </Animated.View>
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
  },
  content: {
    flex: 1,
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
  },
  ctaSecondary: {
    borderWidth: 2,
  },
})
