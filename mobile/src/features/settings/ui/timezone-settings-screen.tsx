import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import {
  NativeSettingsHost,
  NativeSettingsRow,
  NativeSettingsSection,
  NativeSettingsSwitchRow,
} from "@/components/chrome"
import {
  restoreManualTimezone,
  setAutomaticTimezone,
  useDisplayZone,
  useTimezonePreferenceRead,
} from "@/features/settings/prefs"

export default function TimezoneSettingsScreen() {
  const { t } = useTranslation()
  const preference = useTimezonePreferenceRead()
  const displayZone = useDisplayZone()
  const automatic = preference.kind === "system"
  const manualIdentifier =
    preference.kind === "available" || preference.kind === "unavailable"
      ? preference.identifier
      : preference.kind === "invalid"
        ? preference.raw
        : displayZone
  const usesFallback =
    preference.kind === "unavailable" || preference.kind === "invalid"

  return (
    <>
      <Stack.Screen options={{ title: t("settings.timezone.title") }} />
      <NativeSettingsHost>
        <NativeSettingsSection testID="settings-timezone-section">
          <NativeSettingsSwitchRow
            label={t("settings.timezone.useDevice")}
            value={automatic}
            testID="settings-timezone-device-row"
            switchTestID="settings-timezone-device-switch"
            onValueChange={(next) =>
              next ? setAutomaticTimezone() : restoreManualTimezone()
            }
          />
          {automatic ? (
            <NativeSettingsRow
              kind="value"
              label={t("settings.timezone.effective")}
              value={displayZone}
              testID="settings-timezone-effective-row"
            />
          ) : (
            <>
              <NativeSettingsRow
                kind="navigation"
                label={t("settings.timezone.manual")}
                value={manualIdentifier}
                badge={
                  usesFallback ? t("settings.timezone.unavailable") : undefined
                }
                hint={t("settings.timezone.openChooserHint")}
                href="/timezone-chooser"
                testID="settings-timezone-manual-row"
              />
              {usesFallback ? (
                <NativeSettingsRow
                  kind="value"
                  label={t("settings.timezone.fallback")}
                  value={displayZone}
                  testID="settings-timezone-fallback-row"
                />
              ) : null}
            </>
          )}
        </NativeSettingsSection>
      </NativeSettingsHost>
    </>
  )
}
