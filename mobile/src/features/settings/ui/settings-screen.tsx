import { useTranslation } from "react-i18next"
import { Platform, ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import {
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources"
import { deriveCalendarSummary } from "@/features/settings/data"
import { MaxContentWidth, Spacing, useTheme } from "@/theme"

import { SettingsRow } from "./settings-row"
import { SettingsSection } from "./settings-section"

const destinations = [
  {
    section: "events" as const,
    href: "/personal-events" as const,
    icon: {
      ios: "calendar.badge.plus",
      android: "event_note",
      web: "event_note",
    } as const,
    label: "settingsHub.personalEvents.label" as const,
    hint: "settingsHub.personalEvents.hint" as const,
    testID: "settings-personal-events",
  },
  {
    section: "events" as const,
    href: "/hidden-events" as const,
    icon: {
      ios: "eye.slash",
      android: "visibility_off",
      web: "visibility_off",
    } as const,
    label: "settingsHub.hiddenEvents.label" as const,
    hint: "settingsHub.hiddenEvents.hint" as const,
    testID: "settings-hidden-events",
  },
  {
    section: "preferences" as const,
    href: "/appearance-settings" as const,
    icon: {
      ios: "paintpalette",
      android: "palette",
      web: "palette",
    } as const,
    label: "settingsHub.appearance.label" as const,
    hint: "settingsHub.appearance.hint" as const,
    testID: "settings-appearance",
  },
  {
    section: "preferences" as const,
    href: "/timezone-settings" as const,
    icon: {
      ios: "globe",
      android: "public",
      web: "public",
    } as const,
    label: "settingsHub.timezone.label" as const,
    hint: "settingsHub.timezone.hint" as const,
    testID: "settings-timezone",
  },
  {
    section: "preferences" as const,
    href: "/notification-settings" as const,
    icon: {
      ios: "bell",
      android: "notifications",
      web: "notifications",
    } as const,
    label: "settingsHub.notifications.label" as const,
    hint: "settingsHub.notifications.hint" as const,
    testID: "settings-notifications",
  },
] as const

const sections = ["events", "preferences"] as const

export function SettingsScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const calendars = useUserCalendars()
  const loaded = useUserCalendarsLoaded()
  const summary = deriveCalendarSummary(calendars, loaded)

  const secondary =
    summary.state === "loaded" && summary.calendarCount === 0
      ? t("settingsHub.summary.empty")
      : summary.state === "loaded"
        ? t("settingsHub.summary.calendars", { count: summary.calendarCount })
        : undefined

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {summary.state === "loading" ? (
            <View
              testID="settings-calendar-summary-loading"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.loading,
                { backgroundColor: theme.backgroundElement },
              ]}
            />
          ) : (
            <SettingsSection
              title={t("settingsHub.summary.title")}
              testID="settings-calendar-summary-section"
            >
              <SettingsRow
                first
                href="/user-calendars"
                icon={{
                  ios: "calendar",
                  android: "calendar_month",
                  web: "calendar_month",
                }}
                label={t("settingsHub.summary.manage")}
                accessibilityLabel={t(
                  "settingsHub.summary.accessibilityLabel",
                  {
                    primary: t("settingsHub.summary.manage"),
                    secondary,
                  },
                )}
                hint={t("settingsHub.summary.hint")}
                testID="settings-calendar-summary"
                {...(secondary ? { secondary } : {})}
              />
            </SettingsSection>
          )}

          {sections.map((section) => (
            <SettingsSection
              key={section}
              title={t(`settingsHub.section.${section}`)}
              testID={`settings-section-${section}`}
            >
              {destinations
                .filter((destination) => destination.section === section)
                .map((destination, index) => (
                  <SettingsRow
                    first={index === 0}
                    key={destination.href}
                    href={destination.href}
                    icon={destination.icon}
                    label={t(destination.label)}
                    hint={t(destination.hint)}
                    testID={destination.testID}
                  />
                ))}
            </SettingsSection>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: Platform.OS === "ios" ? Spacing.three : Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  content: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: Platform.OS === "ios" ? Spacing.four : Spacing.five,
  },
  loading: {
    height: 72,
    borderRadius: 16,
    opacity: 0.6,
  },
})
