import type { SFSymbol } from "expo-symbols"
import {
  ActivityIndicator,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native"

import { Icon, type MaterialGlyph } from "@/components/icon"
import { ThemedText } from "@/components/themed-text"
import {
  IconSize,
  MinTouchTarget,
  Radii,
  Spacing,
  StateOpacity,
  type ThemeColor,
  useTheme,
} from "@/theme"

export type ButtonVariant =
  | "filled"
  | "tonal"
  | "outlined"
  | "text"
  | "destructive"

export type ButtonSize = "small" | "medium" | "large"

export type ButtonIcon = { ios: SFSymbol; android: MaterialGlyph }

export type ButtonLayoutStyle = Pick<
  ViewStyle,
  | "alignSelf"
  | "flex"
  | "flexGrow"
  | "flexShrink"
  | "flexBasis"
  | "width"
  | "minWidth"
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
  | "position"
  | "top"
  | "bottom"
  | "start"
  | "end"
  | "left"
  | "right"
  | "zIndex"
>

export type ButtonProps = {
  variant: ButtonVariant
  size?: ButtonSize
  label: string
  onPress: () => void
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: "button" | "link"
  icon?: ButtonIcon
  iconPosition?: "leading" | "trailing"
  disabled?: boolean
  busy?: boolean
  testID?: string
  style?: StyleProp<ButtonLayoutStyle>
}

type VariantSpec = {
  fill?: ThemeColor
  outline?: true
  label: ThemeColor
}

const variants: Record<ButtonVariant, VariantSpec> = {
  filled: { fill: "primaryStrong", label: "onPrimary" },
  tonal: { fill: "backgroundElement", label: "text" },
  outlined: { outline: true, label: "actionText" },
  text: { label: "actionText" },
  destructive: { fill: "backgroundElement", label: "destructive" },
}

const sizes = {
  small: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.twoHalf,
    textPaddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    type: "label",
    icon: IconSize.medium,
  },
  medium: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.four,
    textPaddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.two,
    type: "label",
    icon: IconSize.medium,
  },
  large: {
    minHeight: MinTouchTarget + Spacing.two,
    paddingHorizontal: Spacing.five,
    textPaddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    type: "headline",
    icon: IconSize.large,
  },
} as const satisfies Record<ButtonSize, object>

export function Button({
  variant,
  size = "medium",
  label,
  onPress,
  accessibilityLabel = label,
  accessibilityHint,
  accessibilityRole = "button",
  icon,
  iconPosition = "leading",
  disabled = false,
  busy = false,
  testID,
  style,
}: ButtonProps) {
  const theme = useTheme()
  const blocked = disabled || busy
  const spec = variants[variant]
  const metrics = sizes[size]
  const labelColor = theme[spec.label]
  const ios = Platform.OS === "ios"

  const glyph =
    icon && !busy ? (
      <Icon {...icon} size={metrics.icon} color={labelColor} scaling="text" />
    ) : null

  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy }}
      disabled={blocked}
      onPress={blocked ? undefined : onPress}
      android_ripple={
        ios || blocked ? undefined : { color: theme.ripple, foreground: true }
      }
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.base,
          ios ? styles.ios : styles.android,
          {
            minHeight: metrics.minHeight,
            paddingHorizontal:
              variant === "text"
                ? metrics.textPaddingHorizontal
                : metrics.paddingHorizontal,
            paddingVertical: metrics.paddingVertical,
          },
          spec.fill ? { backgroundColor: theme[spec.fill] } : null,
          spec.outline ? { borderWidth: 1, borderColor: theme.outline } : null,
          {
            opacity: blocked
              ? StateOpacity.disabled
              : pressed && ios
                ? StateOpacity.pressed
                : 1,
          },
          style,
        ])
      }
    >
      {busy ? (
        <ActivityIndicator
          testID={testID === undefined ? undefined : `${testID}-progress`}
          size="small"
          color={labelColor}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
      {iconPosition === "leading" ? glyph : null}
      <ThemedText
        type={metrics.type}
        themeColor={spec.label}
        numberOfLines={3}
        style={styles.label}
      >
        {label}
      </ThemedText>
      {iconPosition === "trailing" ? glyph : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minWidth: MinTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    borderRadius: Radii.large,
  },
  ios: { borderCurve: "continuous" },
  android: { overflow: "hidden" },
  label: { textAlign: "center", flexShrink: 1 },
})
