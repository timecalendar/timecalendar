import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import { useAddCalendar } from "@/features/calendar-sources/data"
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
  router: {
    back: jest.fn(),
    push: jest.fn(),
    canDismiss: jest.fn(() => true),
    dismissAll: jest.fn(),
  },
}))
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual("@/features/calendar-sources/data"),
  useAddCalendar: jest.fn(),
}))
// Institution + programme now come from the ephemeral import draft, NOT from the
// persisted school selection (TIM-391 / design D10) — that read is gone.
let mockImportFields: { name: string; schoolId?: string; schoolName?: string }
const mockClearDraft = jest.fn()
jest.mock("@/features/onboarding", () => ({
  useImportCreateFields: () => mockImportFields,
  useImportDraft: () => ({ clearDraft: mockClearDraft }),
}))

const mockBack = router.back as jest.Mock
const mockCanDismiss = router.canDismiss as jest.Mock
const mockDismissAll = router.dismissAll as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock
const mockUseAddCalendar = useAddCalendar as jest.Mock
const mockAddCalendarFromUrl = jest.fn<Promise<void>, [string, unknown]>()
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
  // The direct-route default: no draft, so no institution and no programme.
  mockImportFields = { name: "", schoolName: "" }
  mockCanDismiss.mockReturnValue(true)
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

    // No draft ⇒ the direct-route contract: name "" and schoolName "" (which the
    // server's @ValidateIf pair accepts), and no journey to dismiss.
    await waitFor(() => expect(mockDismissAll).toHaveBeenCalledTimes(1))
    expect(mockAddCalendarFromUrl).toHaveBeenCalledWith(
      "  https://example.com/cal.ics  ",
      { name: "", schoolName: "" },
    )
    expect(mockClearDraft).toHaveBeenCalledTimes(1)
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
    expect(mockDismissAll).not.toHaveBeenCalled()
    // A failed import spends nothing: the draft and the typed URL stay so the
    // student can retry or switch to the QR route (design D9).
    expect(mockClearDraft).not.toHaveBeenCalled()
    expect(getByTestId("ical-url-input").props.value).toBe(
      "https://example.com/cal.ics",
    )

    // Retry re-runs the add; this time it resolves and leaves the journey.
    mockAddCalendarFromUrl.mockResolvedValue(undefined)
    await act(async () => {
      fireEvent.press(getByTestId("ical-url-retry"))
    })
    await waitFor(() => expect(mockDismissAll).toHaveBeenCalledTimes(1))
  })

  it("falls back to back() when there is no journey to dismiss", async () => {
    mockCanDismiss.mockReturnValue(false)
    mockAddCalendarFromUrl.mockResolvedValue(undefined)
    const { getByTestId } = await render(<IcalUrlScreen />)

    await act(async () => {
      fireEvent.changeText(
        getByTestId("ical-url-input"),
        "https://example.com/cal.ics",
      )
    })
    await act(async () => fireEvent.press(getByTestId("ical-url-submit")))

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
    expect(mockDismissAll).not.toHaveBeenCalled()
  })

  it("reports only a recorded failure, with the draft's institution and programme", async () => {
    addState = { isPending: false, isError: true }
    mockAddCalendarFromUrl.mockRejectedValue(new Error("boom"))
    mockImportFields = { name: "L3 Informatique", schoolId: "school-1" }
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
        calendarName: "L3 Informatique",
      },
    })
  })

  it("omits calendarName when the programme step was skipped", async () => {
    addState = { isPending: false, isError: true }
    mockAddCalendarFromUrl.mockRejectedValue(new Error("boom"))
    mockImportFields = { name: "", schoolName: "École du Coin" }
    const { getByTestId } = await render(<IcalUrlScreen />)
    await act(async () => {
      fireEvent.changeText(
        getByTestId("ical-url-input"),
        "https://example.com/cal.ics",
      )
    })
    await act(async () => fireEvent.press(getByTestId("ical-url-submit")))
    await waitFor(() => expect(getByTestId("ical-url-report")).toBeTruthy())
    await act(async () => fireEvent.press(getByTestId("ical-url-report")))

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/feedback",
      params: {
        calendarUrl: "https://example.com/cal.ics",
        schoolName: "École du Coin",
      },
    })
  })

  it("omits absent institution and programme context on a draft-less route", async () => {
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
