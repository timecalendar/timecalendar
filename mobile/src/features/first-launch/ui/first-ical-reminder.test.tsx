import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"
import { Platform, StyleSheet } from "react-native"

import {
  getFirstIcalReminderState,
  getOnboardingResolution,
  setOnboardingResolution,
} from "@/features/first-launch/store"
import { remove, STORAGE_KEYS } from "@/storage"

import { FirstIcalReminder } from "./first-ical-reminder"

let mockCalendarState = { calendars: [] as { id: string }[], loaded: true }
jest.mock("@/features/calendar-sources", () => ({
  useUserCalendarsState: () => mockCalendarState,
}))
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

const mockPush = router.push as jest.Mock

beforeEach(() => {
  remove(STORAGE_KEYS.onboardingResolution)
  remove(STORAGE_KEYS.firstIcalReminderState)
  mockCalendarState = { calendars: [], loaded: true }
  mockPush.mockReset()
})

describe("FirstIcalReminder", () => {
  it("covers unresolved, onboarding, zero-calendar, and imported visibility", async () => {
    const view = await render(<FirstIcalReminder />)
    expect(view.queryByTestId("first-ical-reminder")).toBeNull()

    await act(async () => setOnboardingResolution("skipped"))
    await view.rerender(<FirstIcalReminder />)
    expect(view.getByTestId("first-ical-reminder")).toBeTruthy()

    mockCalendarState = { calendars: [{ id: "calendar-1" }], loaded: true }
    await view.rerender(<FirstIcalReminder />)
    expect(view.queryByTestId("first-ical-reminder")).toBeNull()

    mockCalendarState = { calendars: [], loaded: false }
    await view.rerender(<FirstIcalReminder />)
    expect(view.queryByTestId("first-ical-reminder")).toBeNull()
  })

  it("routes import through the existing school journey", async () => {
    setOnboardingResolution("skipped")
    const view = await render(<FirstIcalReminder />)

    await fireEvent.press(view.getByTestId("first-ical-reminder-import"))
    expect(mockPush).toHaveBeenCalledWith("/onboarding/school")
  })

  it("cancels or confirms dismissal without changing onboarding", async () => {
    setOnboardingResolution("skipped")
    const view = await render(<FirstIcalReminder />)

    await fireEvent.press(view.getByTestId("first-ical-reminder-dismiss"))
    await fireEvent.press(view.getByTestId("import-later-cancel"))
    expect(getFirstIcalReminderState()).toBe("pending")
    expect(view.getByTestId("first-ical-reminder")).toBeTruthy()

    await fireEvent.press(view.getByTestId("first-ical-reminder-dismiss"))
    await fireEvent.press(view.getByTestId("import-later-confirm"))
    expect(getFirstIcalReminderState()).toBe("dismissed")
    expect(getOnboardingResolution()).toBe("skipped")
    expect(view.queryByTestId("first-ical-reminder")).toBeNull()

    const relaunched = await render(<FirstIcalReminder />)
    expect(relaunched.queryByTestId("first-ical-reminder")).toBeNull()
  })

  it("uses wrapping text and platform-sized controls for small screens", async () => {
    setOnboardingResolution("calendarImported")
    const view = await render(<FirstIcalReminder />)

    expect(
      view.getByRole("header", { name: "Import your first iCal" }),
    ).toBeTruthy()
    expect(
      view.getByText("Import your first iCal").props.allowFontScaling,
    ).not.toBe(false)
    expect(
      StyleSheet.flatten(
        view.getByTestId("first-ical-reminder-import").props.style,
      ).minHeight,
    ).toBe(Platform.OS === "ios" ? 44 : 48)
  })
})
