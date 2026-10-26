import type { SFSymbol } from "expo-symbols"
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native"

import { useEventSurfaceAppearance } from "@/design/event-surface/event-surface-context"
import { Icon, type MaterialGlyph } from "@/design/icon/icon"
import { ThemedText } from "@/design/text/themed-text"
import {
  Radii,
  Spacing,
  type ThemeColor,
  TypeRamp,
  type TypeVariant,
  useTheme,
} from "@/theme"

export type BadgeTone =
  | "brand"
  | "neutral"
  | "positive"
  | "informational"
  | "destructive"
  | "onEventSurface"

export type BadgeSize = "small" | "medium"

export type BadgeIcon = { ios?: SFSymbol; android?: MaterialGlyph }

export type BadgeLayoutStyle = Pick<
  ViewStyle,
  | "alignSelf"
  | "flexShrink"
  | "maxWidth"
  | "margin"
  | "marginTop"
  | "marginBottom"
  | "marginStart"
  | "marginEnd"
  | "marginLeft"
  | "marginRight"
  | "marginHorizontal"
  | "marginVertical"
>

export type BadgeProps = {
  label: string
  tone: BadgeTone
  size?: BadgeSize
  icon?: BadgeIcon
  accessibilityLabel: string | null
  testID?: string | undefined
  style?: StyleProp<BadgeLayoutStyle>
}

type ToneSpec = { fill?: ThemeColor; outline?: true; label: ThemeColor }

const tones: Record<Exclude<BadgeTone, "onEventSurface">, ToneSpec> = {
  brand: { fill: "primarySoft", label: "onPrimarySoft" },
  neutral: { fill: "backgroundElement", label: "textSecondary" },
  positive: { outline: true, label: "positive" },
  informational: { outline: true, label: "informational" },
  destructive: { outline: true, label: "destructive" },
}

const sizes = {
  small: {
    type: "caption",
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  medium: {
    type: "label",
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.one,
  },
} as const satisfies Record<
  BadgeSize,
  { type: TypeVariant; paddingHorizontal: number; paddingVertical: number }
>

export function Badge({
  label,
  tone,
  size = "medium",
  icon,
  accessibilityLabel,
  testID,
  style,
}: BadgeProps) {
  const theme = useTheme()
  const surface = useEventSurfaceAppearance()
  const metrics = sizes[size]
  let fill: string | undefined
  let labelColor: string
  let outlined = true
  if (tone === "onEventSurface") {
    if (surface === undefined) {
      throw new Error(
        "Badge tone onEventSurface must be rendered inside an EventSurface",
      )
    }
    labelColor = surface.foreground
  } else {
    const spec = tones[tone]
    fill = spec.fill === undefined ? undefined : theme[spec.fill]
    outlined = spec.outline === true
    labelColor = theme[spec.label]
  }
  const a11y =
    accessibilityLabel === null
      ? ({
          accessibilityElementsHidden: true,
          importantForAccessibility: "no-hide-descendants",
        } as const)
      : ({
          accessible: true,
          accessibilityRole: "text",
          accessibilityLabel,
        } as const)

  return (
    <View
      testID={testID}
      {...a11y}
      style={StyleSheet.flatten([
        styles.base,
        {
          paddingHorizontal: metrics.paddingHorizontal,
          paddingVertical: metrics.paddingVertical,
        },
        fill === undefined ? null : { backgroundColor: fill },
        outlined ? { borderWidth: 1, borderColor: labelColor } : null,
        style,
      ])}
    >
      {icon ? (
        <Icon
          {...icon}
          {...(testID === undefined ? {} : { testID: `${testID}-icon` })}
          size={TypeRamp[metrics.type].style.fontSize as number}
          color={labelColor}
          scaling="text"
        />
      ) : null}
      <ThemedText
        testID={testID === undefined ? undefined : `${testID}-label`}
        type={metrics.type}
        numberOfLines={2}
        style={[styles.label, { color: labelColor }]}
      >
        {label}
      </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: Radii.pill,
    flexDirection: "row",
    flexShrink: 1,
    gap: Spacing.one,
    maxWidth: "100%",
  },
  label: { flexShrink: 1, fontVariant: ["tabular-nums"], textAlign: "center" },
})
