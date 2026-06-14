import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Host, Picker } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  useLanguagePreference,
  useThemePreference,
} from "@/features/settings/prefs"
import { MaxContentWidth, Spacing } from "@/theme"

// The Settings feature's presentational screen (A2 / TIM-131). It owns NO
// preference logic — all state comes from A1's reactive hooks
// (useThemePreference / useLanguagePreference), so it lives under
// src/components/ (behavior-tested under the 70% floor, exempt from the 90%
// logic gate per ADR 003) with a thin src/app/settings.tsx re-export
// (route-structure rule; the colocated test stays out of the Metro route tree).
//
// Native controls are reached through the @/components/chrome seam (the first
// @expo/ui consumer, ADR 010), never @expo/ui directly. Each Picker is a
// single-select native control: selecting an option drives the matching hook's
// setPreference immediately (no apply step — the reactive hooks re-theme /
// re-language the app live). The picker is OS-chromed and not force-themed (R-3).
export default function SettingsScreen() {
  const { t } = useTranslation()
  const theme = useThemePreference()
  const language = useLanguagePreference()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t("settings.title")}</ThemedText>

        <View style={styles.control}>
          <ThemedText type="smallBold">{t("settings.theme.label")}</ThemedText>
          <Host matchContents>
            <Picker
              testID="settings-theme-picker"
              appearance="menu"
              selectedValue={theme.preference}
              onValueChange={theme.setPreference}
            >
              <Picker.Item label={t("settings.theme.system")} value="system" />
              <Picker.Item label={t("settings.theme.light")} value="light" />
              <Picker.Item label={t("settings.theme.dark")} value="dark" />
            </Picker>
          </Host>
        </View>

        <View style={styles.control}>
          <ThemedText type="smallBold">
            {t("settings.language.label")}
          </ThemedText>
          <Host matchContents>
            <Picker
              testID="settings-language-picker"
              appearance="menu"
              selectedValue={language.preference}
              onValueChange={language.setPreference}
            >
              <Picker.Item
                label={t("settings.language.system")}
                value="system"
              />
              <Picker.Item label={t("settings.language.fr")} value="fr" />
              <Picker.Item label={t("settings.language.en")} value="en" />
            </Picker>
          </Host>
        </View>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  control: {
    gap: Spacing.two,
  },
})
