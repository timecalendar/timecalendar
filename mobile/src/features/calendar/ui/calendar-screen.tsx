import { router, Stack } from "expo-router"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import {
  buildCalendarTheme,
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type CalendarRef,
  type EventItem,
  Host,
  Picker,
} from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  type AppLocale,
  type CalendarEvent,
  eventRoute,
  formatMonthYear,
  formatTimeRange,
  GRID_END_MINUTE,
  GRID_START_MINUTE,
  localDayKey,
  MIN_TILE_WIDTH,
  resolveLocale,
  useCalendarEvents,
  useSyncCalendars,
  utcDayKey,
} from "@/features/calendar/data"
import { Radii, Spacing, useTheme } from "@/theme"

import { AgendaList } from "./agenda-list"

// The read-only day/week/agenda timeline (D6) — PRESENTATIONAL (70% floor). It
// holds the view (day | week | agenda) + the visible date, computes the range,
// reads events through the sibling data sub-barrel's events-source seam (B-2),
// maps them to the seam's EventItem shape, and renders through @/components/chrome
// (the calendar-kit seam). A designed brand surface (R-3): the `theme` is built
// from @/theme tokens, the now-indicator rides the brand `primary`. No write path.
//
// Chrome is the OS navigation bar (the route is a nested Stack under the Calendar
// tab): the live month + year is the title (orientation across all three views —
// derived from `windowStart`, the first visible day), the view switch is a native
// menu (headerLeft), and Today + Add are grouped header actions (headerRight on
// iOS; Today in the bar + a FAB on Android, per platform idiom). The route
// (src/app/(tabs)/calendar/) is a thin re-export (route-structure rule).

type CalendarView = "day" | "week" | "agenda"

// Weekends-off default (Flutter parity): a week is the 5 weekdays. Day is 1.
const WEEK_DAYS = 7
// The agenda is a planning list, so it spans a bounded multi-day window (the
// visible week) rather than a single day/week grid (D1).
const AGENDA_DAYS = 7

// Local midnight of a Date — always a fresh Date so callers never mutate the input.
function startOfLocalDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function mapToEventItem(event: CalendarEvent): EventItem {
  const base = {
    id: event.id,
    title: event.title,
    color: event.color,
    // Carried on the EventItem (Record<string, any>) so renderEvent can build a
    // rich accessible label (title + time/all-day + location) without re-querying.
    location: event.location,
    allDay: event.allDay,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
  }
  // An all-day event maps to calendar-kit's DATE-ONLY shape so the lib lanes it in
  // the all-day row above the timed grid (a timed dateTime block spanning 24h would
  // straddle local midnight and paint two day columns). Two contracts the installed
  // source pins (eventUtils.js getEventTimes): the all-day `end.date` is INCLUSIVE
  // (`.endOf('day')`), but our `endsAt` is the EXCLUSIVE end (ICS convention), so the
  // last covered day is `endsAt − 1ms`; and the day is read off UTC (`utcDayKey`) — an
  // all-day date is floating (May 25 everywhere), and local keying would shift it a day
  // for a UTC-negative viewer.
  if (event.allDay) {
    // `max(startsAt, endsAt − 1ms)` guards a degenerate zero-duration all-day event
    // (endsAt === startsAt): a bare `endsAt − 1ms` would put `end.date` a day BEFORE
    // `start.date`, and calendar-kit's `isValidEventRange` (eventEndUnix > startUnix)
    // would then silently drop it from the grid while agenda/details still show it.
    const lastCoveredMs = Math.max(
      event.startsAt.getTime(),
      event.endsAt.getTime() - 1,
    )
    return {
      ...base,
      start: { date: utcDayKey(event.startsAt) },
      end: { date: utcDayKey(new Date(lastCoveredMs)) },
    }
  }
  return {
    ...base,
    start: { dateTime: event.startsAt.toISOString() },
    end: { dateTime: event.endsAt.toISOString() },
  }
}

