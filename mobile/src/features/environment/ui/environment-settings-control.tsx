import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Platform } from "react-native"

import { NativeSettingsRadioDialog } from "@/components/chrome"
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
  const [pickerOpen, setPickerOpen] = useState(false)

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

  const allowed = getAllowedBackendEnvironments(capability)

  // Android's Alert keeps only three buttons, which drops Cancel once the
  // development capability lists three environments.
  const choose = () => {
    if (switching) return
    if (Platform.OS === "android") {
      setPickerOpen(true)
      return
    }
    Alert.alert(
      t("environment.selector.title"),
      t("environment.selector.body"),
      [
        ...allowed.map((environment) => ({
          text: t(`environment.choice.${environment}`),
          onPress: () => confirm(environment),
        })),
        { text: t("environment.confirm.cancel"), style: "cancel" as const },
      ],
    )
  }

  const label = t("environment.selector.label")
  const value = t(
    switching
      ? "environment.selector.switching"
      : `environment.choice.${current}`,
  )

  return (
    <>
      <SettingsRow
        first
        variant="action"
        accessibilityRole="button"
        icon={{ ios: "server.rack", android: "dns" }}
        label={label}
        accessibilityLabel={t("environment.selector.accessibilityLabel", {
          primary: label,
          secondary: value,
        })}
        secondary={value}
        hint={t("environment.selector.hint")}
        onPress={choose}
        testID="settings-environment"
      />
      <NativeSettingsRadioDialog
        visible={pickerOpen}
        title={t("environment.selector.title")}
        cancelLabel={t("environment.confirm.cancel")}
        value={current}
        options={allowed.map((environment) => ({
          value: environment,
          label: t(`environment.choice.${environment}`),
        }))}
        testID="settings-environment-dialog"
        onDismiss={() => setPickerOpen(false)}
        onSelect={(target) => {
          setPickerOpen(false)
          confirm(target)
        }}
      />
    </>
  )
}
