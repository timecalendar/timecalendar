import { router, Stack } from "expo-router"
import { type SFSymbol, SymbolView } from "expo-symbols"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

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
  quarterStartMs,
  quarterWindow,
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

// The nav-bar action glyph size (a compact SF Symbol, not a chunky button).
const HEADER_ICON_SIZE = 24

// How many pages of grid + events calendar-kit packs on EACH side of its store
// anchor, and the render-ahead (`drawDistance = width · pagesPerSide`). The
// anchor follows the visible date DURING a scroll — per-column advance + a 150ms
// leading+trailing throttle, via patches/@howljs+calendar-kit+2.5.6.patch
// (backlog Issue 5: the unpatched lib re-packs only ~300ms after the scroll
// fully STOPS — every scroll frame resets its settle debounce — so a fast fling
// landed on mounted-but-eventless pages until it rested). 4 packs ±4-5wk
// (`±(defaultOffset=7 · pagesPerSide)` days): runway so a fling stays inside the
// packed store across the ≤150ms re-pack cadence. The prop buffer (BUFFER_MONTHS
// in event-window.ts) MUST exceed this reach or the pack starves at the quarter
// edge. Tune only with a dense-calendar device pass (higher = more mounted
// pages + heavier re-packs; lower = less runway).
const GRID_PAGES_PER_SIDE = 4

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
  // The tab-bar clearance for the GRID only. Unlike the agenda's SectionList, the
  // calendar-kit grid scroller is NOT on the tab screen's index-0 descendant chain
  // (CalendarHeader is the earlier sibling; the RNGH scroller sits under a
  // GestureDetector), so iOS's automatic content-inset — which walks strictly
  // index-0 (react-native-screens RNSScrollViewFinder) — never reaches it. The grid
  // must therefore reserve its own bottom scroll pad. `insets.bottom` under native
  // tabs is bar-inclusive (the per-tab SafeAreaProvider measures the content view
  // under the translucent bar), so it is the correct clearance. Android keeps the
  // library default (bottomInset = 0): its opaque Material bar is not scrolled under.
  const insets = useSafeAreaInsets()
  const bottomInset = Platform.OS === "ios" ? insets.bottom : 0
  const [view, setView] = useState<CalendarView>("week")
  // The feed-anchor day (local midnight) — it follows the grid on scroll SETTLE
  // (onDateChanged) and, mid-scroll, on a QUARTER crossing only (onChange with a
  // functional bail — see the handler). It seeds the grid feed's quarter bucket,
  // the agenda's exact window, and the mount position. Distinct from
  // `visibleDate` below: within a quarter this never moves mid-scroll, so the
  // wide grid feed stays referentially stable while flinging.
  const [windowStart, setWindowStart] = useState(() =>
    startOfLocalDay(new Date()),
  )
  // The month title's day — it tracks the visible page IMMEDIATELY on scroll
  // (onChange, per visible-column change) rather than at settle (backlog Issue 6:
  // the month-year title lagged seconds behind the scroll because it rode
  // onDateChanged, which calendar-kit debounces to rest). Separate state so the
  // prompt title update never widens the events feed or re-reads a range.
  const [visibleDate, setVisibleDate] = useState(() =>
    startOfLocalDay(new Date()),
  )
  // The imperative grid handle — the "Today" action drives the (uncontrolled after
  // mount) calendar-kit grid back to the current day; the agenda has no grid, so
  // there the windowStart reset alone recentres the loaded window.
  const gridRef = useRef<CalendarRef>(null)

  const locale = resolveLocale(i18n.language)
  const numberOfDays =
    view === "day" ? 1 : view === "agenda" ? AGENDA_DAYS : WEEK_DAYS

  // The grid feeds calendar-kit a QUARTER-quantized window (backlog Issue 5), keyed
  // on the quarter's start ms so it is referentially STABLE while scrolling inside a
  // quarter — the lib windows it to the visible page internally (pagesPerSide), so a
  // fast fling never outruns a narrow per-page feed nor triggers a per-settle
  // refilter/remap. Only crossing a quarter recomputes; the ±1-month buffer keeps
  // the boundary page fed. See data/event-window.ts for the full rationale.
  const bucketMs = quarterStartMs(windowStart)
  const gridRange = useMemo(() => quarterWindow(bucketMs), [bucketMs])
  // The agenda is an exact multi-day list (no calendar-kit windowing), so it reads
  // its own tight visible-week range off the settled anchor.
  const agendaRange = useMemo(() => {
    const from = startOfLocalDay(windowStart)
    const to = startOfLocalDay(windowStart)
    to.setDate(to.getDate() + numberOfDays)
    return { from, to }
  }, [windowStart, numberOfDays])
  const range = view === "agenda" ? agendaRange : gridRange

  const events = useCalendarEvents(range)
  const eventItems = useMemo(() => events.map(mapToEventItem), [events])
  const calendarTheme = useMemo(() => buildCalendarTheme(theme), [theme])

  // The nav-bar title: the visible page's month + year (orientation for every view —
  // Flutter's month header parity, native-chrome placement). Off `visibleDate` so it
  // tracks the scroll promptly (Issue 6), not the settled anchor.
  const monthTitle = formatMonthYear(visibleDate, locale)

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
    setVisibleDate(today)
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
      <SafeAreaView
        style={styles.safeArea}
        // iOS drops the "bottom" edge so the calendar surface fills the full height
        // UNDER the translucent Liquid Glass tab bar. The two scrollers get their
        // bottom clearance differently: the agenda SectionList IS the index-0 nested
        // scroll view, so iOS auto-insets it for free (expo-router types.d.ts); the
        // grid is NOT index-0 (see bottomInset), so it reserves its own pad via
        // `spaceFromBottom`. Reserving the frame here too would double-inset the
        // agenda. Android keeps "bottom": its opaque Material bar is not scrolled
        // under, so the space stays reserved as before.
        edges={
          Platform.OS === "ios"
            ? ["left", "right"]
            : ["bottom", "left", "right"]
        }
      >
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
              pagesPerSide={GRID_PAGES_PER_SIDE}
              initialDate={localDayKey(windowStart)}
              start={GRID_START_MINUTE}
              end={GRID_END_MINUTE}
              events={eventItems}
              theme={calendarTheme}
              // Grid-only bottom scroll pad = tab-bar clearance (the grid can't get
              // the OS auto-inset — see bottomInset above). Spacing.three (16) is the
              // library default breathing room; iOS adds the bar-inclusive inset so
              // the last hour scrolls clear of the translucent bar it renders under.
              spaceFromBottom={Spacing.three + bottomInset}
              // onChange fires per visible-column during a fling (~1/day). The
              // title only shows month+year, so quantize to the MONTH: a functional
              // update that returns the SAME reference within a month makes React
              // bail the re-render (else a fresh Date each column re-renders the
              // screen ~1/day → recreates the Stack.Screen options → re-commits the
              // native header Picker + SF-Symbols per column, the very JS thrash
              // Issue 5 kills). The title still flips the instant a new month scrolls
              // in — there is nothing to update within a month.
              onChange={(iso) => {
                const next = startOfLocalDay(new Date(iso))
                setVisibleDate((prev) =>
                  prev.getFullYear() === next.getFullYear() &&
                  prev.getMonth() === next.getMonth()
                    ? prev
                    : next,
                )
                // The feed anchor advances mid-scroll too, quantized to the
                // QUARTER (same functional-bail idiom as the month title, so
                // scrolling within a quarter never refilters/remaps the feed).
                // The patched calendar-kit packs its store live around the
                // visible date (ADR 032), so a no-pause fling can carry the
                // pack past windowStart's quarter+buffer before any settle —
                // crossing a quarter must shift the fed window right then, not
                // at rest, or the pack lands on days the prop never fed.
                setWindowStart((prev) =>
                  quarterStartMs(prev) === quarterStartMs(next) ? prev : next,
                )
              }}
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

