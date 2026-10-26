import { type PropsWithChildren, useEffect } from "react"
import { StyleSheet } from "react-native"
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Motion } from "@/theme"

type WelcomeEntranceProps = PropsWithChildren<{
  reduceMotion: boolean | null
}>

export function WelcomeEntrance({
  children,
  reduceMotion,
}: WelcomeEntranceProps) {
  const opacity = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  useEffect(() => {
    if (reduceMotion === null) return

    opacity.set(reduceMotion ? 1 : withTiming(1, { duration: Motion.base }))

    return () => cancelAnimation(opacity)
  }, [opacity, reduceMotion])

  return (
    <Animated.View
      testID="onboarding-welcome-entrance"
      style={[
        styles.content,
        animatedStyle,
        reduceMotion === true && styles.reducedMotion,
      ]}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  reducedMotion: {
    opacity: 1,
  },
})
