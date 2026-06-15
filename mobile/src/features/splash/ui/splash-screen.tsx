import * as ExpoSplashScreen from "expo-splash-screen"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AccessibilityInfo, Animated, StyleSheet } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { useAppReady } from "@/hooks/use-app-ready"
import { Spacing, useTheme } from "@/theme"

// Keep the native static splash up until JS is ready (design D1). Called in the
// global scope without awaiting per the SDK guidance — calling it inside the
// component/effect can run too late, after the native splash already hid.
void ExpoSplashScreen.preventAutoHideAsync()

// Fade-out duration when motion is allowed. Skipped entirely under reduced
// motion (design D2) — the final frame is identical, only the motion is lost.
const FADE_OUT_MS = 300

/**
 * JS splash overlay that visually continues the native static splash: same
 * brand on a themed background, mounted by the root layout above the navigation
 * Stack so it covers the whole app during startup. It hides the native splash
 * once it has mounted (native→JS handoff, no flash — D1), then fades itself out
 * when `useAppReady()` resolves. Reduced motion is honored in the component
 * (R-1: lint can't know which view animates), as the app's first animation.
 */
export function SplashScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const ready = useAppReady()

  // Reduced-motion state, read async on mount and kept current via the event
  // subscription so a mid-splash toggle is respected (the splash is
  // short-lived, but correct). `null` until the async read resolves — dismissal
  // waits for it so the fade is never scheduled before we know motion is off
  // (readiness can resolve first, the read is async — D2). The test mocks
  // `isReduceMotionEnabled` to drive both branches.
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)
  const [hidden, setHidden] = useState(false)
  // Lazy state (not useRef): a stable Animated.Value the compiler doesn't flag
  // as a render-time ref read; never reassigned, only driven by Animated.timing.
  const [opacity] = useState(() => new Animated.Value(1))

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

  // Native→JS handoff: the overlay is mounted and painted, so release the
  // native splash. The JS overlay is already covering the screen, so there is
  // no flash of empty content (D1).
  useEffect(() => {
    void ExpoSplashScreen.hideAsync()
  }, [])

  useEffect(() => {
    // Wait for both readiness and the reduced-motion read before dismissing, so
    // the fade is never scheduled in the window before motion preference is known.
    if (!ready || reduceMotion === null) return

    if (reduceMotion) {
      // No animation: drop the final frame immediately (D2). Deferred to a
      // microtask so the dismissal isn't a synchronous setState in the effect
      // body (cascading renders) while staying instant and motionless.
      let active = true
      queueMicrotask(() => {
        if (active) setHidden(true)
      })
      return () => {
        active = false
      }
    }

    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    })
    animation.start(({ finished }) => {
      if (finished) setHidden(true)
    })
    return () => animation.stop()
  }, [ready, reduceMotion, opacity])

  if (hidden) return null

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t("splash.status.loading")}
      accessibilityLiveRegion="polite"
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { backgroundColor: theme.background, opacity },
      ]}
    >
      <ThemedText type="title">{t("app.name")}</ThemedText>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
    // Cover the navigation Stack while startup completes.
    zIndex: 1,
  },
})
