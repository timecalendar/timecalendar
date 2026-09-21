import type { PropsWithChildren } from "react"

import { NativeSettingsSection } from "@/components/chrome"

interface SettingsSectionProps extends PropsWithChildren {
  title?: string
  testID?: string
}

export function SettingsSection(props: SettingsSectionProps) {
  return <NativeSettingsSection {...props} />
}
