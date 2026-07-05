import { StyleSheet, View } from "react-native"

import { MaxContentWidth, Spacing, useTheme } from "@/theme"

import { LogoSize } from "./school-logo"

const SeparatorInset = Spacing.three + LogoSize + Spacing.three

export function RowSeparator() {
  const theme = useTheme()
  return (
    <View style={styles.separator}>
      <View
        style={[styles.separatorLine, { backgroundColor: theme.separator }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  separator: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingLeft: SeparatorInset,
  },
  separatorLine: {
    height: StyleSheet.hairlineWidth,
  },
})
