import { Platform, StyleSheet } from "react-native"

import { Radii, Spacing, type ThemeColor, useTheme } from "@/theme"

// The box keeps text in place when its border thickens: padding gives back
// whatever the border takes.
export const FieldInset = {
  horizontal: Spacing.three,
  vertical: Spacing.twoHalf,
} as const

type BoxState = { focused: boolean; error: boolean }

function fieldBorder({ focused, error }: BoxState): {
  width: number
  color: ThemeColor
} {
  if (Platform.OS === "ios") {
    return error
      ? { width: 1, color: "error" }
      : { width: StyleSheet.hairlineWidth, color: "outline" }
  }
  return {
    width: focused ? 2 : 1,
    color: error ? "error" : focused ? "primary" : "outline",
  }
}

export function useFieldBoxStyle(state: BoxState) {
  const theme = useTheme()
  const border = fieldBorder(state)
  const ios = Platform.OS === "ios"
  return {
    borderWidth: border.width,
    style: [
      styles.box,
      ios ? styles.iosBox : styles.androidBox,
      {
        borderWidth: border.width,
        borderColor: theme[border.color],
        backgroundColor: ios ? theme.backgroundElement : "transparent",
      },
    ],
  }
}

const styles = StyleSheet.create({
  box: { overflow: "hidden" },
  iosBox: { borderRadius: Radii.medium, borderCurve: "continuous" },
  androidBox: { borderRadius: Radii.small },
})
