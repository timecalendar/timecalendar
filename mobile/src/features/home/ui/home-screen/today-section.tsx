import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import {
  EventSurface,
  EventSurfaceText,
  StatusView,
  ThemedText,
} from "@/design"
import { type CalendarEvent, displayEventTitle } from "@/features/calendar/data"
import {
  ChecklistProgressIndicator,
  type ChecklistProgressMap,
} from "@/features/event-checklists"
import { type HourRange } from "@/features/home/data"
import { homeEventOpenLabel } from "@/features/home/ui/event-accessibility"
import { TodayTimeline } from "@/features/home/ui/today-timeline"
import { Spacing } from "@/theme"

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
  const isEmpty = allDayEvents.length === 0 && timedEvents.length === 0

  return (
    <View style={styles.section}>
      {isEmpty ? (
        <StatusView
          kind="empty"
          presentation="inline"
          title={t("home.today.title")}
          caption={t("home.today.empty")}
          testID="home-today-empty"
        />
      ) : (
        <ThemedText type="sectionTitle">{t("home.today.title")}</ThemedText>
      )}
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
          return (
            <EventSurface
              key={event.id}
              eventColor={event.color}
              density="compact"
              accessibilityLabel={homeEventOpenLabel(
                t,
                event,
                t("home.today.allDay"),
                progress,
              )}
              accessibilityHint={
                event.userCalendarId !== undefined
                  ? t("home.event.hint.details")
                  : t("home.event.hint.edit")
              }
              onPress={() => onPressEvent(event)}
            >
              <EventSurfaceText type="label" numberOfLines={2}>
                {displayEventTitle(event.title, t("calendar.event.noTitle"))}
              </EventSurfaceText>
              <ChecklistProgressIndicator progress={progress} />
            </EventSurface>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: Spacing.one },
  allDayRow: { gap: Spacing.two },
  allDayLabel: { paddingTop: Spacing.one },
  allDayItems: { flex: 1, gap: Spacing.two },
})
