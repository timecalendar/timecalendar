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

  function CalendarContainer(props: {
    events?: unknown[]
    onPressEvent?: (event: unknown) => void
    children?: unknown
  }) {
    return React.createElement(
      GridContext.Provider,
      {
        value: { events: props.events ?? [], onPressEvent: props.onPressEvent },
      },
      React.createElement(View, null, props.children),
    )
  }

  function CalendarHeader(props: { children?: unknown }) {
    return React.createElement(View, null, props.children)
  }

  function CalendarBody(props: {
    renderEvent?: (event: unknown, size: { width: number }) => unknown
  }) {
    const { events, onPressEvent } = React.useContext(GridContext)
    if (!props.renderEvent) {
      return React.createElement(View, null)
    }
    return React.createElement(
      View,
      null,
      events.map((event: { id?: string }, index: number) =>
        React.createElement(
          Pressable,
          {
            key: event.id ?? String(index),
            testID: `grid-event-${event.id ?? String(index)}`,
            onPress: onPressEvent ? () => onPressEvent(event) : undefined,
          },
          props.renderEvent!(event, { width: 100 }),
        ),
      ),
    )
  }

  return { __esModule: true, CalendarContainer, CalendarHeader, CalendarBody }
})
