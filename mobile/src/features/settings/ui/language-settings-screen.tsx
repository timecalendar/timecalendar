import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import {
  NativeSettingsChoiceRow,
  NativeSettingsHost,
  NativeSettingsSection,
} from "@/components/chrome"
import {
  type LanguagePreference,
  useLanguagePreference,
} from "@/features/settings/prefs"

export function LanguageSettingsScreen() {
  const { t } = useTranslation()
  const language = useLanguagePreference()
  const options: readonly { label: string; value: LanguagePreference }[] = [
    { label: t("settings.language.system"), value: "system" },
    { label: t("settings.language.fr"), value: "fr" },
    { label: t("settings.language.en"), value: "en" },
  ]
  return (
    <>
      <Stack.Screen options={{ title: t("settings.language.label") }} />
      <NativeSettingsHost>
        <NativeSettingsSection>
          {options.map((option) => (
            <NativeSettingsChoiceRow
              key={option.value}
              label={option.label}
              selected={language.preference === option.value}
              testID={`settings-language-choice-${option.value}`}
              onSelect={() => language.setPreference(option.value)}
            />
          ))}
        </NativeSettingsSection>
      </NativeSettingsHost>
    </>
  )
}
