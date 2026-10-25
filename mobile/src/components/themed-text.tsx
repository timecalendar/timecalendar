import { Text, type TextProps } from "react-native"

import { ThemeColor, TypeRamp, TypeVariant, useTheme } from "@/theme"

type LegacyTypeAlias = "default" | "small" | "smallBold" | "subtitle"

export type ThemedTextType = TypeVariant | LegacyTypeAlias

/**
 * Text color role. `primary` is the primary label color (UIKit `.label`), not
 * brand pink; brand-colored text is `action`.
 */
export type TextTone =
  | "primary"
  | "secondary"
  | "action"
  | "destructive"
  | "onPrimary"

const legacyTypeAliases: Record<LegacyTypeAlias, TypeVariant> = {
  default: "body",
  small: "callout",
  smallBold: "label",
  subtitle: "sectionTitle",
}

const headingRole: Record<TypeVariant, boolean> = {
  largeTitle: true,
  title: true,
  title2: true,
  sectionTitle: true,
  headline: false,
  body: false,
  callout: false,
  label: false,
  footnote: false,
  caption: false,
  captionSmall: false,
}

const toneColor: Record<TextTone, ThemeColor> = {
  primary: "text",
  secondary: "textSecondary",
  action: "actionText",
  destructive: "destructive",
  onPrimary: "onPrimary",
}

type ColorProps =
  | { tone?: TextTone; themeColor?: never }
  | { tone?: never; themeColor?: ThemeColor }

export type ThemedTextProps = TextProps & { type?: ThemedTextType } & ColorProps

function isLegacyTypeAlias(type: ThemedTextType): type is LegacyTypeAlias {
  return Object.hasOwn(legacyTypeAliases, type)
}

function resolveStep(type: ThemedTextType): TypeVariant {
  return isLegacyTypeAlias(type) ? legacyTypeAliases[type] : type
}

export function ThemedText({
  style,
  type = "body",
  tone,
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme()
  const step = resolveStep(type)

  return (
    <Text
      accessibilityRole={headingRole[step] ? "header" : undefined}
      dynamicTypeRamp={TypeRamp[step].dynamicTypeRamp}
      style={[
        { color: theme[themeColor ?? toneColor[tone ?? "primary"]] },
        TypeRamp[step].style,
        style,
      ]}
      {...rest}
    />
  )
}
