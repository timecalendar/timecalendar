import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, View } from "react-native"
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Radii, Spacing, useTheme } from "@/theme"

import { WELCOME_PAGES } from "./welcome-page-catalog"

const INDICATOR_ANIMATION_MS = 150
const ACTIVE_INDICATOR_WIDTH = 24
const INACTIVE_INDICATOR_WIDTH = 16
const CONTROL_MIN_HEIGHT = Platform.OS === "ios" ? 44 : 48

type IndicatorPillProps = {
  active: boolean
  backgroundColor: string
  index: number
  reduceMotion: boolean | null
}

function IndicatorPill({
  active,
  backgroundColor,
  index,
  reduceMotion,
}: IndicatorPillProps) {
  const targetWidth = active ? ACTIVE_INDICATOR_WIDTH : INACTIVE_INDICATOR_WIDTH
  const width = useSharedValue(targetWidth)
  const previousTarget = useRef(targetWidth)
  const animatedStyle = useAnimatedStyle(() => ({ width: width.value }))

  useEffect(() => {
    if (reduceMotion === null) return

    const targetChanged = previousTarget.current !== targetWidth
    previousTarget.current = targetWidth

    if (reduceMotion) {
      width.set(targetWidth)
    } else if (targetChanged) {
      width.set(withTiming(targetWidth, { duration: INDICATOR_ANIMATION_MS }))
    }

    return () => cancelAnimation(width)
  }, [reduceMotion, targetWidth, width])

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no"
      testID={`onboarding-page-indicator-${index}`}
      style={[
        styles.indicatorPill,
        { backgroundColor },
        animatedStyle,
        reduceMotion === true && { width: targetWidth },
      ]}
    />
  )
}

type WelcomePageIndicatorProps = {
  currentPage: number
  reduceMotion: boolean | null
}

export function WelcomePageIndicator({
  currentPage,
  reduceMotion,
}: WelcomePageIndicatorProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <View
      testID="onboarding-page-indicator"
      accessible
      accessibilityLabel={t("onboarding.pageIndicator", {
        current: currentPage + 1,
        total: WELCOME_PAGES.length,
      })}
      style={styles.indicator}
    >
      {WELCOME_PAGES.map((page, index) => (
        <IndicatorPill
          key={page.id}
          active={index === currentPage}
          backgroundColor={
            index === currentPage ? theme.primary : theme.backgroundSelected
          }
          index={index}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  indicator: {
    minHeight: CONTROL_MIN_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  indicatorPill: {
    height: Spacing.two,
    borderRadius: Radii.pill,
  },
})
