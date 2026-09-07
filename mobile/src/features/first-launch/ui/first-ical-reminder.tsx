import { router } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { useUserCalendarsState } from "@/features/calendar-sources/data"
import { shouldShowFirstIcalReminder } from "@/features/first-launch/data"
import {
  dismissFirstIcalReminder,
  useFirstIcalReminderState,
  useOnboardingResolution,
} from "@/features/first-launch/store"
import { Radii, Spacing, useTheme } from "@/theme"

import { ImportLaterConfirmation } from "./import-later-confirmation"

const CONTROL_MIN_HEIGHT = Platform.OS === "ios" ? 44 : 48

export function FirstIcalReminder() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { calendars, loaded } = useUserCalendarsState()
  const onboardingResolution = useOnboardingResolution()
  const reminderState = useFirstIcalReminderState()
  const [confirmationVisible, setConfirmationVisible] = useState(false)

  const visible = shouldShowFirstIcalReminder({
    calendarsLoaded: loaded,
    calendarCount: calendars.length,
    onboardingResolution,
    reminderState,
  })

  if (!visible) return null

  const confirmDismissal = () => {
    dismissFirstIcalReminder()
    setConfirmationVisible(false)
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View
        style={[styles.card, { backgroundColor: theme.backgroundElement }]}
        testID="first-ical-reminder"
      >
        <View style={styles.copy}>
          <ThemedText type="subtitle">
            {t("firstLaunch.reminder.title")}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {t("firstLaunch.reminder.body")}
          </ThemedText>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("firstLaunch.reminder.import")}
            accessibilityHint={t("firstLaunch.reminder.importHint")}
            onPress={() => router.push("/onboarding/school")}
            style={[
              styles.importButton,
              { backgroundColor: theme.primaryStrong },
            ]}
            testID="first-ical-reminder-import"
          >
            <ThemedText type="smallBold" themeColor="onPrimary">
              {t("firstLaunch.reminder.import")}
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("firstLaunch.reminder.dismiss")}
            accessibilityHint={t("firstLaunch.reminder.dismissHint")}
            hitSlop={Spacing.two}
            onPress={() => setConfirmationVisible(true)}
            style={styles.dismissButton}
            testID="first-ical-reminder-dismiss"
          >
            <SymbolView
              name={{ ios: "xmark", android: "close", web: "close" }}
              tintColor={theme.actionText}
              size={20}
              accessible={false}
            />
          </Pressable>
        </View>
      </View>
      <ImportLaterConfirmation
        visible={confirmationVisible}
        cancelLabelKey="firstLaunch.importLater.keepReminder"
        onCancel={() => setConfirmationVisible(false)}
        onConfirm={confirmDismissal}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
  },
  card: {
    borderTopLeftRadius: Radii.large,
    borderTopRightRadius: Radii.large,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  copy: {
    flexShrink: 1,
    gap: Spacing.one,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
  },
  importButton: {
    alignItems: "center",
    borderRadius: Radii.medium,
    flex: 1,
    justifyContent: "center",
    minHeight: CONTROL_MIN_HEIGHT,
    paddingHorizontal: Spacing.three,
  },
  dismissButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: CONTROL_MIN_HEIGHT,
    minWidth: CONTROL_MIN_HEIGHT,
  },
})
