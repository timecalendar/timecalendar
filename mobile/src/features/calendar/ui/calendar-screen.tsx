import { router } from "expo-router"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, RefreshControl, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import {
  buildCalendarTheme,
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type EventItem,
} from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  type CalendarEvent,
  eventRoute,
  GRID_END_MINUTE,
  GRID_START_MINUTE,
  MIN_TILE_WIDTH,
  resolveLocale,
  useCalendarEvents,
  useSyncCalendars,
} from "@/features/calendar/data"
import { Radii, Spacing, useTheme } from "@/theme"

import { AgendaList } from "./agenda-list"

// The read-only day/week timeline (D6) — PRESENTATIONAL (70% floor). It holds
// the view (day | week) + the visible date, computes the range, reads events
// through the sibling data sub-barrel's events-source seam (B-2), maps them to
// the seam's EventItem shape, and renders through @/components/chrome (the
// calendar-kit seam). A designed brand surface (R-3): the `theme` is built from
// @/theme tokens, the now-indicator rides the brand `primary`. No write path.
// The route (src/app/calendar.tsx) is a thin re-export (route-structure rule).

type CalendarView = "day" | "week" | "agenda"

// Weekends-off default (Flutter parity): a week is the 5 weekdays. Day is 1.
const WEEK_DAYS = 5
// The agenda is a planning list, so it spans a bounded multi-day window (the
// visible week) rather than a single day/week grid (D1).
const AGENDA_DAYS = 7

