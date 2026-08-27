import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import {
  type BackendEnvironment,
  getAllowedBackendEnvironments,
} from "@/config/backend-environment"
import {
  getBackendEnvironmentCapability,
  switchBackendEnvironment,
  useEffectiveBackendEnvironment,
} from "@/features/environment/data"
import { SettingsRow } from "@/features/settings/ui/settings-row"

export function EnvironmentSettingsControl() {
  const { t } = useTranslation()
  const capability = getBackendEnvironmentCapability()
  const current = useEffectiveBackendEnvironment()
  const [switching, setSwitching] = useState(false)

  if (capability === "production") return null

  const confirm = (target: BackendEnvironment) => {
    if (target === current || switching) return
    Alert.alert(
      t("environment.confirm.title"),
      t("environment.confirm.body", {
        environment: t(`environment.choice.${target}`),
      }),
      [
        { text: t("environment.confirm.cancel"), style: "cancel" },
        {
          text: t("environment.confirm.confirm"),
          style: "destructive",
          onPress: () => {
            setSwitching(true)
            void switchBackendEnvironment(target).catch(() => {
              setSwitching(false)
            })
          },
        },
      ],
    )
  }

  const choose = () => {
    if (switching) return
    Alert.alert(
      t("environment.selector.title"),
      t("environment.selector.body"),
      [
        ...getAllowedBackendEnvironments(capability).map((environment) => ({
          text: t(`environment.choice.${environment}`),
          onPress: () => confirm(environment),
        })),
        { text: t("environment.confirm.cancel"), style: "cancel" as const },
      ],
    )
  }

  return (
    <SettingsRow
      first
      variant="action"
      accessibilityRole="button"
      icon={{ ios: "server.rack", android: "dns", web: "dns" }}
      label={t("environment.selector.label")}
      secondary={t(
        switching
          ? "environment.selector.switching"
          : `environment.choice.${current}`,
      )}
      hint={t("environment.selector.hint")}
      onPress={choose}
      testID="settings-environment"
    />
  )
}
