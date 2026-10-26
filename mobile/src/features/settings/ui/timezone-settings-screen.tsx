import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import {
  NativeList,
  NativeListRow,
  NativeListSection,
  NativeListSwitchRow,
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
      <NativeList>
        <NativeListSection testID="settings-timezone-section">
          <NativeListSwitchRow
            label={t("settings.timezone.useDevice")}
            value={automatic}
            testID="settings-timezone-device-row"
            switchTestID="settings-timezone-device-switch"
            onValueChange={(next) =>
              next ? setAutomaticTimezone() : restoreManualTimezone()
            }
          />
          {automatic ? (
            <NativeListRow
              kind="value"
              label={t("settings.timezone.effective")}
              value={displayZone}
              testID="settings-timezone-effective-row"
            />
          ) : (
            <>
              <NativeListRow
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
                <NativeListRow
                  kind="value"
                  label={t("settings.timezone.fallback")}
                  value={displayZone}
                  testID="settings-timezone-fallback-row"
                />
              ) : null}
            </>
          )}
        </NativeListSection>
      </NativeList>
    </>
  )
}
