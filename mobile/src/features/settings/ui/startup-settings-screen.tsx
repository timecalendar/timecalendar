import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Host, Picker } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { useStartupTabPreference } from "@/features/settings/prefs"
import { MaxContentWidth, Spacing } from "@/theme"

export default function StartupSettingsScreen() {
  const { t } = useTranslation()
  const startupTab = useStartupTabPreference()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t("settings.startup.title")}</ThemedText>
        <View style={styles.control}>
          <ThemedText type="smallBold">
            {t("settings.startup.label")}
          </ThemedText>
          <ThemedText type="default">
            {t("settings.startup.description")}
          </ThemedText>
          <View
            testID="settings-startup-picker"
            accessibilityLabel={t("settings.startup.accessibilityLabel")}
          >
            <Host matchContents>
              <Picker
                testID="settings-startup-picker"
                appearance="menu"
                selectedValue={startupTab.preference}
                onValueChange={startupTab.setPreference}
              >
                <Picker.Item label={t("settings.startup.home")} value="home" />
                <Picker.Item
                  label={t("settings.startup.calendar")}
                  value="calendar"
                />
              </Picker>
            </Host>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", justifyContent: "center" },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  control: { gap: Spacing.two },
})
