import { View, type ViewProps } from "react-native"

import { ThemeColor, useTheme } from "@/theme"

export type ThemedViewProps = ViewProps & {
  lightColor?: string
  darkColor?: string
  type?: ThemeColor
}

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme()

  return (
    <View
      style={[{ backgroundColor: theme[type ?? "background"] }, style]}
      {...otherProps}
    />
  )
}
