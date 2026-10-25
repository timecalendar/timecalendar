import { useTranslation } from "react-i18next"

import { SettingsRow } from "@/features/settings/ui/settings-row"

import type { EnvironmentSelector } from "./use-environment-selector"

export function EnvironmentSettingsRow({
  selector,
}: {
  selector: EnvironmentSelector
}) {
  const { t } = useTranslation()
  if (selector.capability === "production") return null

  const label = t("environment.selector.label")
  const value = t(
    selector.switching
      ? "environment.selector.switching"
      : `environment.choice.${selector.current}`,
  )

  return (
    <SettingsRow
      first
      variant="action"
      accessibilityRole="button"
      icon={{ ios: "server.rack", android: "dns" }}
      label={label}
      secondary={value}
      hint={t("environment.selector.hint")}
      onPress={selector.choose}
      testID="settings-environment"
    />
  )
}