// The grouped header actions (headerRight): Today + Add, each a distinct native
// nav-bar icon button — an expo-symbols SF Symbol on iOS, a themed text fallback on
// Android (the app's established icon idiom: a bare SF name resolves to null inside
// SymbolView on Android, so the platform gets an explicit fallback, mirroring
// school-selection/status-symbol + user-calendars/TrashAffordance). Two separate
// 44/48pt targets with real spacing so the pair never reads as one glued glyph (the
// device complaint). Today is always offered (a one-tap jump home). On Android the
// create action is a FAB, so Add renders here on iOS only.
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
      <HeaderIconAction
        testID="calendar-today"
        symbol="calendar"
        label={t("calendar.todayLabel")}
        androidText={t("calendar.today")}
        onPress={onToday}
      />
      {Platform.OS !== "android" && (
        <HeaderIconAction
          testID="calendar-add"
          symbol="plus"
          label={t("calendar.addLabel")}
          onPress={onAdd}
        />
      )}
    </View>
  )
}

// One nav-bar action. iOS renders a real SF Symbol (brand-tinted); Android renders
// a themed text label (a bare SF name renders blank inside SymbolView on Android).
// The 44pt (iOS) / 48dp (Android) target meets the platform minimum and gives the
// icons room so they don't touch; the accessible name is the translated action,
// never the glyph.
function HeaderIconAction({
  testID,
  symbol,
  label,
  androidText,
  onPress,
}: {
  testID: string
  symbol: SFSymbol
  label: string
  androidText?: string
  onPress: () => void
}) {
  const theme = useTheme()
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.headerAction}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name={symbol}
          size={HEADER_ICON_SIZE}
          tintColor={theme.primary}
        />
      ) : (
        // A Material text action, on-surface `text` (21:1) — NOT the brand
        // `primary`, which is a tint-only tone (#E91E63 on white = 4.35:1, below
        // the WCAG 1.4.3 4.5:1 body-text floor; theming.md's contrast block).
        <ThemedText type="smallBold" themeColor="text">
          {androidText}
        </ThemedText>
      )}
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
    // Two 44pt targets with a gap — the icons sit ~28px apart so the pair never
    // reads as one glued glyph (the cramped default the device showed).
    gap: Spacing.two,
  },
  // A nav-bar action target centring the glyph: 48dp on Android (Material 3
  // top-app-bar minimum), 44pt on iOS (Apple HIG minimum). The 44/48 frame IS the
  // touch target — no hitSlop (that would overlap the adjacent action across the
  // 8px gap and steal mis-aimed taps).
  headerAction: {
    minWidth: Platform.OS === "android" ? 48 : 44,
    minHeight: Platform.OS === "android" ? 48 : 44,
    alignItems: "center",
    justifyContent: "center",
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
