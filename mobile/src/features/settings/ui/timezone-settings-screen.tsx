import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Host, Picker } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  CURATED_TIMEZONES,
  type CuratedTimezone,
  useTimezonePreference,
} from "@/features/settings/prefs"
import { MaxContentWidth, Spacing } from "@/theme"

// The display-timezone picker screen (timezone design D8) — PRESENTATIONAL
// (70% floor): the appearance-settings <Picker>/chrome pattern scaled to 11
// entries ("Automatic" + the 10 curated zones). It owns NO preference logic —
// selecting an option drives useTimezonePreference's setter immediately (no
// apply step; every zone-threaded surface re-renders through the reactive
// seam). The route (src/app/timezone-settings.tsx) is a thin re-export.

// Zone → typed label key (the closed-union analog of the theme/language item
// labels; a template-literal key would defeat the typed-key catalog).
const ZONE_LABEL_KEYS = {
  "Europe/Paris": "settings.timezone.zone.paris",
  "America/Guadeloupe": "settings.timezone.zone.guadeloupe",
  "America/Martinique": "settings.timezone.zone.martinique",
  "America/Cayenne": "settings.timezone.zone.guyane",
  "America/Miquelon": "settings.timezone.zone.miquelon",
  "Indian/Reunion": "settings.timezone.zone.reunion",
  "Indian/Mayotte": "settings.timezone.zone.mayotte",
  "Pacific/Noumea": "settings.timezone.zone.noumea",
  "Pacific/Wallis": "settings.timezone.zone.wallis",
  "Pacific/Tahiti": "settings.timezone.zone.tahiti",
} as const satisfies Record<CuratedTimezone, string>

export default function TimezoneSettingsScreen() {
  const { t } = useTranslation()
  const timezone = useTimezonePreference()

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t("settings.timezone.title") }} />
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <View style={styles.control}>
          <ThemedText type="smallBold">
            {t("settings.timezone.label")}
          </ThemedText>
          {/* testID on an RN-core View — the @expo/ui Android Picker drops the
              prop (see appearance-settings-screen.tsx); the inner testID feeds
              the Jest mock's per-item ids. */}
          <View testID="settings-timezone-picker">
            <Host matchContents>
              <Picker
                testID="settings-timezone-picker"
                appearance="menu"
                selectedValue={timezone.preference}
                onValueChange={timezone.setPreference}
              >
                <Picker.Item
                  label={t("settings.timezone.automatic")}
                  value="system"
                />
                {CURATED_TIMEZONES.map((zone) => (
                  <Picker.Item
                    key={zone}
                    label={t(ZONE_LABEL_KEYS[zone])}
                    value={zone}
                  />
                ))}
              </Picker>
            </Host>
          </View>
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
