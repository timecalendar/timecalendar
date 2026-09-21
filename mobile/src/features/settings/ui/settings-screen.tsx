import { useTranslation } from "react-i18next"

import {
  NativeSettingsHost,
  NativeSettingsRow,
  NativeSettingsSection,
  NativeSettingsSwitchRow,
} from "@/components/chrome"
import { formatUnreadBadge, useActivityState } from "@/features/activity"
import {
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources"
import {
  EnvironmentSettingsControl,
  getBackendEnvironmentCapability,
} from "@/features/environment"
import { deriveCalendarSummary } from "@/features/settings/data"
import { useShowWeekendsPreference } from "@/features/settings/prefs"

const destinations = [
  {
    section: "events" as const,
    href: "/activity" as const,
    label: "settingsHub.activity.label" as const,
    hint: "settingsHub.activity.hint" as const,
    testID: "settings-activity",
    unreadBadge: true,
  },
  {
    section: "events" as const,
    href: "/personal-events" as const,
    label: "settingsHub.personalEvents.label" as const,
    hint: "settingsHub.personalEvents.hint" as const,
    testID: "settings-personal-events",
  },
  {
    section: "events" as const,
    href: "/hidden-events" as const,
    label: "settingsHub.hiddenEvents.label" as const,
    hint: "settingsHub.hiddenEvents.hint" as const,
    testID: "settings-hidden-events",
  },
  {
    section: "preferences" as const,
    href: "/appearance-settings" as const,
    label: "settingsHub.appearance.label" as const,
    hint: "settingsHub.appearance.hint" as const,
    testID: "settings-appearance",
  },
  {
    section: "preferences" as const,
    href: "/timezone-settings" as const,
    label: "settingsHub.timezone.label" as const,
    hint: "settingsHub.timezone.hint" as const,
    testID: "settings-timezone",
  },
  {
    section: "preferences" as const,
    href: "/notification-settings" as const,
    label: "settingsHub.notifications.label" as const,
    hint: "settingsHub.notifications.hint" as const,
    testID: "settings-notifications",
  },
  {
    section: "app" as const,
    href: "/about" as const,
    label: "settingsHub.about.label" as const,
    hint: "settingsHub.about.hint" as const,
    testID: "settings-about",
  },
  {
    section: "support" as const,
    href: "/feedback" as const,
    label: "settingsHub.feedback.label" as const,
    hint: "settingsHub.feedback.hint" as const,
    testID: "settings-feedback",
  },
] as const

const sections = ["events", "preferences", "app", "support"] as const

export function SettingsScreen() {
  const { t } = useTranslation()
  const calendars = useUserCalendars()
  const loaded = useUserCalendarsLoaded()
  const { unreadCount } = useActivityState()
  const { showWeekends, setShowWeekends } = useShowWeekendsPreference()
  const summary = deriveCalendarSummary(calendars, loaded)
  const showEnvironmentControl =
    getBackendEnvironmentCapability() !== "production"
  const summaryValue =
    summary.state === "loaded" && summary.calendarCount === 0
      ? t("settingsHub.summary.empty")
      : summary.state === "loaded"
        ? t("settingsHub.summary.calendars", { count: summary.calendarCount })
        : undefined

  return (
    <NativeSettingsHost>
      <NativeSettingsSection
        title={t("settingsHub.summary.title")}
        testID="settings-calendar-summary-section"
      >
        {summary.state === "loading" ? (
          <NativeSettingsRow
            kind="value"
            label={t("settingsHub.summary.title")}
            testID="settings-calendar-summary-loading"
          />
        ) : (
          <NativeSettingsRow
            kind="navigation"
            href="/user-calendars"
            label={t("settingsHub.summary.manage")}
            value={summaryValue}
            hint={t("settingsHub.summary.hint")}
            testID="settings-calendar-summary"
          />
        )}
        <NativeSettingsSwitchRow
          label={t("settingsHub.summary.showWeekends")}
          value={showWeekends}
          onValueChange={setShowWeekends}
          testID="settings-show-weekends-row"
          switchTestID="settings-show-weekends-switch"
        />
      </NativeSettingsSection>
      {sections.map((section) => (
        <NativeSettingsSection
          key={section}
          title={t(`settingsHub.section.${section}`)}
          testID={`settings-section-${section}`}
        >
          {destinations
            .filter((destination) => destination.section === section)
            .map((destination) => {
              const hasUnreadBadge = "unreadBadge" in destination
              return (
                <NativeSettingsRow
                  key={destination.href}
                  kind="navigation"
                  href={destination.href}
                  label={t(destination.label)}
                  hint={t(destination.hint)}
                  badge={
                    hasUnreadBadge
                      ? (formatUnreadBadge(unreadCount) ?? undefined)
                      : undefined
                  }
                  testID={destination.testID}
                />
              )
            })}
        </NativeSettingsSection>
      ))}
      {showEnvironmentControl ? (
        <NativeSettingsSection
          title={t("environment.selector.section")}
          testID="settings-section-environment"
        >
          <EnvironmentSettingsControl />
        </NativeSettingsSection>
      ) : null}
    </NativeSettingsHost>
  )
}
