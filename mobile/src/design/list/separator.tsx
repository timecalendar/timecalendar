import { Platform, StyleSheet, View } from "react-native"

import { ListGeometry, useTheme } from "@/theme"

export type SeparatorProps = {
  inset?: "none" | "leading" | { leadingWidth: number }
  testID?: string | undefined
}

export function separatorInset(inset: SeparatorProps["inset"]): number {
  if (inset === undefined || inset === "none") return 0
  if (inset === "leading") return ListGeometry.rowPaddingHorizontal
  return (
    ListGeometry.rowPaddingHorizontal +
    inset.leadingWidth +
    ListGeometry.leadingGap
  )
}

export function Separator({ inset = "none", testID }: SeparatorProps) {
  const theme = useTheme()
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ paddingStart: separatorInset(inset) }}
    >
      <View
        style={{
          height: Platform.OS === "ios" ? StyleSheet.hairlineWidth : 1,
          backgroundColor: theme.separator,
        }}
      />
    </View>
  )
}
