import { cleanup, fireEvent, render } from "@testing-library/react-native"
import { fromZonedTime } from "date-fns-tz"
import * as Localization from "expo-localization"
import { StyleSheet } from "react-native"

import { usePersonalEvents } from "@/features/personal-events/data"
import { setTimezonePreference, SETTINGS_KEYS } from "@/features/settings/prefs"
import { remove } from "@/storage"
import { usePlatform } from "@/test-support/platform"
import { Layout, resolveResponsiveLayout } from "@/theme"

import { PersonalEventsList } from "./personal-events-list"

// Rows come from a mocked usePersonalEvents and copy from the real i18n tree.
// The iOS header item is asserted through Stack.Screen options because the
// navigator chrome is outside the rendered tree.
jest.mock("@/features/personal-events/data", () => ({
  usePersonalEvents: jest.fn(),
}))

const mockPush = jest.fn()
const mockScreenOptions = jest.fn()
jest.mock("expo-router", () => ({
  router: { push: (href: string) => mockPush(href) },
  Stack: {
    Screen: ({ options }: { options?: unknown }) => {
      mockScreenOptions(options)
      return null
    },
  },
}))

type HeaderOptions = {
  unstable_headerRightItems?: () => {
    identifier: string
    accessibilityLabel: string
    onPress: () => void
  }[]
}

const headerOptions = () =>
  mockScreenOptions.mock.lastCall?.[0] as HeaderOptions

const mockUsePersonalEvents = usePersonalEvents as jest.MockedFunction<
  typeof usePersonalEvents
>

