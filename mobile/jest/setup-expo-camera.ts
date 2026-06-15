// Mock expo-camera's native module for the whole suite: CameraView bridges to
// the native camera and useCameraPermissions to the OS permission API — neither
// has off-device JS, so any test that renders (or transitively imports) the QR
// scanner would otherwise throw under Jest (the setup-firebase / setup-expo-ui
// situation). Registered globally; mock at the native seam, not the screen.
//
// This suite-wide mock is a SAFE DEFAULT (granted permission, a static synthetic
// scan): it keeps the module loadable everywhere. The QR-scan proof test
// (qr-scan-screen.test.tsx) re-mocks expo-camera LOCALLY with controllable
// permission + scan state to drive the real parser through the screen — a
// per-file jest.mock overrides this one.
//
// The factory is plain JS (no TS type refs): a jest.mock factory may not
// reference out-of-scope variables and the babel jest-hoist plugin flags TS type
// identifiers; react / react-native are require()d lazily inside the closure.
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
          onPress: () =>
            onBarcodeScanned?.({
              data: "https://example.com/cal.ics",
              type: "qr",
            }),
        },
        React.createElement(Text, null, "simulate scan"),
      ),
      children,
    )
  }

  function useCameraPermissions() {
    const request = () =>
      Promise.resolve({
        granted: true,
        canAskAgain: true,
        status: "granted",
      })
    return [
      { granted: true, canAskAgain: true, status: "granted" },
      request,
      request,
    ]
  }

  return { CameraView, useCameraPermissions }
})
