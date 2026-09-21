import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"

import {
  NativeSettingsChoiceRow,
  NativeSettingsHost,
  NativeSettingsRadioDialog,
  NativeSettingsRow,
  NativeSettingsSection,
} from "@/components/chrome"
import {
  type LanguagePreference,
  type ThemePreference,
  useLanguagePreference,
  useThemePreference,
} from "@/features/settings/prefs"

export default function AppearanceSettingsScreen() {
  const { t } = useTranslation()
  const theme = useThemePreference()
  const language = useLanguagePreference()
  const [themeDialog, setThemeDialog] = useState(false)
  const [languageDialog, setLanguageDialog] = useState(false)
  const themeOptions: readonly { label: string; value: ThemePreference }[] = [
    { label: t("settings.theme.system"), value: "system" },
    { label: t("settings.theme.light"), value: "light" },
    { label: t("settings.theme.dark"), value: "dark" },
  ]
  const languageOptions: readonly {
    label: string
    value: LanguagePreference
  }[] = [
    { label: t("settings.language.system"), value: "system" },
    { label: t("settings.language.fr"), value: "fr" },
    { label: t("settings.language.en"), value: "en" },
  ]

  return (
    <>
      <Stack.Screen options={{ title: t("settings.title") }} />
      <NativeSettingsHost>
        <NativeSettingsSection title={t("settings.theme.label")}>
          {Platform.OS === "ios" ? (
            themeOptions.map((option) => (
              <NativeSettingsChoiceRow
                key={option.value}
                label={option.label}
                selected={theme.preference === option.value}
                selectedAccessibilityLabel={t("settings.selected")}
                testID={`settings-theme-choice-${option.value}`}
                onSelect={() => theme.setPreference(option.value)}
              />
            ))
          ) : (
            <NativeSettingsRow
              kind="action"
              label={t("settings.theme.label")}
              value={
                themeOptions.find((o) => o.value === theme.preference)?.label
              }
              testID="settings-theme-row"
              onPress={() => setThemeDialog(true)}
            />
          )}
        </NativeSettingsSection>
        <NativeSettingsSection title={t("settings.language.label")}>
          <NativeSettingsRow
            kind={Platform.OS === "ios" ? "navigation" : "action"}
            label={t("settings.language.label")}
            value={
              languageOptions.find((o) => o.value === language.preference)
                ?.label
            }
            href={Platform.OS === "ios" ? "/language-settings" : undefined}
            testID="settings-language-row"
            onPress={
              Platform.OS === "android"
                ? () => setLanguageDialog(true)
                : undefined
            }
          />
        </NativeSettingsSection>
      </NativeSettingsHost>
      <NativeSettingsRadioDialog
        visible={themeDialog}
        title={t("settings.theme.label")}
        cancelLabel={t("settings.cancel")}
        value={theme.preference}
        options={themeOptions}
        testID="settings-theme-dialog"
        onDismiss={() => setThemeDialog(false)}
        onSelect={(value) => {
          theme.setPreference(value)
          setThemeDialog(false)
        }}
      />
      <NativeSettingsRadioDialog
        visible={languageDialog}
        title={t("settings.language.label")}
        cancelLabel={t("settings.cancel")}
        value={language.preference}
        options={languageOptions}
        testID="settings-language-dialog"
        onDismiss={() => setLanguageDialog(false)}
        onSelect={(value) => {
          language.setPreference(value)
          setLanguageDialog(false)
        }}
      />
    </>
  )
}