describe("PersonalEventsList", () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockScreenOptions.mockClear()
  })

  afterEach(async () => {
    try {
      await cleanup()
    } finally {
      remove(SETTINGS_KEYS.timezone)
    }
  })

  it("shows the empty state title and caption within the readable lane", async () => {
    mockUsePersonalEvents.mockReturnValue([])
    const { getByText, getByTestId } = await render(<PersonalEventsList />)

    expect(getByText("No personal events")).toBeTruthy()
    expect(getByText("Events you add appear here.")).toBeTruthy()
    expect(getByTestId("personal-events-list")).toHaveProp(
      "contentInsetAdjustmentBehavior",
      "never",
    )

    const owner = getByTestId("personal-events-responsive-owner")
    for (const width of [390, 600, 768, 800, 834, 1024]) {
      await fireEvent(owner, "layout", {
        nativeEvent: { layout: { width, height: 0 } },
      })
      const metrics = resolveResponsiveLayout(width, "standard")
      const style = StyleSheet.flatten(
        getByTestId("personal-events-list").props.contentContainerStyle,
      )
      expect(style.maxWidth).toBe(
        (metrics.maxContentWidth ?? 0) + 2 * metrics.gutter,
      )
      expect(style.paddingHorizontal).toBe(metrics.gutter)
    }
  })

  describe("on iOS", () => {
    usePlatform("ios")

    it("adds through a header item and renders no in-content control", async () => {
      mockUsePersonalEvents.mockReturnValue([])
      const { getByTestId, queryByTestId } = await render(
        <PersonalEventsList />,
      )

      const items = headerOptions().unstable_headerRightItems?.() ?? []
      expect(items).toHaveLength(1)
      const [add] = items
      expect(add?.identifier).toBe("personal-events-add")
      expect(add?.accessibilityLabel).toBe("Add event")
      add?.onPress()
      expect(mockPush).toHaveBeenCalledWith("/personal-event-form")
      expect(queryByTestId("personal-events-add")).toBeNull()
      expect(
        StyleSheet.flatten(
          getByTestId("personal-events-list").props.contentContainerStyle,
        ).paddingBottom,
      ).not.toBe(Layout.fabClearance)
    })
  })

  describe("on Android", () => {
    usePlatform("android")

    it("adds through a FAB on the empty state and clears it at the list end", async () => {
      mockUsePersonalEvents.mockReturnValue([])
      const { getByLabelText, getByTestId } = await render(
        <PersonalEventsList />,
      )

      expect(headerOptions().unstable_headerRightItems).toBeUndefined()
      expect(getByLabelText("Add event")).toBeTruthy()
      await fireEvent.press(getByTestId("personal-events-add"))
      expect(mockPush).toHaveBeenCalledWith("/personal-event-form")
      expect(
        StyleSheet.flatten(
          getByTestId("personal-events-list").props.contentContainerStyle,
        ).paddingBottom,
      ).toBe(Layout.fabClearance)
    })
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
    const { getByText, getByTestId, queryByTestId } = await render(
      <PersonalEventsList />,
    )

    expect(getByText("Lunch")).toBeTruthy()
    expect(getByText("Office")).toBeTruthy()
    const row = getByTestId("personal-event-row-u1")
    expect(row.props.accessibilityRole).toBe("button")
    // The label is the bare title (matchable cross-platform); the edit affordance
    // is the hint.
    expect(row.props.accessibilityLabel).toBe("Lunch")
    expect(row.props.accessibilityHint).toBe("Opens the event to edit")
    expect(queryByTestId("personal-event-row-u1-color")).toBeNull()
    const dot = getByTestId("personal-event-row-u1-color", {
      includeHiddenElements: true,
    })
    expect(StyleSheet.flatten(dot.props.style)).toMatchObject({
      backgroundColor: "#E91E63",
      width: 16,
    })
    expect(dot.props.accessibilityElementsHidden).toBe(true)
    await fireEvent.press(row)
    expect(mockPush).toHaveBeenCalledWith("/personal-event-form?uid=u1")
    expect(getByTestId("personal-events-list")).toHaveProp(
      "contentInsetAdjustmentBehavior",
      "automatic",
    )
  })

  it("renders a 14:00 wall-clock entry as 14:00 under a worldwide display zone", async () => {
    // The D6 round-trip proof: an event created at 14:00 Kathmandu wall clock
    // (stored as its instant) reads back 14:00 in the list when the display
    // zone is the explicit Asia/Kathmandu preference — machine-TZ-independent.
    setTimezonePreference("Asia/Kathmandu")
    const startsAt = fromZonedTime("2030-01-01T14:00:00", "Asia/Kathmandu")
    const endsAt = fromZonedTime("2030-01-01T15:00:00", "Asia/Kathmandu")
    mockUsePersonalEvents.mockReturnValue([
      {
        uid: "u1",
        title: "Lunch",
        color: "#E91E63",
        startsAt,
        endsAt,
        exportedAt: startsAt,
        location: undefined,
        description: undefined,
      },
    ])
    const { getByText } = await render(<PersonalEventsList />)

    expect(getByText("1 Jan 14:00 – 1 Jan 15:00")).toBeTruthy()
  })

  it("renders 12-hour ranges on a 12-hour device", async () => {
    const spy = jest.spyOn(Localization, "useCalendars").mockReturnValue([
      {
        calendar: "gregory",
        uses24hourClock: false,
        firstWeekday: 1,
        timeZone: null,
      },
    ] as unknown as ReturnType<typeof Localization.useCalendars>)
    try {
      setTimezonePreference("Asia/Kathmandu")
      const startsAt = fromZonedTime("2030-01-01T14:00:00", "Asia/Kathmandu")
      const endsAt = fromZonedTime("2030-01-01T15:00:00", "Asia/Kathmandu")
      mockUsePersonalEvents.mockReturnValue([
        {
          uid: "u1",
          title: "Lunch",
          color: "#E91E63",
          startsAt,
          endsAt,
          exportedAt: startsAt,
          location: undefined,
          description: undefined,
        },
      ])
      const { getByText } = await render(<PersonalEventsList />)

      expect(getByText("1 Jan 2:00 PM – 1 Jan 3:00 PM")).toBeTruthy()
    } finally {
      spy.mockRestore()
    }
  })
})
