import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native"

import { ColorDotSize, Radii, useTheme } from "@/theme"

export type ColorDotSizeName = keyof typeof ColorDotSize

export type ColorDotRing = "background" | "backgroundElement" | "homeHero"

export type ColorDotLayoutStyle = Pick<
  ViewStyle,
  | "alignSelf"
  | "margin"
  | "marginTop"
  | "marginBottom"
  | "marginStart"
  | "marginEnd"
  | "marginLeft"
  | "marginRight"
  | "marginHorizontal"
  | "marginVertical"
  | "zIndex"
>

export type ColorDotProps = {
  color: string
  size?: ColorDotSizeName
  ring?: ColorDotRing
  testID?: string
  style?: StyleProp<ColorDotLayoutStyle>
}

const RING_WIDTH = 2

export function ColorDot({
  color,
  size = "medium",
  ring,
  testID,
  style,
}: ColorDotProps) {
  const theme = useTheme()
  const diameter = ColorDotSize[size]
  return (
    <View
      testID={testID}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.flatten([
        {
          width: diameter,
          height: diameter,
          borderRadius: Radii.pill,
          backgroundColor: color,
        },
        ring === undefined
          ? null
          : { borderWidth: RING_WIDTH, borderColor: theme[ring] },
        style,
      ])}
    />
  )
}
