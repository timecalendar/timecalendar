import { NativeTabs as ExpoNativeTabs } from "expo-router/unstable-native-tabs"
import type { ComponentProps } from "react"
import { Platform } from "react-native"

import { useTheme } from "@/theme"

// The single import site for `expo-router/unstable-native-tabs` (alpha — "API is
// subject to change"). The lint boundary (see eslint.config.js, chrome-boundary)
// forbids importing it anywhere outside src/components/chrome/, so when the alpha
// API churns the blast radius is this file.
//
// `NativeTabs` is themed here: tab-bar colors come from `@/theme`, so consumers
// (app-tabs.tsx) stop reaching into the raw Colors map. Caller-supplied props
// win (spread last). The `.Trigger` compound parts are re-attached so consumers
// use `NativeTabs.Trigger` / `.Trigger.Label` / `.Trigger.Icon` as before.
//
// `backgroundColor` is set on Android only: an OPAQUE color there paints the
// Material bar (the intended themed surface). On iOS it is DELIBERATELY omitted so
// the OS keeps the native iOS 26 Liquid Glass material — passing an opaque hex
// feeds `UITabBarAppearance.standardAppearance.tabBarBackgroundColor` (verified via
// expo-router appearance.ios.js), which overrides the glass with a solid band the
// moment scroll content passes under the bar. Omitting it is what lets a screen
// scroll content under the translucent bar (the calendar surface relies on this).

type NativeTabsProps = ComponentProps<typeof ExpoNativeTabs>

function ThemedNativeTabs(props: NativeTabsProps) {
  const colors = useTheme()

  return (
    <ExpoNativeTabs
      // Omit entirely on iOS (not `undefined` — exactOptionalPropertyTypes) so the
      // OS keeps the Liquid Glass material; set the themed color on Android only.
      {...(Platform.OS === "ios" ? {} : { backgroundColor: colors.background })}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
      {...props}
    />
  )
}

export const NativeTabs = Object.assign(ThemedNativeTabs, {
  Trigger: ExpoNativeTabs.Trigger,
})
