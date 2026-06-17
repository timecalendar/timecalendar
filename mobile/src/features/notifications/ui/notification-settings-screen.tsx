import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, Switch, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Host, Picker } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  type NotificationFrequency,
  useNotificationPreferences,
} from "@/features/notifications/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The notification subscription preferences screen (design Decision 5) —
// PRESENTATIONAL (70% floor): a frequency Picker (immediately/hourly/daily via
// the @/components/chrome seam, mirroring settings-screen), a bounded 1..30
// nbDaysAhead stepper, and an isActive Switch, each bound to the feature data
// hook so a change persists locally + drives the idempotent re-PUT. A failed PUT
// surfaces an accessible alert + Retry (mirror ical-url-screen, Decision 6).
//
// It consumes its sibling data sub-barrel (@/features/notifications/data), never
// its own feature barrel (B-2) and never the generated hook / @/storage / firebase
// seams directly (B-1) — the data/ layer owns those. Tested beside this file; the
// route (src/app/notification-settings.tsx) is a thin re-export (route-structure rule).

const NB_DAYS_MIN = 1
const NB_DAYS_MAX = 30

export default function NotificationSettingsScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const {
    frequency,
    nbDaysAhead,
    isActive,
    setFrequency,
    setNbDaysAhead,
    setIsActive,
    register,
    isError,
  } = useNotificationPreferences()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t("notifications.title")}</ThemedText>

        <View style={styles.control}>
          <ThemedText type="smallBold">
            {t("notifications.frequency.label")}
          </ThemedText>
          {/* The testID lives on this RN-core View (the @expo/ui Android Picker
              drops testID) — see settings-screen for the full rationale. */}
          <View testID="notifications-frequency-picker">
            <Host matchContents>
              <Picker
                testID="notifications-frequency-picker"
                appearance="menu"
                selectedValue={frequency}
                onValueChange={(value) =>
                  setFrequency(value as NotificationFrequency)
                }
              >
                <Picker.Item
                  label={t("notifications.frequency.immediately")}
                  value="immediately"
                />
                <Picker.Item
                  label={t("notifications.frequency.hourly")}
                  value="hourly"
                />
                <Picker.Item
                  label={t("notifications.frequency.daily")}
                  value="daily"
                />
              </Picker>
            </Host>
          </View>
        </View>

        <View style={styles.control}>
          <ThemedText type="smallBold">
            {t("notifications.nbDaysAhead.label")}
          </ThemedText>
          <View style={styles.stepper}>
            <Pressable
              testID="notifications-nb-days-decrement"
              accessibilityRole="button"
              accessibilityLabel={t("notifications.nbDaysAhead.decrement")}
              accessibilityState={{ disabled: nbDaysAhead <= NB_DAYS_MIN }}
              disabled={nbDaysAhead <= NB_DAYS_MIN}
              hitSlop={Spacing.two}
              onPress={() => setNbDaysAhead(nbDaysAhead - 1)}
              style={[
                styles.stepperButton,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ThemedText type="smallBold">−</ThemedText>
            </Pressable>
            <ThemedText
              testID="notifications-nb-days-value"
              accessibilityLiveRegion="polite"
            >
              {t("notifications.nbDaysAhead.value", { count: nbDaysAhead })}
            </ThemedText>
            <Pressable
              testID="notifications-nb-days-increment"
              accessibilityRole="button"
              accessibilityLabel={t("notifications.nbDaysAhead.increment")}
              accessibilityState={{ disabled: nbDaysAhead >= NB_DAYS_MAX }}
              disabled={nbDaysAhead >= NB_DAYS_MAX}
              hitSlop={Spacing.two}
              onPress={() => setNbDaysAhead(nbDaysAhead + 1)}
              style={[
                styles.stepperButton,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ThemedText type="smallBold">+</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.toggleRow}>
          <ThemedText type="smallBold">
            {t("notifications.isActive.label")}
          </ThemedText>
          <Switch
            testID="notifications-is-active-switch"
            accessibilityRole="switch"
            accessibilityLabel={t("notifications.isActive.label")}
            value={isActive}
            onValueChange={setIsActive}
          />
        </View>

        {isError && (
          <View style={styles.errorBlock}>
            <ThemedText
              themeColor="textSecondary"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {t("notifications.error.message")}
            </ThemedText>
            <Pressable
              testID="notifications-retry"
              accessibilityRole="button"
              accessibilityLabel={t("notifications.error.retryLabel")}
              hitSlop={Spacing.two}
              onPress={() => {
                void register().catch(() => {})
              }}
              style={[
                styles.cta,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ThemedText type="smallBold">
                {t("notifications.error.retry")}
              </ThemedText>
            </Pressable>
          </View>
        )}
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
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.four,
  },
  stepperButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radii.medium,
    borderWidth: 2,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorBlock: {
    gap: Spacing.three,
  },
  cta: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: Radii.medium,
    borderWidth: 2,
  },
})
