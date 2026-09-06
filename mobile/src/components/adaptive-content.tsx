import { useCallback, useMemo, useState } from "react"
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from "react-native"

import {
  resolveResponsiveLayout,
  type ResponsiveLane,
  type ResponsiveLayoutMetrics,
} from "@/theme"

export type AdaptiveLayout = {
  metrics: ResponsiveLayoutMetrics
  laneStyle: ViewStyle
  onLayout: (event: LayoutChangeEvent) => void
}

export function useAdaptiveLayout(lane: ResponsiveLane): AdaptiveLayout {
  const [ownerWidth, setOwnerWidth] = useState(0)
  const metrics = useMemo(
    () => resolveResponsiveLayout(ownerWidth, lane),
    [lane, ownerWidth],
  )
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width
    if (Number.isFinite(nextWidth) && nextWidth > 0) {
      setOwnerWidth(nextWidth)
    }
  }, [])
  const laneStyle = useMemo<ViewStyle>(() => {
    if (metrics.maxContentWidth === null) {
      return styles.fullBleed
    }

    return {
      alignSelf: "center",
      width: "100%",
      maxWidth: metrics.maxContentWidth + 2 * metrics.gutter,
      paddingHorizontal: metrics.gutter,
    }
  }, [metrics])

  return { metrics, laneStyle, onLayout }
}

export type AdaptiveContentProps = ViewProps & {
  lane: ResponsiveLane
  contentContainerStyle?: StyleProp<ViewStyle>
}

export function AdaptiveContent({
  lane,
  children,
  contentContainerStyle,
  onLayout: callerOnLayout,
  style,
  ...ownerProps
}: AdaptiveContentProps) {
  const { laneStyle, onLayout } = useAdaptiveLayout(lane)
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout(event)
      callerOnLayout?.(event)
    },
    [callerOnLayout, onLayout],
  )

  return (
    <View {...ownerProps} onLayout={handleLayout} style={[styles.owner, style]}>
      <View style={[laneStyle, contentContainerStyle]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  owner: {
    width: "100%",
  },
  fullBleed: {
    width: "100%",
  },
})
