import { act, fireEvent, render, screen } from "@testing-library/react-native"

import { type CalendarEvent } from "@/features/calendar/data"
import { type HourRange } from "@/features/home/data"

import { TodayTimeline } from "./today-timeline"

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
})
