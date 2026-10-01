import { render, screen, within } from "@testing-library/react-native"

import { OwnedCalendarShell } from "@/features/calendar/renderer"
import i18n from "@/i18n"

import { pageIndexOfInstant, type PageSpace } from "./page-index"
import { buildPagePresentation } from "./page-presentation"
import { planCalendarThreePageRange } from "./range-plan"
import { buildCalendarTimelinePresentation } from "./timeline-presentation"
import type { TimedCalendarEventV1 } from "./types"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(() => "light"),
}))

function event(
  uid: string,
  startsAt: string,
  minutes: number,
  location: string | undefined = "B12",
): TimedCalendarEventV1 {
  return {
    version: 1,
    kind: "timed",
    allDay: false,
    identity: { source: "synced", uid },
    id: uid,
    title: `Course ${uid}`,
    color: "#112233",
    startsAt: new Date(startsAt),
    endsAt: new Date(new Date(startsAt).getTime() + minutes * 60_000),
    location,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "calendar-1",
  }
}

describe("page presentation labels match what the owned shell renders", () => {
  it("for tiles, checklist progress and date headers of the settled page", async () => {
    const anchor = new Date("2026-06-15T00:00:00.000Z")
    const events = [
      event("a", "2026-06-15T08:00:00.000Z", 120),
      event("b", "2026-06-15T09:00:00.000Z", 60, undefined),
      event("c", "2026-06-17T13:15:00.000Z", 45),
      event("previous", "2026-06-10T08:00:00.000Z", 60),
    ]
    const checklist = new Map([
      ["a", { completed: 1, total: 3, isComplete: false }],
      ["c", { completed: 2, total: 2, isComplete: true }],
    ])
    const range = planCalendarThreePageRange({
      anchor,
      mode: "week",
      displayZone: "UTC",
      firstWeekday: 1,
      showWeekends: true,
    })
    const presentation = buildCalendarTimelinePresentation({
      range,
      generation: 0,
      events,
      checklistProgress: checklist,
      localizedNoTitle: i18n.t("calendar.event.noTitle"),
    })
    await render(
      <OwnedCalendarShell
        heading="Monday, June 15th, 2026"
        mode="week"
        anchor={anchor}
        displayZone="UTC"
        locale="en"
        firstWeekday={1}
        showWeekends
        currentDate={new Date("2026-08-01T12:00:00.000Z")}
        uses24HourClock
        initialVerticalOffset={0}
        initialPixelsPerHour={60}
        generation={0}
        revisionFloor={0}
        presentation={presentation}
        onTransitionRequest={jest.fn()}
        onTransitionSettled={jest.fn()}
        onTransitionCancelled={jest.fn()}
        onVerticalOffsetSettled={jest.fn()}
        onZoomSettled={jest.fn()}
      />,
    )

    const space: PageSpace = { mode: "week", firstWeekday: 1 }
    const page = buildPagePresentation({
      space,
      index: pageIndexOfInstant(space, anchor, "UTC"),
      status: "ready",
      events,
      checklist,
      environment: {
        locale: "en",
        displayZone: "UTC",
        showWeekends: true,
        scheme: "light",
        increasedContrast: false,
        localizedNoTitle: i18n.t("calendar.event.noTitle"),
        t: i18n.t,
      },
    })

    const tiles = page.columns.flatMap((column) => column.tiles)
    expect(tiles).toHaveLength(3)
    for (const tile of tiles) {
      const anchorView = screen.getByTestId(
        `owned-calendar-event-${tile.identity.uid}`,
      )
      expect(
        within(anchorView).getByRole("button").props.accessibilityLabel,
      ).toBe(tile.accessibilityLabel)
    }
    for (const column of page.columns) {
      expect(
        screen.getByTestId(`owned-calendar-date-0-${column.key}`).props
          .accessibilityLabel,
      ).toBe(column.header.label)
    }
  })
})
