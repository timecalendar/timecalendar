import { Platform, StyleSheet, View } from "react-native"

import {
  type SeparatorInset,
  separatorInset,
} from "@/design/list/separator-inset"
import { useTheme } from "@/theme"

export type SeparatorProps = {
  inset?: SeparatorInset
  testID?: string | undefined
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
