import type { Href } from "expo-router"

import { type NativeListIcon, NativeListRow } from "@/components/chrome"

interface SettingsRowBaseProps {
  icon?: NativeListIcon
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
      <NativeListRow
        kind="value"
        label={props.label}
        icon={props.icon}
        accessibilityLabel={props.accessibilityLabel}
        value={props.value}
        testID={props.testID}
      />
    )
  }
  if (props.variant === "action") {
    return (
      <NativeListRow
        kind="action"
        label={props.label}
        icon={props.icon}
        accessibilityLabel={props.accessibilityLabel}
        value={props.secondary}
        badge={props.badge}
        hint={props.hint}
        onPress={props.onPress}
        testID={props.testID}
      />
    )
  }
  return (
    <NativeListRow
      kind="navigation"
      label={props.label}
      icon={props.icon}
      accessibilityLabel={props.accessibilityLabel}
      value={props.secondary}
      badge={props.badge}
      hint={props.hint}
      href={props.href}
      testID={props.testID}
    />
  )
}
