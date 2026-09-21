import type { Href } from "expo-router"
import type { AndroidSymbol, SFSymbol } from "expo-symbols"

import { NativeSettingsRow } from "@/components/chrome"

interface SettingsRowBaseProps {
  icon: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol }
  label: string
  accessibilityLabel?: string
  testID: string
  first?: boolean
}

interface SettingsRouterRowProps extends SettingsRowBaseProps {
  variant?: "router"
  href: Href
  hint: string
  secondary?: string
  badge?: string
  onPress?: never
  value?: never
}

interface SettingsActionRowProps extends SettingsRowBaseProps {
  variant: "action"
  onPress: () => void
  hint: string
  accessibilityRole?: "button" | "link"
  secondary?: string
  badge?: string
  href?: never
  value?: never
}

interface SettingsValueRowProps extends SettingsRowBaseProps {
  variant: "value"
  value: string
  href?: never
  hint?: never
  onPress?: never
  secondary?: never
}

export type SettingsRowProps =
  | SettingsRouterRowProps
  | SettingsActionRowProps
  | SettingsValueRowProps

export function SettingsRow(props: SettingsRowProps) {
  if (props.variant === "value") {
    return (
      <NativeSettingsRow
        kind="value"
        label={props.accessibilityLabel ?? props.label}
        value={props.value}
        testID={props.testID}
      />
    )
  }
  if (props.variant === "action") {
    return (
      <NativeSettingsRow
        kind="action"
        label={props.accessibilityLabel ?? props.label}
        value={props.secondary}
        badge={props.badge}
        hint={props.hint}
        onPress={props.onPress}
        testID={props.testID}
      />
    )
  }
  return (
    <NativeSettingsRow
      kind="navigation"
      label={props.accessibilityLabel ?? props.label}
      value={props.secondary}
      badge={props.badge}
      hint={props.hint}
      href={props.href}
      testID={props.testID}
    />
  )
}
