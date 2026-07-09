import { StyleSheet, Text, type TextProps } from "react-native"

import { ThemeColor, useTheme } from "@/theme"

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
    | "small"
    | "smallBold"
    | "subtitle"
    | "caption"
    | "captionSmall"
  themeColor?: ThemeColor
}

export function ThemedText({
  style,
  type = "default",
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme()
  const isHeading = type === "title" || type === "subtitle"

  return (
    <Text
      accessibilityRole={isHeading ? "header" : undefined}
      style={[
        { color: theme[themeColor ?? "text"] },
        type === "default" && styles.default,
        type === "title" && styles.title,
        type === "small" && styles.small,
        type === "smallBold" && styles.smallBold,
        type === "caption" && styles.caption,
        type === "captionSmall" && styles.captionSmall,
        type === "subtitle" && styles.subtitle,
        style,
      ]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  // Dense-tile text a step below `small`: a compact semibold title (`caption`)
  // over a lighter, smaller secondary line (`captionSmall`) — the readable
  // hierarchy for the calendar grid's narrow event tiles. Tight line heights so
  // wrapped titles fit before the tile clips.
  caption: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: 600,
  },
  captionSmall: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: 400,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
})
