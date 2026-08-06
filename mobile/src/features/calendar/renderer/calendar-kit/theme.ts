import { type ThemeColor } from "@/theme"

import { type DeepPartial, type ThemeConfigs } from "./vendor"

export function buildCalendarKitTheme(
  theme: Record<ThemeColor, string>,
): DeepPartial<ThemeConfigs> {
  return {
    colors: {
      primary: theme.primary,
      onPrimary: theme.background,
      background: theme.background,
      onBackground: theme.text,
      border: theme.backgroundSelected,
      text: theme.text,
      surface: theme.backgroundElement,
      onSurface: theme.textSecondary,
    },
    hourTextStyle: { color: theme.textSecondary },
    nowIndicatorColor: theme.primary,
  }
}
