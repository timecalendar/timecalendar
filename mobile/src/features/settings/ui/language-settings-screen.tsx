import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import {
  NativeList,
  NativeListChoiceRow,
  NativeListSection,
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
      <NativeList>
        <NativeListSection>
          {options.map((option) => (
            <NativeListChoiceRow
              key={option.value}
              label={option.label}
              selected={language.preference === option.value}
              selectedAccessibilityLabel={t("settings.selected")}
              testID={`settings-language-choice-${option.value}`}
              onSelect={() => language.setPreference(option.value)}
            />
          ))}
        </NativeListSection>
      </NativeList>
    </>
  )
}
