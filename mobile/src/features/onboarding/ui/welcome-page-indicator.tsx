import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { MinTouchTarget, Motion, Radii, Spacing, useTheme } from "@/theme"

import { WELCOME_PAGES } from "./welcome-page-catalog"

const ACTIVE_INDICATOR_WIDTH = 24
const INACTIVE_INDICATOR_WIDTH = 16

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
      width.set(withTiming(targetWidth, { duration: Motion.fast }))
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
    minHeight: MinTouchTarget,
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
