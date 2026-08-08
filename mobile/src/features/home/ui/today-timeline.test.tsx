import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { type CalendarEvent } from "@/features/calendar/data"
import { type HourRange } from "@/features/home/data"

import { TodayTimeline } from "./today-timeline"

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 400, height: 800, scale: 2, fontScale: 1 }),
}))

// Presentational (70% floor): the today mini-timeline. The salvaged overlap/grid
// math has its own data-layer tests; here we assert tile placement reacts to the
// MEASURED tile-area width (R-3 responsiveness) instead of a fixed px multiplier,
// and that taps route through.

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  const start = new Date(2026, 5, 15, 9, 0, 0, 0)
  const end = new Date(2026, 5, 15, 10, 0, 0, 0)
  return {
    id: "ev-1",
    title: "Algorithms",
    color: "#1E88E5",
    startsAt: start,
    endsAt: end,
    location: "Room A1",
    allDay: false,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: undefined,
    ...overrides,
  }
}

const range: HourRange = { startHour: 7, endHour: 21 }

// Fixtures above are device-local Dates; the machine zone preserves their
// intent on any CI host. The now-indicator zone proof pins Nouméa below.
const ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

function tileWidth(): number {
  const style = screen.getByTestId("today-tile-ev-1").props.style
  const flat = Array.isArray(style) ? Object.assign({}, ...style) : style
  return flat.width as number
}

async function reportTileAreaWidth(width: number) {
  await act(async () => {
    fireEvent(screen.getByTestId("today-tile-area"), "layout", {
      nativeEvent: { layout: { width, height: 0 } },
    })
  })
}

describe("TodayTimeline", () => {
  it("scales a full-width tile to the measured tile-area width", async () => {
    await render(
      <TodayTimeline
        events={[event()]}
        range={range}
        locale="en"
        displayZone={ZONE}
        isToday={false}
        now={new Date(2026, 5, 15, 9, 30, 0, 0)}
        onPressEvent={jest.fn()}
      />,
    )
    // A sensible (non-zero) fallback width is used before any layout pass.
    expect(tileWidth()).toBeGreaterThan(0)

    // After the tile area reports a real width, the single full-width event fills it.
    await reportTileAreaWidth(400)
    expect(tileWidth()).toBe(400)

    // A wider device → a wider tile (the px multiplier is dynamic, not fixed).
    await reportTileAreaWidth(700)
    expect(tileWidth()).toBe(700)
  })

  it("fires the press handler with the tapped event", async () => {
    const onPress = jest.fn()
    await render(
      <TodayTimeline
        events={[event()]}
        range={range}
        locale="en"
        displayZone={ZONE}
        isToday={false}
        now={new Date(2026, 5, 15, 9, 30, 0, 0)}
        onPressEvent={onPress}
      />,
    )
    fireEvent.press(screen.getByTestId("today-tile-ev-1"))
    expect(onPress).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ev-1" }),
    )
  })

  it("reflows short events into full-size list controls", async () => {
    const short = event({
      endsAt: new Date(2026, 5, 15, 9, 15),
    })
    await render(
      <TodayTimeline
        events={[short]}
        range={{ startHour: 9, endHour: 10 }}
        locale="en"
        displayZone={ZONE}
        isToday={false}
        now={new Date(2026, 5, 15, 8)}
        onPressEvent={jest.fn()}
      />,
    )
    expect(screen.getByTestId("today-timeline-list")).toBeTruthy()
    const style = StyleSheet.flatten(
      screen.getByTestId("today-tile-ev-1").props.style,
    )
    expect(style.minHeight).toBeGreaterThanOrEqual(44)
  })

  it("places the now indicator at the DISPLAY zone's minute-of-day", async () => {
    // 22:30Z = 09:30 in Nouméa (UTC+11): 2.5h past the 7:00 window start at
    // 70px/h → 175px, regardless of the machine TZ.
    const noumeaNow = new Date("2026-06-15T22:30:00.000Z")
    await render(
      <TodayTimeline
        events={[
          event({
            startsAt: new Date("2026-06-15T22:00:00.000Z"),
            endsAt: new Date("2026-06-15T23:00:00.000Z"),
          }),
        ]}
        range={range}
        locale="en"
        displayZone="Pacific/Noumea"
        isToday
        now={noumeaNow}
        onPressEvent={jest.fn()}
      />,
    )
    const style = StyleSheet.flatten(
      screen.getByTestId("today-now-indicator").props.style,
    )
    expect(style.top).toBe(175)
  })

  it("clips a cross-midnight event to the represented day", async () => {
    await render(
      <TodayTimeline
        events={[
          event({
            startsAt: new Date(2026, 5, 15, 23),
            endsAt: new Date(2026, 5, 16, 1),
          }),
        ]}
        range={{ startHour: 23, endHour: 24 }}
        locale="en"
        displayZone={ZONE}
        isToday={false}
        now={new Date(2026, 5, 15, 20)}
        onPressEvent={jest.fn()}
      />,
    )
    const style = StyleSheet.flatten(
      screen.getByTestId("today-tile-ev-1").props.style,
    )
    expect(style.top + style.height).toBeLessThanOrEqual(70)
  })
})
