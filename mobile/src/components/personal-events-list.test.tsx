import { render } from "@testing-library/react-native"

import { usePersonalEvents } from "@/features/personal-events/data"

import { PersonalEventsList } from "./personal-events-list"

// Presentational (70% floor): renders rows from a mocked usePersonalEvents, the
// localized empty state when empty, and the accessible Add control. Localized
// copy resolves through the real i18n tree. expo-router's Link is stubbed (no
// router context under Jest) — it just renders its child so the Pressable's
// a11y props are assertable.
jest.mock("@/features/personal-events/data", () => ({
  usePersonalEvents: jest.fn(),
}))

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: unknown }) => children,
}))

const mockUsePersonalEvents = usePersonalEvents as jest.MockedFunction<
  typeof usePersonalEvents
>

describe("PersonalEventsList", () => {
  it("shows the localized empty state and an accessible Add control when empty", async () => {
    mockUsePersonalEvents.mockReturnValue([])
    const { getByText, getByTestId } = await render(<PersonalEventsList />)

    expect(getByText("No events yet. Tap Add to create one.")).toBeTruthy()
    const add = getByTestId("personal-events-add")
    expect(add.props.accessibilityRole).toBe("button")
    expect(add.props.accessibilityLabel).toBe("Add event")
  })

  it("renders a row per event with title and an accessible edit label", async () => {
    mockUsePersonalEvents.mockReturnValue([
      {
        uid: "u1",
        title: "Lunch",
        color: "#E91E63",
        startsAt: new Date("2030-01-01T10:00:00.000Z"),
        endsAt: new Date("2030-01-01T11:00:00.000Z"),
        exportedAt: new Date("2030-01-01T09:00:00.000Z"),
        location: "Office",
        description: undefined,
      },
    ])
    const { getByText, getByTestId } = await render(<PersonalEventsList />)

    expect(getByText("Lunch")).toBeTruthy()
    expect(getByText("Office")).toBeTruthy()
    const row = getByTestId("personal-event-row-u1")
    expect(row.props.accessibilityRole).toBe("button")
    // The label is the bare title (matchable cross-platform); the edit affordance
    // is the hint.
    expect(row.props.accessibilityLabel).toBe("Lunch")
    expect(row.props.accessibilityHint).toBe("Opens the event to edit")
  })
})
