import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { type CalendarEvent } from "@/features/calendar/data"
import {
  ChecklistProgressIndicator,
  checklistProgressLabel,
  type ChecklistProgressMap,
} from "@/features/event-checklists"
import { type HourRange } from "@/features/home/data"
import { eventSurfaceColor } from "@/features/home/ui/event-surface"
import { TodayTimeline } from "@/features/home/ui/today-timeline"
import { Radii, Spacing, useTheme } from "@/theme"

interface TodaySectionProps {
  now: Date
  locale: "fr" | "en"
  displayZone: string
  allDayEvents: CalendarEvent[]
  timedEvents: CalendarEvent[]
  checklistProgress: ChecklistProgressMap
  hourRange: HourRange
  onPressEvent: (event: CalendarEvent) => void
}

export function TodaySection({
  now,
  locale,
  displayZone,
  allDayEvents,
  timedEvents,
  checklistProgress,
  hourRange,
  onPressEvent,
}: TodaySectionProps) {
  const { t } = useTranslation()
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>
        {t("home.today.title")}
      </ThemedText>
      {allDayEvents.length > 0 && (
        <AllDayEvents
          events={allDayEvents}
          checklistProgress={checklistProgress}
          onPressEvent={onPressEvent}
        />
      )}
      {timedEvents.length > 0 ? (
        <TodayTimeline
          events={timedEvents}
          range={hourRange}
          locale={locale}
          displayZone={displayZone}
          isToday
          now={now}
          checklistProgress={checklistProgress}
          onPressEvent={onPressEvent}
        />
      ) : allDayEvents.length === 0 ? (
        <ThemedText themeColor="textSecondary" accessibilityLiveRegion="polite">
          {t("home.today.empty")}
        </ThemedText>
      ) : null}
    </View>
  )
}

function AllDayEvents({
  events,
  checklistProgress,
  onPressEvent,
}: {
  events: CalendarEvent[]
  checklistProgress: ChecklistProgressMap
  onPressEvent: (event: CalendarEvent) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <View testID="home-all-day" style={styles.allDayRow}>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={styles.allDayLabel}
        accessibilityRole="header"
      >
        {t("home.today.allDay")}
      </ThemedText>
      <View style={styles.allDayItems}>
        {events.map((event) => {
          const progress = checklistProgress.get(event.id)
          const progressLabel = checklistProgressLabel(t, progress)
          return (
            <Pressable
              key={event.id}
              accessibilityRole="button"
              accessibilityLabel={
                progressLabel === undefined
                  ? t("home.event.openLabel", {
                      title: event.title,
                      time: t("home.today.allDay"),
                      location: event.location ?? "",
                    })
                  : t("home.event.openLabelWithProgress", {
                      title: event.title,
                      time: t("home.today.allDay"),
                      location: event.location ?? "",
                      progress: progressLabel,
                    })
              }
              accessibilityHint={
                event.userCalendarId !== undefined
                  ? t("home.event.hint.details")
                  : t("home.event.hint.edit")
              }
              onPress={() => onPressEvent(event)}
              android_ripple={{ color: theme.ripple, foreground: true }}
              style={({ pressed }) => [
                styles.allDayEvent,
                { backgroundColor: eventSurfaceColor(event.color) },
                Platform.OS === "ios" && pressed && styles.iosPressed,
              ]}
            >
              <ThemedText type="smallBold" numberOfLines={2}>
                {event.title}
              </ThemedText>
              <ChecklistProgressIndicator progress={progress} />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: Spacing.one },
  sectionTitle: { fontSize: 20, lineHeight: 25, fontWeight: "700" },
  allDayRow: { gap: Spacing.two },
  allDayLabel: { paddingTop: Spacing.one },
  allDayItems: { flex: 1, gap: Spacing.two },
  allDayEvent: {
    minHeight: Platform.OS === "android" ? 48 : 44,
    padding: Spacing.two,
    borderRadius: Radii.large,
    justifyContent: "center",
    overflow: "hidden",
  },
  iosPressed: { opacity: 0.62 },
})
