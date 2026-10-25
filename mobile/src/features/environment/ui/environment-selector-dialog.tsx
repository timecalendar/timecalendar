import { useTranslation } from "react-i18next"

import { NativeSettingsRadioDialog } from "@/components/chrome"

import type { EnvironmentSelector } from "./use-environment-selector"

export function EnvironmentSelectorDialog({
  selector,
}: {
  selector: EnvironmentSelector
}) {
  const { t } = useTranslation()
  if (selector.capability === "production") return null

  return (
    <NativeSettingsRadioDialog
      visible={selector.pickerOpen}
      title={t("environment.selector.title")}
      cancelLabel={t("environment.confirm.cancel")}
      value={selector.current}
      options={selector.allowed.map((environment) => ({
        value: environment,
        label: t(`environment.choice.${environment}`),
      }))}
      testID="settings-environment-dialog"
      onDismiss={selector.dismiss}
      onSelect={selector.select}
    />
  )
}
