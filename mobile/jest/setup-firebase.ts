// Mock @react-native-firebase's native modules for the whole suite: they have
// no JS implementation off-device, so any test that reaches the firebase seam
// (directly or via a screen that renders the dev panel) would otherwise throw.
// Registered globally here, mirroring setup-i18n; the proof test asserts the
// wrapper drives these mocks with the expected args.
jest.mock("@react-native-firebase/analytics", () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(() => Promise.resolve()),
}))

jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: jest.fn(() => ({})),
  log: jest.fn(),
  recordError: jest.fn(),
  crash: jest.fn(),
}))
