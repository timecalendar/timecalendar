import "@/i18n"

import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import CalendarImportResultScreen from "./calendar-import-result-screen"
import { useCalendarImportResult } from "./use-calendar-import-result"

jest.mock("expo-router", () => ({ router: { dismissTo: jest.fn() } }))
jest.mock("./use-calendar-import-result", () => ({
  useCalendarImportResult: jest.fn(),
}))

const mockController = useCalendarImportResult as jest.Mock
const mockDismissTo = router.dismissTo as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe("CalendarImportResultScreen", () => {
  it("announces loading without exposing an action", async () => {
    mockController.mockReturnValue({ phase: "loading", retry: jest.fn() })
    const { getByTestId, queryByRole } = await render(
      <CalendarImportResultScreen />,
    )
    expect(getByTestId("calendar-import-result-loading")).toBeTruthy()
    expect(queryByRole("button")).toBeNull()
  })

  it("offers sync-only retry and Continue on failure", async () => {
    const retry = jest.fn()
    mockController.mockReturnValue({ phase: "failed", retry })
    const { getByTestId } = await render(<CalendarImportResultScreen />)
    await act(() =>
      fireEvent.press(getByTestId("calendar-import-result-retry")),
    )
    await act(() =>
      fireEvent.press(getByTestId("calendar-import-result-continue")),
    )
    expect(retry).toHaveBeenCalledTimes(1)
    expect(mockDismissTo).toHaveBeenCalledWith("/calendar")
  })

  it("dismisses success to the existing Calendar tab", async () => {
    mockController.mockReturnValue({ phase: "success", retry: jest.fn() })
    const { getByTestId } = await render(<CalendarImportResultScreen />)
    await act(() =>
      fireEvent.press(getByTestId("calendar-import-result-calendar")),
    )
    expect(mockDismissTo).toHaveBeenCalledTimes(1)
    expect(mockDismissTo).toHaveBeenCalledWith("/calendar")
  })
})
