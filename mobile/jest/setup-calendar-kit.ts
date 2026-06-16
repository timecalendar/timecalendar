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
//  - CalendarContainer renders its children and stashes the passed `events` on
//    React context so the mocked CalendarBody can render them.
//  - CalendarHeader renders its children (a plain pass-through).
//  - CalendarBody invokes props.renderEvent(event, size) for EACH event in
//    context (size.width is a plain number so the tile's MIN_TILE_WIDTH /
//    show-text branch is exercised), rendering the real plain-View tile so the
//    screen's event→tile wiring + the CalendarEvent→EventItem mapping +
//    theme/label plumbing are provable without the Reanimated grid.
//
// The factory is deliberately plain JS (no TS type refs): a jest.mock factory may
// not reference out-of-scope variables, and the babel jest-hoist plugin flags TS
// type identifiers used inside it before they are stripped. react/react-native
// are require()d lazily inside the closure for the same reason.
jest.mock("@howljs/calendar-kit", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native")

  const EventsContext = React.createContext([])

  function CalendarContainer(props: {
    events?: unknown[]
    children?: unknown
  }) {
    return React.createElement(
      EventsContext.Provider,
      { value: props.events ?? [] },
      React.createElement(View, null, props.children),
    )
  }

  function CalendarHeader(props: { children?: unknown }) {
    return React.createElement(View, null, props.children)
  }

  function CalendarBody(props: {
    renderEvent?: (event: unknown, size: { width: number }) => unknown
  }) {
    const events = React.useContext(EventsContext)
    if (!props.renderEvent) {
      return React.createElement(View, null)
    }
    return React.createElement(
      View,
      null,
      events.map((event: { id?: string }, index: number) =>
        React.createElement(
          View,
          { key: event.id ?? String(index) },
          props.renderEvent!(event, { width: 100 }),
        ),
      ),
    )
  }

  return { __esModule: true, CalendarContainer, CalendarHeader, CalendarBody }
})
