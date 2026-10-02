import type { ReactElement } from "react"
import { type RefreshControlProps, StyleSheet, View } from "react-native"

import { useAdaptiveLayout } from "@/components/adaptive-content"
import {
  addDaysInZone,
  type AppLocale,
  dayKey,
  useCalendarEvents,
} from "@/features/calendar/data"
import { useChecklistProgress } from "@/features/event-checklists"
import { Spacing } from "@/theme"

import { AgendaList } from "./agenda-list"
import { CalendarScreenStatus } from "./calendar-screen/calendar-screen-status"

const AGENDA_DAYS = 7

/** The Agenda's own seven-day read, mounted only while the Agenda is shown. */
export function CalendarAgendaPane({
  selectedDate,
  displayZone,
  locale,
  isSyncing,
  isError,
  onSync,
  refreshControl,
  onPressEvent,
}: {
  selectedDate: Date
  displayZone: string
  locale: AppLocale
  isSyncing: boolean
  isError: boolean
  onSync: () => void
  refreshControl: ReactElement<RefreshControlProps>
  onPressEvent: (uid: string) => void
}) {
  const end = addDaysInZone(selectedDate, AGENDA_DAYS, displayZone)
  const events = useCalendarEvents({
    from: selectedDate,
    to: end,
    civilFromDay: dayKey(selectedDate, displayZone),
    civilToDay: dayKey(end, displayZone),
  })
  const checklistProgress = useChecklistProgress(
    events.map((event) => event.id),
  )
  const layout = useAdaptiveLayout("standard")
  return (
    <View
      testID="calendar-agenda-responsive-owner"
      style={styles.owner}
      onLayout={layout.onLayout}
    >
      <View
        testID="calendar-agenda-responsive-lane"
        style={[layout.laneStyle, styles.lane]}
      >
        <CalendarScreenStatus
          isEmpty={events.length === 0}
          isError={isError}
          isSyncing={isSyncing}
          onRetry={onSync}
        />
        <AgendaList
          events={events}
          checklistProgress={checklistProgress}
          locale={locale}
          displayZone={displayZone}
          refreshControl={refreshControl}
          onPressEvent={(event) => onPressEvent(event.id)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  owner: { flex: 1 },
  lane: { flex: 1, gap: Spacing.two },
})
