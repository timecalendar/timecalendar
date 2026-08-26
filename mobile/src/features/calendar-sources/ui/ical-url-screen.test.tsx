import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import {
  CalendarImportRecoveryError,
  useAddCalendar,
} from "@/features/calendar-sources/data"
import { useSchools, useSelectedSchool } from "@/features/school-selection"
import i18n from "@/i18n"

import { focusCalendarUrl } from "./focus-calendar-url"
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
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual("@/features/calendar-sources/data"),
  useAddCalendar: jest.fn(),
}))
jest.mock("@/features/school-selection", () => ({
  useSchools: jest.fn(),
  useSelectedSchool: jest.fn(),
}))
jest.mock("./focus-calendar-url", () => ({ focusCalendarUrl: jest.fn() }))

const mockBack = router.back as jest.Mock
const mockUseAddCalendar = useAddCalendar as jest.Mock
const mockUseSchools = useSchools as jest.Mock
const mockUseSelectedSchool = useSelectedSchool as jest.Mock
const mockAddCalendarFromUrl = jest.fn<
  Promise<void>,
  [string, { schoolId: string; schoolName: string }?]
>()
const mockReset = jest.fn()
const mockFocusCalendarUrl = focusCalendarUrl as jest.Mock

let addState: { isPending: boolean; isError: boolean }

beforeEach(async () => {
  jest.clearAllMocks()
  await i18n.changeLanguage("en")
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
      undefined,
    )
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it("shows the inline validation error and does not persist on empty", async () => {
    const { getByTestId, getByText } = await render(<IcalUrlScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("ical-url-submit"))
    })

    expect(getByText("Enter a calendar URL.")).toBeTruthy()
    expect(mockAddCalendarFromUrl).not.toHaveBeenCalled()
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

  it("shows an accessible outage recovery with retry and report", async () => {
    mockAddCalendarFromUrl.mockRejectedValue(
      new CalendarImportRecoveryError({
        classification: "upstream_unavailable",
        helpKey: "toulouse3_outage",
        retryable: true,
      }),
    )
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
      expect(getByText("Toulouse 3 timetable unavailable")).toBeTruthy(),
    )
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

  it("submits selected school identity but reports only bounded recovery context", async () => {
    addState = { isPending: false, isError: true }
    mockAddCalendarFromUrl.mockRejectedValue(
      new CalendarImportRecoveryError({
        classification: "unsupported_link",
        helpKey: "tours_export",
        retryable: false,
      }),
    )
    mockUseSelectedSchool.mockReturnValue({
      schoolId: "school-1",
      groupValues: [],
    })
    mockUseSchools.mockReturnValue({
      schools: [
        { id: "school-1", name: "Université", code: "U", imageUrl: "" },
      ],
    })
    const { getByTestId, queryByTestId } = await render(<IcalUrlScreen />)
    await act(async () => {
      fireEvent.changeText(
        getByTestId("ical-url-input"),
        "  https://example.com/cal.ics  ",
      )
    })
    await act(async () => fireEvent.press(getByTestId("ical-url-submit")))
    await waitFor(() => expect(getByTestId("ical-url-report")).toBeTruthy())
    expect(mockAddCalendarFromUrl).toHaveBeenCalledWith(
      "  https://example.com/cal.ics  ",
      { schoolId: "school-1", schoolName: "Université" },
    )
    expect(queryByTestId("ical-url-retry")).toBeNull()
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
        classification: "unsupported_link",
        helpKey: "tours_export",
      },
    })
  })

  it("returns focus to the URL field for unsupported Rennes guidance", async () => {
    addState = { isPending: false, isError: true }
    mockAddCalendarFromUrl.mockRejectedValue(
      new CalendarImportRecoveryError({
        classification: "unsupported_link",
        helpKey: "rennes_export",
        retryable: false,
      }),
    )
    const { getByTestId, getByText, queryByTestId } = await render(
      <IcalUrlScreen />,
    )
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
      expect(getByText("Use a Rennes iCal export")).toBeTruthy(),
    )
    expect(queryByTestId("ical-url-retry")).toBeNull()
    await act(async () => fireEvent.press(getByTestId("ical-url-correct")))
    expect(mockFocusCalendarUrl).toHaveBeenCalledWith(expect.anything())
  })

  it("renders representative French outage guidance", async () => {
    await i18n.changeLanguage("fr")
    mockAddCalendarFromUrl.mockRejectedValue(
      new CalendarImportRecoveryError({
        classification: "upstream_unavailable",
        helpKey: "bordeaux_inp_outage",
        retryable: true,
      }),
    )
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
      expect(
        getByText("Emploi du temps de Bordeaux INP indisponible"),
      ).toBeTruthy(),
    )
    expect(getByTestId("ical-url-retry")).toBeTruthy()
  })

  it.each([
    [
      "saint_etienne_outage",
      "upstream_unavailable",
      true,
      "Saint-Étienne timetable unavailable",
    ],
    [
      "generic_invalid_calendar",
      "invalid_calendar",
      false,
      "This is not an iCal feed",
    ],
    ["generic_unknown", "unknown", true, "Calendar import failed"],
  ] as const)(
    "renders %s recovery",
    async (helpKey, classification, retryable, title) => {
      mockAddCalendarFromUrl.mockRejectedValue(
        new CalendarImportRecoveryError({
          classification,
          helpKey,
          retryable,
        }),
      )
      const { getByTestId, getByText, queryByTestId } = await render(
        <IcalUrlScreen />,
      )
      await act(async () => {
        fireEvent.changeText(
          getByTestId("ical-url-input"),
          "https://example.com/cal.ics",
        )
      })
      await act(async () => fireEvent.press(getByTestId("ical-url-submit")))
      await waitFor(() => expect(getByText(title)).toBeTruthy())
      expect(Boolean(queryByTestId("ical-url-retry"))).toBe(retryable)
    },
  )

  it("never offers Report for a local validation error", async () => {
    const { getByTestId, queryByTestId } = await render(<IcalUrlScreen />)
    await act(async () => fireEvent.press(getByTestId("ical-url-submit")))
    expect(queryByTestId("ical-url-report")).toBeNull()
    expect(router.push).not.toHaveBeenCalled()
  })
})
