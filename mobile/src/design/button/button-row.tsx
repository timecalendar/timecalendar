import type { ReactElement } from "react"
import { type StyleProp, StyleSheet, View } from "react-native"

import { Spacing, useIsAccessibilityTextSize } from "@/theme"

import type { ButtonLayoutStyle, ButtonProps } from "./button"

export type ButtonRowProps = {
  primary: ReactElement<ButtonProps>
  secondary: ReactElement<ButtonProps>
  testID?: string
  style?: StyleProp<ButtonLayoutStyle>
}

export function ButtonRow({
  primary,
  secondary,
  testID,
  style,
}: ButtonRowProps) {
  const stacked = useIsAccessibilityTextSize()
  // Keyed wrappers let React reorder the same button instances instead of
  // remounting them when the text size crosses the threshold.
  const primarySlot = (
    <View key="primary" style={!stacked && styles.primary}>
      {primary}
    </View>
  )
  const secondarySlot = (
    <View key="secondary" style={!stacked && styles.secondary}>
      {secondary}
    </View>
  )

  return (
    <View
      testID={testID}
      style={[stacked ? styles.stacked : styles.row, style]}
    >
      {stacked ? [primarySlot, secondarySlot] : [secondarySlot, primarySlot]}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  stacked: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: Spacing.three,
  },
  secondary: {
    flexShrink: 1,
    maxWidth: "50%",
  },
  primary: {
    flex: 1,
  },
})
