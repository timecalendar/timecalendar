import type { PropsWithChildren } from "react"

import { NativeListSection } from "@/components/chrome"

interface SettingsSectionProps extends PropsWithChildren {
  title?: string
  footer?: string
  testID?: string
}

export function SettingsSection(props: SettingsSectionProps) {
  return <NativeListSection {...props} />
}