function ymd(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function mapToEventItem(event: CalendarEvent): EventItem {
  return {
    id: event.id,
    title: event.title,
    color: event.color,
    start: { dateTime: event.startsAt.toISOString() },
    end: { dateTime: event.endsAt.toISOString() },
    // Carried on the EventItem (Record<string, any>) so renderEvent can build a
    // rich accessible label (title + time + location) without re-querying, and so
    // the grid's onPressEvent can route by origin (D2/D4) without a re-query.
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    userCalendarId: event.userCalendarId,
  }
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function CalendarScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [view, setView] = useState<CalendarView>("week")
  const [visibleDate] = useState(() => new Date())

  const locale = resolveLocale(i18n.language)
  const numberOfDays =
    view === "day" ? 1 : view === "agenda" ? AGENDA_DAYS : WEEK_DAYS

  const range = useMemo(() => {
    const from = new Date(visibleDate)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + numberOfDays)
    return { from, to }
  }, [visibleDate, numberOfDays])

  const events = useCalendarEvents(range)
  const calendarEvents = useMemo(() => events.map(mapToEventItem), [events])
  const calendarTheme = useMemo(() => buildCalendarTheme(theme), [theme])

  // The sync orchestrator (D5) — the screen stays presentational, calling the
  // data/ hook with no fetch logic of its own. The reactive useCalendarEvents read
  // reflects a successful sync's replaceAll automatically. Pull-to-refresh runs
  // sync(); a recoverable failure surfaces an accessible error + retry (the
  // last-good rows still render — D6: a fetch failure is NOT a crash).
  const { sync, isSyncing, isError } = useSyncCalendars()

  // Route a tapped event by ORIGIN (D2): a synced calendar event carries a
  // userCalendarId → the read-only details screen; a personal event (no
  // userCalendarId) → its existing editable form. The merged CalendarEvent's
  // userCalendarId is the discriminator (personalToCalendarEvent sets it
  // undefined). The grid and the agenda both route through this one handler.
  const handlePressEvent = (
    uid: string,
    userCalendarId: string | undefined,
  ) => {
    router.push(eventRoute(uid, userCalendarId))
  }

  // The agenda's RefreshControl, brand-tinted (R-3). Wired into the SectionList so
  // the agenda is pull-to-refresh; the error/retry banner below covers every view.
  const refreshControl = (
    <RefreshControl
      testID="calendar-refresh"
      refreshing={isSyncing}
      onRefresh={() => {
        void sync()
      }}
      tintColor={theme.primary}
      colors={[theme.primary]}
      accessibilityLabel={t("calendar.sync.refreshingLabel")}
    />
  )

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t("calendar.title")}</ThemedText>

        <View style={styles.switch} accessibilityRole="tablist">
          <ViewButton
            label={t("calendar.view.day")}
            accessibilityLabel={t("calendar.view.dayLabel")}
            selected={view === "day"}
            onPress={() => setView("day")}
            testID="calendar-view-day"
          />
          <ViewButton
            label={t("calendar.view.week")}
            accessibilityLabel={t("calendar.view.weekLabel")}
            selected={view === "week"}
            onPress={() => setView("week")}
            testID="calendar-view-week"
          />
          <ViewButton
            label={t("calendar.view.agenda")}
            accessibilityLabel={t("calendar.view.agendaLabel")}
            selected={view === "agenda"}
            onPress={() => setView("agenda")}
            testID="calendar-view-agenda"
          />
        </View>

        {events.length === 0 && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("calendar.empty")}
          </ThemedText>
        )}

        {isError && (
          <View
            style={styles.syncError}
            accessibilityLiveRegion="polite"
            testID="calendar-sync-error"
          >
            <ThemedText
              type="small"
              themeColor="textSecondary"
              accessibilityRole="alert"
              style={styles.syncErrorText}
            >
              {t("calendar.sync.error")}
            </ThemedText>
            <Pressable
              testID="calendar-sync-retry"
              accessibilityRole="button"
              accessibilityLabel={t("calendar.sync.retryLabel")}
              hitSlop={Spacing.two}
              onPress={() => {
                void sync()
              }}
              style={[
                styles.retryButton,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <ThemedText type="smallBold">
                {t("calendar.sync.retry")}
              </ThemedText>
            </Pressable>
          </View>
        )}

        <View style={styles.calendar}>
          {view === "agenda" ? (
            <AgendaList
              events={events}
              locale={locale}
              refreshControl={refreshControl}
              onPressEvent={(event) =>
                handlePressEvent(event.id, event.userCalendarId)
              }
            />
          ) : (
            <CalendarContainer
              numberOfDays={numberOfDays}
              initialDate={ymd(visibleDate)}
              start={GRID_START_MINUTE}
              end={GRID_END_MINUTE}
              events={calendarEvents}
              theme={calendarTheme}
              onPressEvent={(event) =>
                handlePressEvent(
                  event.id,
                  event.userCalendarId as string | undefined,
                )
              }
            >
              <CalendarHeader />
              <CalendarBody
                showNowIndicator
                renderEvent={(event, size) => (
                  <EventTile event={event} width={size.width} />
                )}
              />
            </CalendarContainer>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  )
}

function ViewButton({
  label,
  accessibilityLabel,
  selected,
  onPress,
  testID,
}: {
  label: string
  accessibilityLabel: string
  selected: boolean
  onPress: () => void
  testID: string
}) {
  const theme = useTheme()
  return (
    <Pressable
      testID={testID}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      hitSlop={Spacing.two}
      onPress={onPress}
      style={[
        styles.viewButton,
        {
          backgroundColor: selected
            ? theme.backgroundSelected
            : theme.backgroundElement,
        },
      ]}
    >
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  )
}

// An event tile rendered into the calendar-kit grid. `size.width` is a Reanimated
// shared value at runtime; the mocked grid (jest/setup-calendar-kit) passes a
// plain number so the tile's label wiring is provable. Below MIN_TILE_WIDTH the
// label is hidden (the column is too narrow to read).
function EventTile({
  event,
  width,
}: {
  event: EventItem
  width: { value: number } | number
}) {
  const { t } = useTranslation()
  const resolvedWidth = typeof width === "number" ? width : width.value
  const showText = resolvedWidth >= MIN_TILE_WIDTH
  const title = event.title ?? ""
  const startsAt = event.startsAt as Date | undefined
  const endsAt = event.endsAt as Date | undefined
  const location = (event.location as string | undefined) ?? ""
  const time =
    startsAt && endsAt ? `${formatTime(startsAt)}–${formatTime(endsAt)}` : ""
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={t("calendar.event.label", { title, time, location })}
      style={[styles.tile, { backgroundColor: event.color }]}
    >
      {showText && (
        <>
          <ThemedText type="small" themeColor="background" numberOfLines={2}>
            {title}
          </ThemedText>
          {location.length > 0 && (
            <ThemedText type="small" themeColor="background" numberOfLines={1}>
              {location}
            </ThemedText>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  switch: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  viewButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
  calendar: {
    flex: 1,
  },
  syncError: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  syncErrorText: {
    flex: 1,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
  tile: {
    flex: 1,
    padding: Spacing.one,
    borderRadius: Radii.small,
    overflow: "hidden",
  },
})
