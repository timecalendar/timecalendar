import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import { useAddCalendar } from "@/features/calendar-sources/data"
import { recordError } from "@/firebase"

import IcalUrlScreen from "./ical-url-screen"

// Presentational (70% floor): renders through the real theme + i18n trees. Mocks
// the shared durable persist seam (useAddCalendar — its own success/failure is
// proven in data/user-calendars/add-calendar.test.ts against the customFetch
// mutator) and the @/firebase recordError. Asserts: the happy path (valid URL →
// addCalendarFromUrl resolves → dismiss), the inline-validation path (no persist,
// no recordError), and the persist-failure path (recordError with the ical-import
// context + an accessible error + Retry).
jest.mock("expo-router", () => ({ router: { back: jest.fn() } }))
jest.mock("@/firebase", () => ({ recordError: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual("@/features/calendar-sources/data"),
  useAddCalendar: jest.fn(),
}))

const mockBack = router.back as jest.Mock
const mockRecordError = recordError as jest.Mock
const mockUseAddCalendar = useAddCalendar as jest.Mock
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
    expect(mockRecordError).not.toHaveBeenCalled()
  })

  it("shows the inline validation error and does not persist on empty", async () => {
    const { getByTestId, getByText } = await render(<IcalUrlScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("ical-url-submit"))
    })

    expect(getByText("Enter a calendar URL.")).toBeTruthy()
    expect(mockAddCalendarFromUrl).not.toHaveBeenCalled()
    expect(mockRecordError).not.toHaveBeenCalled()
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
      expect(mockRecordError).toHaveBeenCalledWith(
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
    expect(mockBack).not.toHaveBeenCalled()

    // Retry re-runs the add; this time it resolves and dismisses.
    mockAddCalendarFromUrl.mockResolvedValue(undefined)
    await act(async () => {
      fireEvent.press(getByTestId("ical-url-retry"))
    })
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
  })
})
