import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"
import type { ReactNode } from "react"

import { customFetch } from "@/api/mutator"
import { setScannedSource } from "@/features/calendar-sources/data"
import { recordError } from "@/firebase"

import IcalUrlScreen from "./ical-url-screen"

// Presentational (70% floor): renders through the real theme + i18n trees and a
// REAL QueryClient driving the REAL generated mutation. Mocks at the customFetch
// mutator seam (the designed seam — never the network; testing.md / data.md) and
// the @/firebase recordError + the ephemeral holder's setScannedSource. Asserts:
// the happy path (valid URL → mocked { token } → setScannedSource + dismiss), the
// inline-validation path (no customFetch, no recordError), and the server-failure
// path (recordError with the ical-import context + an accessible error + Retry).
jest.mock("@/api/mutator")
jest.mock("@/firebase", () => ({ recordError: jest.fn() }))
jest.mock("expo-router", () => ({ router: { back: jest.fn() } }))
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual("@/features/calendar-sources/data"),
  setScannedSource: jest.fn(),
}))

const mockFetch = customFetch as jest.Mock
const mockBack = router.back as jest.Mock
const mockSetScannedSource = setScannedSource as jest.Mock
const mockRecordError = recordError as jest.Mock

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("IcalUrlScreen", () => {
  it("renders the localized title, field label, and submit (not raw keys)", async () => {
    const { getByText } = await render(<IcalUrlScreen />, { wrapper })

    expect(getByText("Add a calendar by URL")).toBeTruthy()
    expect(getByText("Calendar URL")).toBeTruthy()
    expect(getByText("Import")).toBeTruthy()
  })

  it("imports a valid URL: posts to the server, stashes the source, dismisses", async () => {
    mockFetch.mockResolvedValue({ token: "tok_123" })
    const { getByTestId } = await render(<IcalUrlScreen />, { wrapper })

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
    // The generated mutation ran through the customFetch seam with the trimmed
    // body the data/ layer assembles (url trimmed, customData: null).
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0][1].body).toBe(
      JSON.stringify({
        url: "https://example.com/cal.ics",
        customData: null,
      }),
    )
    expect(mockSetScannedSource).toHaveBeenCalledWith({
      url: "https://example.com/cal.ics",
    })
    expect(mockRecordError).not.toHaveBeenCalled()
  })

  it("shows the inline validation error and does not submit on empty", async () => {
    const { getByTestId, getByText } = await render(<IcalUrlScreen />, {
      wrapper,
    })

    await act(async () => {
      fireEvent.press(getByTestId("ical-url-submit"))
    })

    expect(getByText("Enter a calendar URL.")).toBeTruthy()
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockRecordError).not.toHaveBeenCalled()
    expect(mockSetScannedSource).not.toHaveBeenCalled()
  })

  it("shows the inline invalid error for a non-URL value", async () => {
    const { getByTestId, getByText } = await render(<IcalUrlScreen />, {
      wrapper,
    })

    await act(async () => {
      fireEvent.changeText(getByTestId("ical-url-input"), "not a url")
    })
    await act(async () => {
      fireEvent.press(getByTestId("ical-url-submit"))
    })

    expect(getByText("Enter a valid http or https URL.")).toBeTruthy()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("records the error and shows an accessible error + retry on server failure", async () => {
    mockFetch.mockRejectedValue(new Error("boom"))
    const { getByTestId, getByText } = await render(<IcalUrlScreen />, {
      wrapper,
    })

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

    // Retry re-runs the mutation; this time it resolves and dismisses.
    mockFetch.mockResolvedValue({ token: "tok_456" })
    await act(async () => {
      fireEvent.press(getByTestId("ical-url-retry"))
    })
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
    expect(mockSetScannedSource).toHaveBeenCalledWith({
      url: "https://example.com/cal.ics",
    })
  })
})
