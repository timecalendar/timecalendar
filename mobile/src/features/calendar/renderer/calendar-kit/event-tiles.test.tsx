import { render, screen } from "@testing-library/react-native"

import { CalendarKitAllDayTile, CalendarKitEventTile } from "./event-tiles"
import { type EventItem } from "./vendor"

function event(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: "event-1",
    title: "Algorithms",
    color: "#123456",
    location: "A1",
    allDay: false,
    startsAt: new Date(2026, 5, 25, 9),
    endsAt: new Date(2026, 5, 25, 10),
    start: { dateTime: "2026-06-25T09:00:00.000Z" },
    end: { dateTime: "2026-06-25T10:00:00.000Z" },
    ...overrides,
  } as EventItem
}

const ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

describe("CalendarKit checklist progress tiles", () => {
  it("keeps compact partial progress meaningful at the minimum dense width", async () => {
    await render(
      <CalendarKitEventTile
        event={event()}
        width={1}
        locale="en"
        zone={ZONE}
        progress={{ completed: 1, total: 4, isComplete: false }}
      />,
    )

    expect(screen.queryByText("Algorithms")).toBeNull()
    expect(
      screen.getByText("1/4", { includeHiddenElements: true }),
    ).toBeTruthy()
    expect(
      screen.getByLabelText(/1 of 4 checklist items completed/),
    ).toBeTruthy()
  })

  it("shows explicit complete progress on an all-day tile", async () => {
    await render(
      <CalendarKitAllDayTile
        event={event({ allDay: true })}
        locale="en"
        zone={ZONE}
        progress={{ completed: 2, total: 2, isComplete: true }}
      />,
    )

    expect(
      screen.getByText("2/2", { includeHiddenElements: true }),
    ).toBeTruthy()
    expect(
      screen.getByLabelText(/2 of 2 checklist items completed/),
    ).toBeTruthy()
  })

  it("renders no progress or progress phrase for zero rows", async () => {
    await render(
      <CalendarKitEventTile
        event={event()}
        width={100}
        locale="en"
        zone={ZONE}
        progress={undefined}
      />,
    )

    expect(screen.queryByTestId("checklist-progress-compact")).toBeNull()
    expect(screen.getByLabelText(/^Algorithms,/)).toBeTruthy()
    expect(screen.queryByLabelText(/checklist items completed/)).toBeNull()
  })
})
