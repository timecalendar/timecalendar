import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"
import { Linking } from "react-native"

import { useAddCalendar } from "@/features/calendar-sources/data"
import { getOnboardingResolution } from "@/features/first-launch"
import { recordUnknownError } from "@/firebase"
import { remove, STORAGE_KEYS } from "@/storage"

import QrScanScreen from "./qr-scan-screen"

// Presentational (70% floor): the scan→parse→persist wiring is the load-bearing
// proof (the real camera can't be CI/Maestro-driven). This file mocks expo-camera
// locally (overriding the suite-wide jest/setup-expo-camera) so a test fully
// controls the permission state and the synthetic scan value: CameraView exposes a
// pressable that fires onBarcodeScanned, useCameraPermissions returns a
// controllable permission. We mock the router, the @/firebase seam, and the
// shared durable persist seam (useAddCalendar — its own success/failure is proven
// in data/user-calendars/add-calendar.test.ts) to assert dismissal and the
// recordError observability path; the REAL parser runs.
const cameraState: {
  permission: {
    granted: boolean
    canAskAgain: boolean
    status: string
  } | null
  nextScan: { data: string; type: string }
} = {
  permission: { granted: true, canAskAgain: true, status: "granted" },
  nextScan: { data: "https://example.com/cal.ics", type: "qr" },
}
const mockRequestPermission = jest.fn(() => Promise.resolve(undefined))

jest.mock("expo-camera", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text, View } = require("react-native")

  function CameraView(props: {
    testID?: string
    onBarcodeScanned?: (result: { data: string; type: string }) => void
    children?: unknown
  }) {
    const { testID, onBarcodeScanned, children } = props
    return React.createElement(
      View,
      { testID },
      React.createElement(
        Pressable,
        {
          testID: `${testID ?? "camera"}-simulate-scan`,
          accessibilityRole: "button",
          accessibilityLabel: "simulate scan",
          onPress: () => onBarcodeScanned?.(cameraState.nextScan),
        },
        React.createElement(Text, null, "simulate scan"),
      ),
      children,
    )
  }

  function useCameraPermissions() {
    return [
      cameraState.permission,
      mockRequestPermission,
      mockRequestPermission,
    ]
  }

  return { CameraView, useCameraPermissions }
})

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
    canDismiss: jest.fn(() => true),
    dismissAll: jest.fn(),
  },
}))
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual("@/features/calendar-sources/data"),
  useAddCalendar: jest.fn(),
}))
// The onboarding draft seam. `mockImportFields` is what the derivation would
// yield for the journey the screen was opened from; the no-draft direct route is
// covered by its own case below.
let mockImportFields: { name: string; schoolId?: string; schoolName?: string }
const mockClearDraft = jest.fn()
jest.mock("@/features/onboarding", () => ({
  useImportCreateFields: () => mockImportFields,
  useImportDraft: () => ({ clearDraft: mockClearDraft }),
}))

const mockBack = router.back as jest.Mock
const mockReplace = router.replace as jest.Mock
const mockCanDismiss = router.canDismiss as jest.Mock
const mockDismissAll = router.dismissAll as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock
const mockUseAddCalendar = useAddCalendar as jest.Mock
const mockAddCalendarFromUrl = jest.fn<Promise<void>, [string, unknown]>()

beforeEach(() => {
  jest.clearAllMocks()
  remove(STORAGE_KEYS.onboardingResolution)
  mockImportFields = { name: "L3 Informatique", schoolId: "univeiffel" }
  mockCanDismiss.mockReturnValue(true)
  mockAddCalendarFromUrl.mockResolvedValue(undefined)
  mockUseAddCalendar.mockReturnValue({
    addCalendarFromUrl: mockAddCalendarFromUrl,
    reset: jest.fn(),
    isPending: false,
    isError: false,
  })
  cameraState.permission = {
    granted: true,
    canAskAgain: true,
    status: "granted",
  }
  cameraState.nextScan = { data: "https://example.com/cal.ics", type: "qr" }
})

