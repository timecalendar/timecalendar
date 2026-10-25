import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Platform } from "react-native"

import {
  type BackendEnvironment,
  getAllowedBackendEnvironments,
} from "@/config/backend-environment"
import {
  getBackendEnvironmentCapability,
  switchBackendEnvironment,
  useEffectiveBackendEnvironment,
} from "@/features/environment/data"

export type EnvironmentSelector = ReturnType<typeof useEnvironmentSelector>

export function useEnvironmentSelector() {
  const { t } = useTranslation()
  const capability = getBackendEnvironmentCapability()
  const current = useEffectiveBackendEnvironment()
  const [switching, setSwitching] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const allowed = getAllowedBackendEnvironments(capability)

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

  const select = (target: BackendEnvironment) => {
    setPickerOpen(false)
    confirm(target)
  }

  const dismiss = () => setPickerOpen(false)

  return {
    capability,
    current,
    allowed,
    switching,
    pickerOpen,
    choose,
    select,
    dismiss,
  }
}
