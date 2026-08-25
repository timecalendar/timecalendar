import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import { useAddCalendar } from "@/features/calendar-sources/data"
import { useSchools, useSelectedSchool } from "@/features/school-selection"
import { recordUnknownError } from "@/firebase"

import IcalUrlScreen from "./ical-url-screen"

// Presentational (70% floor): renders through the real theme + i18n trees. Mocks
// the shared durable persist seam (useAddCalendar — its own success/failure is
// proven in data/user-calendars/add-calendar.test.ts against the customFetch
// mutator) and the @/firebase recordError. Asserts: the happy path (valid URL →
// addCalendarFromUrl resolves → dismiss), the inline-validation path (no persist,
// no recordError), and the persist-failure path (recordError with the ical-import
// context + an accessible error + Retry).
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
}))
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual("@/features/calendar-sources/data"),
  useAddCalendar: jest.fn(),
}))
jest.mock("@/features/school-selection", () => ({
  useSchools: jest.fn(),
  useSelectedSchool: jest.fn(),
}))

const mockBack = router.back as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock
const mockUseAddCalendar = useAddCalendar as jest.Mock
const mockUseSchools = useSchools as jest.Mock
const mockUseSelectedSchool = useSelectedSchool as jest.Mock
const mockAddCalendarFromUrl = jest.fn<Promise<void>, [string]>()
const mockReset = jest.fn()

let addState: { isPending: boolean; isError: boolean }

beforeEach(() => {
  jest.clearAllMocks()
  addState = { isPending: false, isError: false }
  mockUseAddCalendar.mockImplementation(() => ({
    addCalendarFromUrl: mockAddCalendarFromUrl,
    reset: mockReset,
    ...addState,
  }))
  mockUseSchools.mockReturnValue({ schools: [] })
  mockUseSelectedSchool.mockReturnValue(undefined)
})

describe("IcalUrlScreen", () => {
  it("renders the localized title, field label, and submit (not raw keys)", async () => {
    const { getByText } = await render(<IcalUrlScreen />)

    expect(getByText("Add a calendar by URL")).toBeTruthy()
    expect(getByText("Calendar URL")).toBeTruthy()
    expect(getByText("Import")).toBeTruthy()
  })

  it("imports a valid URL: persists the durable row, dismisses", async () => {
    mockAddCalendarFromUrl.mockResolvedValue(undefined)
    const { getByTestId } = await render(<IcalUrlScreen />)

    await act(async () => {
      fireEvent.changeText(
        getByTestId("ical-url-input"),
        "  https://example.com/cal.ics  ",
      )
    })
    await act(async () => {
      fireEvent.press(getByTestId("ical-url-submit"))
    })

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
    expect(mockAddCalendarFromUrl).toHaveBeenCalledWith(
      "  https://example.com/cal.ics  ",
    )
    expect(mockReset).toHaveBeenCalledTimes(1)
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("shows the inline validation error and does not persist on empty", async () => {
    const { getByTestId, getByText } = await render(<IcalUrlScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("ical-url-submit"))
    })

    expect(getByText("Enter a calendar URL.")).toBeTruthy()
    expect(mockAddCalendarFromUrl).not.toHaveBeenCalled()
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("shows the inline invalid error for a non-URL value", async () => {
    const { getByTestId, getByText } = await render(<IcalUrlScreen />)

    await act(async () => {
      fireEvent.changeText(getByTestId("ical-url-input"), "not a url")
    })
    await act(async () => {
      fireEvent.press(getByTestId("ical-url-submit"))
    })

    expect(getByText("Enter a valid http or https URL.")).toBeTruthy()
    expect(mockAddCalendarFromUrl).not.toHaveBeenCalled()
  })

  it("records the error and shows an accessible error + retry on persist failure", async () => {
    mockAddCalendarFromUrl.mockRejectedValue(new Error("boom"))
    addState = { isPending: false, isError: true }
    const { getByTestId, getByText } = await render(<IcalUrlScreen />)

    await act(async () => {
      fireEvent.changeText(
        getByTestId("ical-url-input"),
        "https://example.com/cal.ics",
      )
    })
    await act(async () => {
      fireEvent.press(getByTestId("ical-url-submit"))
    })

    await waitFor(() =>
      expect(mockRecordUnknownError).toHaveBeenCalledWith(
        expect.any(Error),
        "calendar-sources/ical-import",
      ),
    )
    expect(
      getByText(
        "We couldn't import that calendar. Check the URL and try again.",
      ),
    ).toBeTruthy()
    expect(getByTestId("ical-url-retry")).toBeTruthy()
    expect(getByTestId("ical-url-report")).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()

    // Retry re-runs the add; this time it resolves and dismisses.
    mockAddCalendarFromUrl.mockResolvedValue(undefined)
    await act(async () => {
      fireEvent.press(getByTestId("ical-url-retry"))
    })
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
  })

  it("reports only a recorded failure with available school context", async () => {
    addState = { isPending: false, isError: true }
    mockAddCalendarFromUrl.mockRejectedValue(new Error("boom"))
    mockUseSelectedSchool.mockReturnValue({
      schoolId: "school-1",
      groupValues: [],
    })
    mockUseSchools.mockReturnValue({
      schools: [
        { id: "school-1", name: "Université", code: "U", imageUrl: "" },
      ],
    })
    const { getByTestId } = await render(<IcalUrlScreen />)
    await act(async () => {
      fireEvent.changeText(
        getByTestId("ical-url-input"),
        "  https://example.com/cal.ics  ",
      )
    })
    await act(async () => fireEvent.press(getByTestId("ical-url-submit")))
    await waitFor(() => expect(getByTestId("ical-url-report")).toBeTruthy())
    await act(async () => {
      fireEvent.changeText(
        getByTestId("ical-url-input"),
        "https://example.com/never-failed.ics",
      )
    })
    await act(async () => fireEvent.press(getByTestId("ical-url-report")))
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/feedback",
      params: {
        calendarUrl: "https://example.com/cal.ics",
        schoolId: "school-1",
        schoolName: "Université",
      },
    })
  })

  it("omits absent school context from the recorded failed attempt", async () => {
    addState = { isPending: false, isError: true }
    mockAddCalendarFromUrl.mockRejectedValue(new Error("boom"))
    const { getByTestId } = await render(<IcalUrlScreen />)
    await act(async () => {
      fireEvent.changeText(
        getByTestId("ical-url-input"),
        "https://example.com/cal.ics",
      )
    })
    await act(async () => {
      fireEvent.press(getByTestId("ical-url-submit"))
    })
    await waitFor(() => expect(getByTestId("ical-url-report")).toBeTruthy())
    await act(async () => fireEvent.press(getByTestId("ical-url-report")))

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/feedback",
      params: { calendarUrl: "https://example.com/cal.ics" },
    })
  })

  it("never offers Report for a local validation error", async () => {
    const { getByTestId, queryByTestId } = await render(<IcalUrlScreen />)
    await act(async () => fireEvent.press(getByTestId("ical-url-submit")))
    expect(queryByTestId("ical-url-report")).toBeNull()
    expect(router.push).not.toHaveBeenCalled()
  })
})
