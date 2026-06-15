import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"
import { Linking } from "react-native"

import {
  getScannedSource,
  setScannedSource,
} from "@/features/calendar-sources/data"
import { recordError } from "@/firebase"

import QrScanScreen from "./qr-scan-screen"

// Presentational (70% floor): the scan→parse→state wiring is the load-bearing
// proof (the real camera can't be CI/Maestro-driven). This file mocks
// expo-camera locally (overriding the suite-wide jest/setup-expo-camera) so a
// test fully controls the permission state and the synthetic scan value:
// CameraView exposes a pressable that fires onBarcodeScanned, useCameraPermissions
// returns a controllable permission. We mock the router + the @/firebase seam to
// assert dismissal and the recordError observability path; the REAL parser runs.
// The data sub-barrel keeps its real parser + holder and spies on setScannedSource
// only so the failure test can force a throw inside the scan handler.
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

jest.mock("expo-router", () => ({ router: { back: jest.fn() } }))
jest.mock("@/firebase", () => ({ recordError: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => {
  const actual = jest.requireActual<
    typeof import("@/features/calendar-sources/data")
  >("@/features/calendar-sources/data")
  return { ...actual, setScannedSource: jest.fn(actual.setScannedSource) }
})

const mockBack = router.back as jest.Mock
const mockRecordError = recordError as jest.Mock
const mockSetScannedSource = setScannedSource as jest.Mock
const realSetScannedSource = jest.requireActual<
  typeof import("@/features/calendar-sources/data")
>("@/features/calendar-sources/data").setScannedSource

beforeEach(() => {
  mockBack.mockClear()
  mockRecordError.mockClear()
  mockRequestPermission.mockClear()
  mockSetScannedSource.mockClear()
  mockSetScannedSource.mockImplementation(realSetScannedSource)
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

  it("parses a scanned URL into the ephemeral holder and dismisses", async () => {
    cameraState.nextScan = { data: "webcal://example.com/cal.ics", type: "qr" }
    const { getByTestId } = await render(<QrScanScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("qr-scan-camera-simulate-scan"))
    })

    expect(getScannedSource()).toEqual({ url: "https://example.com/cal.ics" })
    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockRecordError).not.toHaveBeenCalled()
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
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockRecordError).not.toHaveBeenCalled()
  })

  it("records a thrown failure through the firebase seam and shows a failure state", async () => {
    mockSetScannedSource.mockImplementation(() => {
      throw new Error("boom")
    })
    const { getByTestId, getByText } = await render(<QrScanScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("qr-scan-camera-simulate-scan"))
    })

    expect(mockRecordError).toHaveBeenCalledWith(
      expect.any(Error),
      "calendar-sources/qr-scan",
    )
    expect(
      getByText("Something went wrong while scanning. Please try again."),
    ).toBeTruthy()
  })
})
