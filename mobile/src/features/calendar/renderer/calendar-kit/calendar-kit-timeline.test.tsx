import { render, screen } from "@testing-library/react-native"

import type { CalendarEvent } from "@/features/calendar/data"

import { CalendarKitTimeline } from "./calendar-kit-timeline"

const mockProjectedArrays: unknown[][] = []

jest.mock("./vendor", () => {
  const React = jest.requireActual<typeof import("react")>("react")
  const Context = React.createContext<unknown[]>([])
  const CalendarContainer = React.forwardRef(function MockCalendarContainer(
    props: { events: unknown[]; children: React.ReactNode },
    _ref: React.ForwardedRef<unknown>,
  ) {
    mockProjectedArrays.push(props.events)
    return (
      <Context.Provider value={props.events}>{props.children}</Context.Provider>
    )
  })
  const CalendarHeader = () => null
  const CalendarBody = ({
    renderEvent,
  }: {
    renderEvent: (event: unknown, size: { width: number }) => React.ReactNode
  }) => {
    const events = React.useContext(Context)
    return (
      <>
        {events.map((event, index) => (
          <React.Fragment key={index}>
            {renderEvent(event, { width: 100 })}
          </React.Fragment>
        ))}
      </>
    )
  }
  return { CalendarContainer, CalendarHeader, CalendarBody }
})

const source: CalendarEvent = {
  id: "event-1",
  title: "Algorithms",
  color: "#123456",
  startsAt: new Date(2026, 5, 25, 9),
  endsAt: new Date(2026, 5, 25, 10),
  location: "A1",
  allDay: false,
  description: undefined,
  teachers: [],
  tags: [],
  canceled: false,
  userCalendarId: undefined,
}

const baseProps = {
  mode: "week" as const,
  anchorDate: new Date(2026, 5, 25),
  displayZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  events: [source],
  startMinute: 7 * 60,
  endMinute: 21 * 60,
  showWeekends: true,
  bottomInset: 0,
  onVisibleDateChange: jest.fn(),
  onSettledDateChange: jest.fn(),
  onPressEvent: jest.fn(),
}

describe("CalendarKitTimeline progress sidecar", () => {
  beforeEach(() => mockProjectedArrays.splice(0))

  it("updates tile progress while retaining the projected event array and object identity", async () => {
    const view = await render(
      <CalendarKitTimeline
        {...baseProps}
        checklistProgress={
          new Map([["event-1", { completed: 0, total: 1, isComplete: false }]])
        }
      />,
    )
    const firstArray = mockProjectedArrays.at(-1)
    const firstEvent = firstArray?.[0]
    expect(
      screen.getByText("0/1", { includeHiddenElements: true }),
    ).toBeTruthy()

    await view.rerender(
      <CalendarKitTimeline
        {...baseProps}
        checklistProgress={
          new Map([["event-1", { completed: 1, total: 1, isComplete: true }]])
        }
      />,
    )
    const secondArray = mockProjectedArrays.at(-1)

    expect(
      screen.getByText("1/1", { includeHiddenElements: true }),
    ).toBeTruthy()
    expect(secondArray).toBe(firstArray)
    expect(secondArray?.[0]).toBe(firstEvent)
  })
})
