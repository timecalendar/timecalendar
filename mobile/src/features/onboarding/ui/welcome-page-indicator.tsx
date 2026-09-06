import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, View } from "react-native"
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Radii, Spacing, useTheme } from "@/theme"

const INDICATOR_ANIMATION_MS = 150
const ACTIVE_INDICATOR_WIDTH = 24
const INACTIVE_INDICATOR_WIDTH = 16
const CONTROL_MIN_HEIGHT = Platform.OS === "ios" ? 44 : 48

type IndicatorPillProps = {
  active: boolean
  index: number
  reduceMotion: boolean | null
}

function IndicatorPill({ active, index, reduceMotion }: IndicatorPillProps) {
  const theme = useTheme()
  const targetWidth = active ? ACTIVE_INDICATOR_WIDTH : INACTIVE_INDICATOR_WIDTH
  const width = useSharedValue(targetWidth)
  const animatedStyle = useAnimatedStyle(() => ({ width: width.value }))

  useEffect(() => {
    cancelAnimation(width)
    if (reduceMotion === null) return

    width.set(
      reduceMotion
        ? targetWidth
        : withTiming(targetWidth, { duration: INDICATOR_ANIMATION_MS }),
    )

    return () => cancelAnimation(width)
  }, [reduceMotion, targetWidth, width])

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no"
      testID={`onboarding-page-indicator-${index}`}
      style={[
        styles.indicatorPill,
        {
          backgroundColor: active ? theme.primary : theme.backgroundSelected,
        },
        animatedStyle,
        reduceMotion === true && { width: targetWidth },
      ]}
    />
  )
}

type WelcomePageIndicatorProps = {
  currentPage: number
  pageCount: number
  reduceMotion: boolean | null
}

export function WelcomePageIndicator({
  currentPage,
  pageCount,
  reduceMotion,
}: WelcomePageIndicatorProps) {
  const { t } = useTranslation()

  return (
    <View
      testID="onboarding-page-indicator"
      accessible
      accessibilityLabel={t("onboarding.pageIndicator", {
        current: currentPage + 1,
        total: pageCount,
      })}
      style={styles.indicator}
    >
      {Array.from({ length: pageCount }, (_, index) => (
        <IndicatorPill
          key={String(index)}
          active={index === currentPage}
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
