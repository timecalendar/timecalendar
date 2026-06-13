import { NativeTabs as ExpoNativeTabs } from "expo-router/unstable-native-tabs"
import type { ComponentProps } from "react"

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

type NativeTabsProps = ComponentProps<typeof ExpoNativeTabs>

function ThemedNativeTabs(props: NativeTabsProps) {
  const colors = useTheme()

  return (
    <ExpoNativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
      {...props}
    />
  )
}

export const NativeTabs = Object.assign(ThemedNativeTabs, {
  Trigger: ExpoNativeTabs.Trigger,
})