export function CalendarScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [view, setView] = useState<CalendarView>("week")
  // The first day the grid is showing (local midnight). It starts at today but
  // FOLLOWS the grid as the user scrolls (onDateChanged) so the events-source
  // range tracks the visible window. Without it the range is frozen at mount:
  // calendar-kit paints the scrolled-to week but no events are ever loaded for it.
  const [windowStart, setWindowStart] = useState(() =>
    startOfLocalDay(new Date()),
  )
  // The imperative grid handle — the "Today" action drives the (uncontrolled after
  // mount) calendar-kit grid back to the current day; the agenda has no grid, so
  // there the windowStart reset alone recentres the loaded window.
  const gridRef = useRef<CalendarRef>(null)

  const locale = resolveLocale(i18n.language)
  const numberOfDays =
    view === "day" ? 1 : view === "agenda" ? AGENDA_DAYS : WEEK_DAYS

  // The agenda is an exact multi-day list; the grid buffers one page on each side
  // of the visible window so scrolling to an adjacent week shows its events
  // instantly (calendar-kit only paints the visible page — the off-screen rows
  // sit ready), and the pinned-at-mount range bug can't reappear per-page.
  const range = useMemo(() => {
    const from = startOfLocalDay(windowStart)
    const to = startOfLocalDay(windowStart)
    if (view === "agenda") {
      to.setDate(to.getDate() + numberOfDays)
    } else {
      from.setDate(from.getDate() - numberOfDays)
      to.setDate(to.getDate() + numberOfDays * 2)
    }
    return { from, to }
  }, [windowStart, view, numberOfDays])

  const events = useCalendarEvents(range)
  const eventItems = useMemo(() => events.map(mapToEventItem), [events])
  const calendarTheme = useMemo(() => buildCalendarTheme(theme), [theme])

  // The nav-bar title: the visible window's month + year (orientation for every
  // view — Flutter's month header parity, native-chrome placement).
  const monthTitle = formatMonthYear(windowStart, locale)

  // The sync orchestrator (D5) — the screen stays presentational, calling the
  // data/ hook with no fetch logic of its own. The reactive useCalendarEvents read
  // reflects a successful sync's replaceAll automatically. Pull-to-refresh runs
  // sync(); a recoverable failure surfaces an accessible error + retry (the
  // last-good rows still render — D6: a fetch failure is NOT a crash).
  const { sync, isSyncing, isError } = useSyncCalendars()

  // Both kinds open the unified event-details screen keyed on the uid (ADR 024):
  // the details screen resolves synced vs. personal itself, so the tap no longer
  // routes by origin. The grid and the agenda both route through this one handler.
  const handlePressEvent = (uid: string) => {
    router.push(eventRoute(uid))
  }

  // "Today": drive the grid back to the current day (the grid is uncontrolled
  // after mount) and reset the loaded window so the range tracks it. In the agenda
  // (no grid) the windowStart reset alone recentres the list.
  const goToToday = () => {
    const today = startOfLocalDay(new Date())
    gridRef.current?.goToDate({
      date: today.toISOString(),
      animatedDate: true,
      hourScroll: true,
    })
    setWindowStart(today)
  }

  // "Add": the calendar's only create affordance opens the personal-event form in
  // create mode (a Stack sibling of the tabs) — the screen itself stays read-only.
  const addEvent = () => {
    router.push("/personal-event-form")
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
      <Stack.Screen
        options={{
          // A regular OPAQUE inline nav bar — NOT headerLargeTitle. A large title
          // needs a native UIScrollView to attach to and collapse against;
          // calendar-kit's grid is a custom Reanimated view, so a large title
          // degrades to a transparent floating header and the grid renders under
          // the status bar (device-proven). The inline bar reserves its space and
          // insets the calendar below it, on both platforms.
          headerTitle: monthTitle,
          // Match the app background (the nav theme's `card` is a distinct grey
          // that reads as a mismatched band over the black/plain calendar surface)
          // and drop the hairline so the header merges into the content.
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
          headerLeft: () => <ViewMenu view={view} onChange={setView} />,
          headerRight: () => (
            <HeaderActions onToday={goToToday} onAdd={addEvent} />
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        {(events.length === 0 || isError) && (
          <View style={styles.banners}>
            {events.length === 0 && (
              <ThemedText
                themeColor="textSecondary"
                accessibilityLiveRegion="polite"
                accessibilityRole="text"
                testID="calendar-empty"
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
          </View>
        )}

        <View style={styles.calendar}>
          {view === "agenda" ? (
            <AgendaList
              events={events}
              locale={locale}
              refreshControl={refreshControl}
              onPressEvent={(event) => handlePressEvent(event.id)}
            />
          ) : (
            <CalendarContainer
              ref={gridRef}
              numberOfDays={numberOfDays}
              initialDate={localDayKey(windowStart)}
              start={GRID_START_MINUTE}
              end={GRID_END_MINUTE}
              events={eventItems}
              theme={calendarTheme}
              onDateChanged={(iso) =>
                setWindowStart(startOfLocalDay(new Date(iso)))
              }
              onPressEvent={(event) => handlePressEvent(event.id)}
            >
              <CalendarHeader
                renderEvent={(event) => (
                  <AllDayTile event={event} locale={locale} />
                )}
              />
              <CalendarBody
                showNowIndicator
                renderEvent={(event, size) => (
                  <EventTile event={event} width={size.width} locale={locale} />
                )}
              />
            </CalendarContainer>
          )}

          {/* Material primary-action idiom: on Android "Add" is a FAB over the
              content; on iOS it lives in the header group (HeaderActions). */}
          {Platform.OS === "android" && <AddFab onPress={addEvent} />}
        </View>
      </SafeAreaView>
    </ThemedView>
  )
}

// The day/week/agenda switch — a native menu (SwiftUI Menu / Compose dropdown via
// @expo/ui, behind the chrome seam), NOT three on-screen controls: a student
// rarely changes view, so the switch costs no permanent screen real estate. The
// trigger shows the current view; tapping opens the choices.
function ViewMenu({
  view,
  onChange,
}: {
  view: CalendarView
  onChange: (view: CalendarView) => void
}) {
  const { t } = useTranslation()
  return (
    <Host matchContents style={styles.viewMenu}>
      <Picker
        testID="calendar-view"
        appearance="menu"
        selectedValue={view}
        onValueChange={(value) => onChange(value as CalendarView)}
      >
        <Picker.Item label={t("calendar.view.day")} value="day" />
        <Picker.Item label={t("calendar.view.week")} value="week" />
        <Picker.Item label={t("calendar.view.agenda")} value="agenda" />
      </Picker>
    </Host>
  )
}

// The grouped header actions (headerRight): Today + Add. Today is always offered
// (a one-tap jump home from anywhere). On Android the create action is a FAB, not
// a header button, so Add renders here on iOS only.
function HeaderActions({
  onToday,
  onAdd,
}: {
  onToday: () => void
  onAdd: () => void
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.headerActions}>
      <TodayButton onPress={onToday} />
      {Platform.OS !== "android" && (
        <Pressable
          testID="calendar-add"
          accessibilityRole="button"
          accessibilityLabel={t("calendar.addLabel")}
          hitSlop={Spacing.two}
          onPress={onAdd}
        >
          <ThemedText themeColor="primary" style={styles.addGlyph}>
            {t("calendar.add")}
          </ThemedText>
        </Pressable>
      )}
    </View>
  )
}

// The "Today" action, drawn as a calendar-day glyph (a bordered page with today's
// date number inside — the Fantastical/Apple "today" idiom) rather than bare text,
// since no icon font is wired in the app (R-3). The number is today's day-of-month
// so the control reads as "jump to today" at a glance.
function TodayButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const dayOfMonth = String(new Date().getDate())
  return (
    <Pressable
      testID="calendar-today"
      accessibilityRole="button"
      accessibilityLabel={t("calendar.todayLabel")}
      hitSlop={Spacing.two}
      onPress={onPress}
      style={[styles.todayButton, { borderColor: theme.primary }]}
    >
      <View style={[styles.todayTab, { backgroundColor: theme.primary }]} />
      <ThemedText themeColor="primary" style={styles.todayNumber}>
        {dayOfMonth}
      </ThemedText>
    </Pressable>
  )
}

// The Android create FAB (Material primary-action idiom) — floats over the
// bottom-right of the calendar content, above the tab bar; never collides with a
// header search action (which lives in the top bar).
function AddFab({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <Pressable
      testID="calendar-fab"
      accessibilityRole="button"
      accessibilityLabel={t("calendar.addLabel")}
      onPress={onPress}
      style={[styles.fab, { backgroundColor: theme.primary }]}
    >
      <ThemedText themeColor="background" style={styles.fabGlyph}>
        {t("calendar.add")}
      </ThemedText>
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
  locale,
}: {
  event: EventItem
  width: { value: number } | number
  locale: AppLocale
}) {
  const { t } = useTranslation()
  const resolvedWidth = typeof width === "number" ? width : width.value
  const showText = resolvedWidth >= MIN_TILE_WIDTH
  const title = event.title ?? ""
  const startsAt = event.startsAt as Date | undefined
  const endsAt = event.endsAt as Date | undefined
  const location = (event.location as string | undefined) ?? ""
  // Through the data/ format seam (not a hand-rolled formatter) so the grid tile's
  // accessible time label matches the agenda's exactly ("09:00 – 10:30").
  const time =
    startsAt && endsAt ? formatTimeRange(startsAt, endsAt, locale) : ""
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={t("calendar.event.label", { title, time, location })}
      style={[styles.tile, { backgroundColor: event.color }]}
    >
      {showText && (
        <>
          {/* A generous numberOfLines cap is load-bearing on iOS — NOT a
              truncation preference. With NO cap, RN's Fabric text layout sets
              the container to NSLineBreakByClipping while the paragraph stays
              word-wrapping, so interior lines char-break but the LAST line's
              over-long word is clipped mid-glyph at the right edge (and a phantom
              line is reserved above the location). A cap flips iOS onto the
              tail-truncation path, which wraps + character-breaks every line and
              only ellipsises the final one. 5 lines lets a long subject use the
              tile's height; the tile's overflow:"hidden" clips shorter tiles so
              the trailing "…" stays hidden there (the Apple/Google week-tile
              model — wrap, break mid-word, clip). Do NOT set ellipsizeMode="clip"
              — it re-selects the very clipping mode this avoids. */}
          <ThemedText type="caption" themeColor="background" numberOfLines={5}>
            {title}
          </ThemedText>
          {location.length > 0 && (
            <ThemedText
              type="captionSmall"
              themeColor="background"
              numberOfLines={1}
            >
              {location}
            </ThemedText>
          )}
        </>
      )}
    </View>
  )
}

// An all-day event tile for the calendar-kit all-day LANE (CalendarHeader's
// renderEvent — a PackedAllDayEvent, distinct from the timed grid's CalendarBody
// renderEvent). The lane's Touchable already paints the event `color` + wires the
// press → details, so the tile draws only the title text over it (a single line —
// the all-day row is short, ~1 event-row tall; location lives in the a11y label +
// the details screen, the Apple/Google all-day-chip idiom). A NON-flex layout is
// load-bearing: calendar-kit's event content is an `absoluteFillObject` sized by a
// Reanimated animated height, so a `flex:1` child resolves against a height Yoga
// reads as auto → 0px (the title vanishes into a 1–2px bar). Flowing text with no
// flex renders like the library's own default all-day tile. The accessible label
// reuses the grid tile's key with an "all day" time so the reader gives one stop.
//
// The label branches on the REAL `allDay` flag, not the lane: calendar-kit also
// lanes any TIMED event with `duration >= 24h` into this row (eventUtils.js:63), so
// a genuine timed multi-day event reaches this tile too — it must announce its real
// time range ("09:00 – 18:00"), never a false "all day".
function AllDayTile({
  event,
  locale,
}: {
  event: EventItem
  locale: AppLocale
}) {
  const { t } = useTranslation()
  const title = event.title ?? ""
  const location = (event.location as string | undefined) ?? ""
  const startsAt = event.startsAt as Date | undefined
  const endsAt = event.endsAt as Date | undefined
  const time =
    event.allDay || !startsAt || !endsAt
      ? t("calendar.allDay")
      : formatTimeRange(startsAt, endsAt, locale)
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={t("calendar.event.label", { title, time, location })}
      style={styles.allDayTile}
    >
      <ThemedText type="captionSmall" themeColor="background" numberOfLines={1}>
        {title}
      </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  allDayTile: {
    paddingHorizontal: Spacing.half,
  },
  safeArea: {
    flex: 1,
    gap: Spacing.two,
  },
  // The screen chrome (title, view switch, actions) is the native nav bar; the
  // calendar surface below stays full-bleed. Only the banners are guttered.
  banners: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  calendar: {
    flex: 1,
  },
  viewMenu: {
    minHeight: 44,
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    // Breathing room so Today and the "+" aren't jammed against each other or the
    // screen edge (the cramped default the device showed).
    paddingHorizontal: Spacing.one,
  },
  // The "today" calendar-day glyph: a slim bordered page (~22×24) with a thin
  // coloured header tab and the day number below — sized to read as a compact
  // nav-bar icon, not a chunky button.
  todayButton: {
    width: 22,
    height: 24,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    overflow: "hidden",
  },
  todayTab: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  todayNumber: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
  },
  // A larger "+" glyph for the iOS header add action — no icon font is wired in
  // the app (R-3), so the glyph is text (matches the details screen's text-label
  // header actions).
  addGlyph: {
    fontSize: 26,
    lineHeight: 28,
  },
  fab: {
    position: "absolute",
    right: Spacing.three,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    // Material elevation 6 (resting FAB) — shadow set for both schemes.
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabGlyph: {
    fontSize: 30,
    lineHeight: 32,
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
