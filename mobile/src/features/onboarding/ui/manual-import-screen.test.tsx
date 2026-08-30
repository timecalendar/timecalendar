import { readFileSync } from "node:fs"
import { join } from "node:path"
import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import ManualImportScreen from "./manual-import-screen"

// Presentational (70% floor). This screen's contract is almost entirely about
// what it does NOT do (design D7): it orchestrates the two existing, tested
// routes and owns no permission, validation, create or retry logic. The source
// assertion below is the only way to state that as a test rather than a promise.
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

const mockPush = router.push as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe("ManualImportScreen", () => {
  it("renders the localized copy and both entry points", async () => {
    const { getByText } = await render(<ManualImportScreen />)

    expect(getByText("Import your timetable")).toBeTruthy()
    expect(getByText("Scan QR code")).toBeTruthy()
    expect(getByText("Paste an iCal link")).toBeTruthy()
  })

  it.each([
    ["onboarding-import-qr", "/onboarding/qr-scan"],
    ["onboarding-import-url", "/onboarding/ical-url"],
  ])("navigates from %s to %s", async (testID, route) => {
    const { getByTestId } = await render(<ManualImportScreen />)
    const control = getByTestId(testID)

    expect(control.props.accessibilityRole).toBe("button")
    expect(control.props.accessibilityLabel).toBeTruthy()

    await act(async () => fireEvent.press(control))
    expect(mockPush).toHaveBeenCalledWith(route)
  })

  it("contains no permission, validation, create or retry logic", () => {
    const source = readFileSync(
      join(__dirname, "manual-import-screen.tsx"),
      "utf8",
    )

    for (const forbidden of [
      "useCameraPermissions",
      "validateIcalUrl",
      "useAddCalendar",
      "addCalendarFromUrl",
      "recordUnknownError",
      "useState",
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })
})
