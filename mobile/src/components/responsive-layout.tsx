import { type PropsWithChildren, useCallback, useState } from "react"
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"

import { ResponsiveContentWidth, Spacing } from "@/theme"

export const TabletBreakpoint = 600
export const AdaptiveColumnsBreakpoint = 834

export type ResponsiveLayoutMode = "compact" | "tablet"
export type ResponsiveLaneName = "readable" | "standard" | "fullBleed"

export type ResponsiveLayout = {
  width: number
  mode: ResponsiveLayoutMode
  gutter: number
  maxWidth: number | undefined
  outerMaxWidth: number | undefined
  columnsAllowed: boolean
}

export function resolveResponsiveLayout(
  measuredWidth: number,
  lane: ResponsiveLaneName = "standard",
): ResponsiveLayout {
  const width = measuredWidth > 0 ? measuredWidth : 0
  const mode = width >= TabletBreakpoint ? "tablet" : "compact"
  const maxWidth =
    lane === "fullBleed" ? undefined : ResponsiveContentWidth[lane]
  const gutter =
    lane === "fullBleed" ? 0 : Spacing[mode === "tablet" ? "six" : "four"]

  return {
    width,
    mode,
    gutter,
    maxWidth,
    outerMaxWidth: maxWidth === undefined ? undefined : maxWidth + gutter * 2,
    columnsAllowed: width >= AdaptiveColumnsBreakpoint,
  }
}

export function ResponsiveLane({
  children,
  lane = "standard",
  style,
  contentStyle,
  testID,
}: PropsWithChildren<{
  lane?: ResponsiveLaneName
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  testID?: string
}>) {
  const { layout, onLayout } = useResponsiveLayout(lane)

  return (
    <View
      testID={testID === undefined ? undefined : `${testID}-measure`}
      style={[styles.measure, style]}
      onLayout={onLayout}
    >
      <View
        testID={testID}
        style={[
          styles.content,
          layout.maxWidth === undefined
            ? styles.fullBleed
            : { maxWidth: layout.outerMaxWidth },
          layout.gutter > 0 && { paddingHorizontal: layout.gutter },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  )
}

export function useResponsiveLayout(lane: ResponsiveLaneName = "standard") {
  const [measuredWidth, setMeasuredWidth] = useState(0)
  const layout = resolveResponsiveLayout(measuredWidth, lane)
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width
    if (nextWidth > 0) {
      setMeasuredWidth((current) =>
        current === nextWidth ? current : nextWidth,
      )
    }
  }, [])

  return { layout, onLayout }
}

const styles = StyleSheet.create({
  measure: { width: "100%" },
  content: { width: "100%", alignSelf: "center" },
  fullBleed: { maxWidth: "100%" },
})
