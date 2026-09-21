import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { NativeSettingsNumericEditor } from "@/components/chrome"
import { useNotificationPreferences } from "@/features/notifications/data"

import {
  type CustomDaysValidationError,
  validateCustomDays,
} from "./notification-choices"

const IDS = {
  container: "notifications-custom-sheet",
  field: "notifications-custom-field",
  cancel: "notifications-custom-cancel",
  submit: "notifications-custom-done",
  message: "notifications-custom-validation",
} as const

export function NotificationDaysCustomScreen() {
  const { t } = useTranslation()
  const preferences = useNotificationPreferences()
  const [validation, setValidation] =
    useState<CustomDaysValidationError | null>(null)
  return (
    <>
      <Stack.Screen options={{ title: t("notifications.custom.title") }} />
      <NativeSettingsNumericEditor
        title={t("notifications.custom.title")}
        label={t("notifications.custom.label")}
        initialValue={String(preferences.nbDaysAhead)}
        cancelLabel={t("notifications.action.cancel")}
        submitLabel={t("notifications.action.done")}
        validationMessage={
          validation
            ? t(`notifications.custom.validation.${validation}`)
            : undefined
        }
        ids={IDS}
        onCancel={() => router.back()}
        onSubmit={(draft) => {
          const result = validateCustomDays(draft)
          if (result.state !== "valid") {
            setValidation(result.state)
            return
          }
          preferences.setNbDaysAhead(result.value)
          router.back()
        }}
      />
    </>
  )
}
