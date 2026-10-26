import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"

import { EventSurface, EventSurfaceText } from "@/design"
import {
  type AppLocale,
  type CalendarEvent,
  displayEventTitle,
  formatTimeRange,
} from "@/features/calendar/data"
import {
  type ChecklistProgress,
  ChecklistProgressIndicator,
  type ChecklistProgressMap,
} from "@/features/event-checklists"
import { Spacing } from "@/theme"

import { homeEventOpenLabel } from "./event-accessibility"

// A few events per day, so a core horizontal list suffices (no FlashList — R-2, same
// reasoning as the agenda's SectionList).

const CARD_WIDTH = 200

export function UpcomingScroller({
  contentInset = 0,
  events,
  checklistProgress,
  locale,
  displayZone,
  onPressEvent,
}: {
  contentInset?: number
  events: CalendarEvent[]
  checklistProgress: ChecklistProgressMap
  locale: AppLocale
  displayZone: string
  onPressEvent: (event: CalendarEvent) => void
}) {
  if (events.length === 0) return null

  return (
    <ScrollView
      testID="upcoming-scroller"
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: contentInset },
      ]}
    >
      {events.map((event) => (
        <UpcomingCard
          key={event.id}
          event={event}
          progress={checklistProgress.get(event.id)}
          locale={locale}
          zone={displayZone}
          onPress={() => onPressEvent(event)}
        />
      ))}
    </ScrollView>
  )
}

function UpcomingCard({
  event,
  progress,
  locale,
  zone,
  onPress,
}: {
  event: CalendarEvent
  progress: ChecklistProgress | undefined
  locale: AppLocale
  zone: string
  onPress: () => void
}) {
  const { t } = useTranslation()
  const time = event.allDay
    ? t("home.today.allDay")
    : formatTimeRange(event.startsAt, event.endsAt, locale, zone)
  const location = event.location ?? ""

  return (
    <EventSurface
      eventColor={event.color}
      testID={`upcoming-card-${event.id}`}
      accessibilityLabel={homeEventOpenLabel(t, event, time, progress)}
      accessibilityHint={
        event.userCalendarId !== undefined
          ? t("home.event.hint.details")
          : t("home.event.hint.edit")
      }
      onPress={onPress}
      style={styles.card}
    >
      <EventSurfaceText type="label" numberOfLines={2}>
        {displayEventTitle(event.title, t("calendar.event.noTitle"))}
      </EventSurfaceText>
      <EventSurfaceText type="callout" numberOfLines={2}>
        {time}
      </EventSurfaceText>
      {location.length > 0 && (
        <EventSurfaceText type="callout" numberOfLines={1}>
          {location}
        </EventSurfaceText>
      )}
      <ChecklistProgressIndicator progress={progress} />
    </EventSurface>
  )
}

const styles = StyleSheet.create({
  content: {
    alignItems: "flex-start",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  card: { width: CARD_WIDTH },
})