describe("QrScanScreen", () => {
  it("shows the explainer and grant control when undetermined", async () => {
    cameraState.permission = {
      granted: false,
      canAskAgain: true,
      status: "undetermined",
    }
    const { getByText, getByTestId } = await render(<QrScanScreen />)

    expect(
      getByText(
        "Point your camera at a calendar QR code to add it. We only use the camera to scan codes.",
      ),
    ).toBeTruthy()
    fireEvent.press(getByTestId("qr-scan-grant"))
    expect(mockRequestPermission).toHaveBeenCalledTimes(1)
  })

  it("shows settings guidance when denied and cannot ask again", async () => {
    cameraState.permission = {
      granted: false,
      canAskAgain: false,
      status: "denied",
    }
    const openSettings = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValue(undefined)
    const { getByText, getByTestId } = await render(<QrScanScreen />)

    expect(
      getByText(
        "Camera access is off. Open Settings to allow TimeCalendar to use the camera.",
      ),
    ).toBeTruthy()
    fireEvent.press(getByTestId("qr-scan-open-settings"))
    expect(openSettings).toHaveBeenCalledTimes(1)
    openSettings.mockRestore()
  })

  it("renders the QR-only camera when granted", async () => {
    const { getByTestId } = await render(<QrScanScreen />)
    expect(getByTestId("qr-scan-camera")).toBeTruthy()
  })

  it("persists a scanned URL through the durable seam and dismisses", async () => {
    cameraState.nextScan = { data: "webcal://example.com/cal.ics", type: "qr" }
    const { getByTestId } = await render(<QrScanScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("qr-scan-camera-simulate-scan"))
    })

    // The pure parser normalizes webcal:// → https:// before the persist seam,
    // and the journey's institution/programme ride along (TIM-391).
    expect(mockAddCalendarFromUrl).toHaveBeenCalledWith(
      "https://example.com/cal.ics",
      { name: "L3 Informatique", schoolId: "univeiffel" },
    )
    // Success leaves the whole journey rather than returning to the step that
    // sent us here, and spends the draft.
    await waitFor(() => expect(mockDismissAll).toHaveBeenCalledTimes(1))
    expect(mockClearDraft).toHaveBeenCalledTimes(1)
    expect(getOnboardingResolution()).toBe("calendarImported")
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("creates with empty metadata and replaces to Calendar on a direct route with no draft", async () => {
    // The route opened by a dev link / external link / restored navigation: no
    // provider, so no draft — a supported entry point, not an error.
    mockImportFields = { name: "", schoolName: "" }
    mockCanDismiss.mockReturnValue(false)
    const { getByTestId } = await render(<QrScanScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("qr-scan-camera-simulate-scan"))
    })

    expect(mockAddCalendarFromUrl).toHaveBeenCalledWith(
      "https://example.com/cal.ics",
      { name: "", schoolName: "" },
    )
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/calendar"))
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockDismissAll).not.toHaveBeenCalled()
  })

  it("shows a recoverable message for a non-calendar QR without recording", async () => {
    cameraState.nextScan = { data: "BEGIN:VCARD", type: "qr" }
    const { getByTestId, getByText } = await render(<QrScanScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("qr-scan-camera-simulate-scan"))
    })

    expect(
      getByText("That isn't a calendar QR code. Try another one."),
    ).toBeTruthy()
    expect(mockAddCalendarFromUrl).not.toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockDismissAll).not.toHaveBeenCalled()
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("records a failed persist through the firebase seam and shows a failure state", async () => {
    mockAddCalendarFromUrl.mockRejectedValue(new Error("boom"))
    const { getByTestId, getByText } = await render(<QrScanScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("qr-scan-camera-simulate-scan"))
    })

    await waitFor(() =>
      expect(mockRecordUnknownError).toHaveBeenCalledWith(
        expect.any(Error),
        "calendar-sources/qr-scan",
      ),
    )
    expect(
      getByText("Something went wrong while scanning. Please try again."),
    ).toBeTruthy()
  })
})
