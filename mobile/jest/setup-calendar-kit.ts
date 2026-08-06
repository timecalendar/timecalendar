// Mock @howljs/calendar-kit for the whole suite: it is the calendar-kit chrome
// seam's dependency, a Reanimated/worklet-saturated grid with no meaningful
// off-device runtime (it needs the worklet runtime + a gesture-handler root), so
// importing the calendar screen (which reaches calendar-kit through the chrome
// wrapper) would otherwise throw under Jest — exactly the setup-expo-ui /
// setup-expo-camera situation. Registered globally; mock at the library seam so
// the proof test exercises the real screen → chrome wrapper → mapping/theme path
// (D7 — mirrors the "mock at the customFetch seam" posture).
//
// The mock reproduces ENOUGH of the API SHAPE to prove OUR wiring:
//  - CalendarContainer renders its children and stashes the passed `events` +
//    `onPressEvent` on React context so the mocked CalendarBody can render them
//    and wire the press path.
//  - CalendarHeader renders its children (a plain pass-through).
//  - CalendarBody invokes props.renderEvent(event, size) for EACH event in
//    context (size.width is a plain number so the tile's MIN_TILE_WIDTH /
//    show-text branch is exercised), wrapping each rendered tile in a Pressable
//    that calls the container's onPressEvent(event) — so the grid press→route
//    wiring is provable without the Reanimated grid (the real grid wires the
//    press itself; here the Pressable stands in for it). The CalendarEvent→
//    EventItem mapping + theme/label plumbing are exercised the same way.
//
// The factory is deliberately plain JS (no TS type refs): a jest.mock factory may
// not reference out-of-scope variables, and the babel jest-hoist plugin flags TS
// type identifiers used inside it before they are stripped. react/react-native
// are require()d lazily inside the closure for the same reason.
jest.mock("@howljs/calendar-kit", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, View } = require("react-native")

  const GridContext = React.createContext({
    events: [],
    onPressEvent: undefined,
  })

  // forwardRef so the screen's gridRef resolves to a handle (no "function
  // components cannot be given refs" warning) and its "Today" action can call
  // goToDate. The mocked grid can't scroll, so goToDate is a no-op; the screen's
  // observable effect (the windowStart reset that recentres the loaded range) is
  // what the test asserts.
  const CalendarContainer = React.forwardRef(function CalendarContainer(
    props: {
      events?: unknown[]
      onPressEvent?: (event: unknown) => void
      onChange?: (date: string) => void
      onDateChanged?: (date: string) => void
      children?: unknown
    },
    ref: unknown,
  ) {
    const [goToDateValue, setGoToDateValue] = React.useState("")
    React.useImperativeHandle(
      ref,
      () => ({
        goToDate: (options: unknown) =>
          setGoToDateValue(JSON.stringify(options)),
      }),
      [],
    )
    // Two stand-ins for the real grid's Reanimated scroll, mirroring calendar-kit's
    // two callbacks (useSyncedList): `onChange` fires IMMEDIATELY on every visible-
    // column change during a scroll; `onDateChanged` fires once the scroll SETTLES
    // (debounced). "grid-date-change" models a settled scroll — it fires BOTH (the
    // month title tracks via onChange, the settled anchor/range via onDateChanged).
    // "grid-visible-change" models a mid-scroll tick — onChange ONLY — proving the
    // title updates before settle (Issue 6) without moving the events range.
    const settledScrollTrigger =
      props.onChange || props.onDateChanged
        ? React.createElement(Pressable, {
            testID: "grid-date-change",
            onPress: () => {
              props.onChange?.("2026-08-01T00:00:00.000Z")
              props.onDateChanged?.("2026-08-01T00:00:00.000Z")
            },
          })
        : null
    const visibleChangeTrigger = props.onChange
      ? React.createElement(Pressable, {
          testID: "grid-visible-change",
          onPress: () => props.onChange!("2026-09-01T00:00:00.000Z"),
        })
      : null
    // A settled scroll to a date in a DIFFERENT calendar quarter (Q4) than the
    // suite's ~mount date — so the grid feed's quarter bucket actually SHIFTS,
    // proving the onDateChanged → windowStart → bucketMs → gridRange wiring end to
    // end (grid-date-change lands in the same quarter as mount, so it can't).
    const crossQuarterTrigger = props.onDateChanged
      ? React.createElement(Pressable, {
          testID: "grid-cross-quarter",
          onPress: () => {
            props.onChange?.("2026-11-15T12:00:00.000Z")
            props.onDateChanged!("2026-11-15T12:00:00.000Z")
          },
        })
      : null
    // A mid-scroll tick (onChange ONLY, no settle) into a DIFFERENT quarter —
    // proving the feed window shifts DURING a no-pause fling across a quarter
    // boundary (the patched calendar-kit packs live around the visible date, so
    // waiting for settle would starve the pack past the fed quarter+buffer).
    // Q1 2027 — a different quarter than grid-cross-quarter's Q4 2026, so a
    // test can settle to Q4 first and make the mid-scroll shift clock-robust
    // (the real-clock mount quarter never matters).
    const visibleCrossQuarterTrigger = props.onChange
      ? React.createElement(Pressable, {
          testID: "grid-visible-cross-quarter",
          onPress: () => props.onChange!("2027-02-10T12:00:00.000Z"),
        })
      : null
    return React.createElement(
      GridContext.Provider,
      {
        value: { events: props.events ?? [], onPressEvent: props.onPressEvent },
      },
      React.createElement(
        View,
        null,
        React.createElement(View, {
          testID: "grid-go-to-date",
          accessibilityLabel: goToDateValue,
        }),
        props.children,
        settledScrollTrigger,
        visibleChangeTrigger,
        crossQuarterTrigger,
        visibleCrossQuarterTrigger,
      ),
    )
  })

  // A pressable event tile row: render each matching event through renderEvent and
  // wire the press → the container's onPressEvent (the real grid wires the press
  // itself; the Pressable stands in for it). Shared by the all-day lane
  // (CalendarHeader) and the timed grid (CalendarBody).
  function renderEventRow(
    events: { id?: string }[],
    onPressEvent: ((event: unknown) => void) | undefined,
    renderEvent: (event: unknown, size: { width: number }) => unknown,
  ) {
    return events.map((event: { id?: string }, index: number) =>
      React.createElement(
        Pressable,
        {
          key: event.id ?? String(index),
          testID: `grid-event-${event.id ?? String(index)}`,
          onPress: onPressEvent ? () => onPressEvent(event) : undefined,
        },
        renderEvent(event, { width: 100 }),
      ),
    )
  }

  // Whether calendar-kit lanes an event into the all-day ROW. The real rule
  // (eventUtils.js filterEvents:63) is `isAllDay || duration >= MINUTES_IN_DAY` —
  // i.e. a date-only event OR any TIMED event spanning ≥ 24h. Mirror BOTH so a long
  // timed event lands where it does on device (the header), exercising AllDayTile's
  // real-flag label branch rather than a date-only-only partition.
  const DAY_MS = 24 * 60 * 60 * 1000
  function isAllDayLaned(event: {
    start?: { date?: string }
    startsAt?: Date
    endsAt?: Date
  }): boolean {
    if (event.start?.date !== undefined) return true
    const { startsAt, endsAt } = event
    return (
      startsAt instanceof Date &&
      endsAt instanceof Date &&
      endsAt.getTime() - startsAt.getTime() >= DAY_MS
    )
  }

  // The all-day LANE: calendar-kit invokes CalendarHeader's renderEvent for each
  // laned event (PackedAllDayEvent). The mock mirrors the laning rule so the
  // screen's all-day mapping + tile are provable.
  function CalendarHeader(props: {
    children?: unknown
    renderEvent?: (event: unknown, size: { width: number }) => unknown
  }) {
    const { events, onPressEvent } = React.useContext(GridContext)
    const allDay = events.filter(isAllDayLaned)
    return React.createElement(
      View,
      null,
      props.children,
      props.renderEvent
        ? renderEventRow(allDay, onPressEvent, props.renderEvent)
        : null,
    )
  }

  // The timed GRID: the events NOT laned into the all-day row above.
  function CalendarBody(props: {
    renderEvent?: (event: unknown, size: { width: number }) => unknown
  }) {
    const { events, onPressEvent } = React.useContext(GridContext)
    if (!props.renderEvent) {
      return React.createElement(View, null)
    }
    const timed = events.filter(
      (event: { start?: { date?: string } }) => !isAllDayLaned(event),
    )
    return React.createElement(
      View,
      null,
      renderEventRow(timed, onPressEvent, props.renderEvent),
    )
  }

  return { __esModule: true, CalendarContainer, CalendarHeader, CalendarBody }
})
