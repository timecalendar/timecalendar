import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"

import {
  NativeSettingsHost,
  NativeSettingsNumericEditor,
  NativeSettingsRadioDialog,
  NativeSettingsRow,
  NativeSettingsSection,
  NativeSettingsSwitchRow,
  NativeSettingsText,
} from "@/components/chrome"
import {
  type NotificationFrequency,
  useNotificationPreferences,
} from "@/features/notifications/data"

import {
  type CustomDaysValidationError,
  NOTIFICATION_DAY_CHOICES,
  NOTIFICATION_FREQUENCIES,
  type NotificationDaysChoice,
  selectedDaysChoice,
  validateCustomDays,
} from "./notification-choices"
import { NotificationSyncStatus } from "./notification-sync-status"

const CUSTOM_EDITOR_IDS = {
  container: "notifications-custom-dialog",
  field: "notifications-custom-field",
  cancel: "notifications-custom-cancel",
  submit: "notifications-custom-save",
  message: "notifications-custom-validation",
} as const

export default function NotificationSettingsScreen() {
  const { t } = useTranslation()
  const preferences = useNotificationPreferences()
  const [frequencyOpen, setFrequencyOpen] = useState(false)
  const [daysOpen, setDaysOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customValidation, setCustomValidation] =
    useState<CustomDaysValidationError | null>(null)
  const selectedDays = selectedDaysChoice(preferences.nbDaysAhead)
  const dayValue = t("notifications.days.value", {
    count: preferences.nbDaysAhead,
  })
  const frequencyLabel = t(`notifications.frequency.${preferences.frequency}`)

  const submitCustom = (draft: string) => {
    const result = validateCustomDays(draft)
    if (result.state !== "valid") {
      setCustomValidation(result.state)
      return
    }
    preferences.setNbDaysAhead(result.value)
    setCustomValidation(null)
    setCustomOpen(false)
  }

  const chooseDays = (choice: NotificationDaysChoice) => {
    if (choice === "custom") {
      setDaysOpen(false)
      setCustomValidation(null)
      setCustomOpen(true)
      return
    }
    preferences.setNbDaysAhead(Number(choice))
    setDaysOpen(false)
  }

  return (
    <>
      <Stack.Screen options={{ title: t("notifications.title") }} />
      <NativeSettingsHost>
        <NativeSettingsSection title={t("notifications.section.subscription")}>
          <NativeSettingsSwitchRow
            label={t("notifications.subscription.label")}
            value={preferences.isActive}
            testID="notifications-subscription-row"
            switchTestID="notifications-is-active-switch"
            onValueChange={preferences.setIsActive}
          />
          <NativeSettingsText testID="notifications-subscription-help">
            {t("notifications.subscription.help")}
          </NativeSettingsText>
        </NativeSettingsSection>
        <NativeSettingsSection title={t("notifications.section.delivery")}>
          <NativeSettingsRow
            kind={Platform.OS === "ios" ? "navigation" : "action"}
            label={t("notifications.frequency.label")}
            value={frequencyLabel}
            testID="notifications-frequency-row"
            href="/notification-frequency"
            onPress={() => setFrequencyOpen(true)}
          />
          <NativeSettingsText testID="notifications-frequency-help">
            {t("notifications.frequency.help")}
          </NativeSettingsText>
          <NativeSettingsRow
            kind={Platform.OS === "ios" ? "navigation" : "action"}
            label={t("notifications.days.label")}
            value={dayValue}
            testID="notifications-days-row"
            href="/notification-days-ahead"
            onPress={() => setDaysOpen(true)}
          />
          <NativeSettingsText testID="notifications-days-help">
            {t("notifications.days.help")}
          </NativeSettingsText>
        </NativeSettingsSection>
        <NotificationSyncStatus
          status={preferences.status}
          retry={preferences.retry}
        />
      </NativeSettingsHost>

      <NativeSettingsRadioDialog
        visible={frequencyOpen}
        title={t("notifications.frequency.title")}
        cancelLabel={t("notifications.action.cancel")}
        value={preferences.frequency}
        options={NOTIFICATION_FREQUENCIES.map(({ value, labelKey }) => ({
          value,
          label: t(labelKey),
        }))}
        testID="notifications-frequency-dialog"
        onDismiss={() => setFrequencyOpen(false)}
        onSelect={(value: NotificationFrequency) => {
          preferences.setFrequency(value)
          setFrequencyOpen(false)
        }}
      />
      <NativeSettingsRadioDialog
        visible={daysOpen}
        title={t("notifications.days.title")}
        cancelLabel={t("notifications.action.cancel")}
        value={selectedDays}
        options={NOTIFICATION_DAY_CHOICES.map(({ value, days }) => ({
          value,
          label:
            days === null
              ? t("notifications.days.customWithValue", { value: dayValue })
              : t("notifications.days.value", { count: days }),
        }))}
        testID="notifications-days-dialog"
        onDismiss={() => setDaysOpen(false)}
        onSelect={chooseDays}
      />
      {customOpen ? (
        <NativeSettingsNumericEditor
          title={t("notifications.custom.title")}
          label={t("notifications.custom.label")}
          initialValue={String(preferences.nbDaysAhead)}
          cancelLabel={t("notifications.action.cancel")}
          submitLabel={t("notifications.action.save")}
          validationMessage={
            customValidation
              ? t(`notifications.custom.validation.${customValidation}`)
              : undefined
          }
          ids={CUSTOM_EDITOR_IDS}
          onCancel={() => {
            setCustomValidation(null)
            setCustomOpen(false)
          }}
          onSubmit={submitCustom}
        />
      ) : null}
    </>
  )
}
