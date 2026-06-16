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

// Messaging: the module-init setBackgroundMessageHandler call (the one
// documented top-level native access) hits a jest.fn() here, so importing
// @/firebase stays safe off-device. getToken defaults to resolving a token;
// onMessage/onTokenRefresh return an unsubscribe spy so the seam can hand it
// back. Tests override per-case (Platform.OS, null APNS, getToken rejection).
jest.mock("@react-native-firebase/messaging", () => ({
  getMessaging: jest.fn(() => ({})),
  requestPermission: jest.fn(() => Promise.resolve(1)),
  getAPNSToken: jest.fn(() => Promise.resolve("apns-token")),
  getToken: jest.fn(() => Promise.resolve("fcm-token")),
  onMessage: jest.fn(() => jest.fn()),
  onTokenRefresh: jest.fn(() => jest.fn()),
  setBackgroundMessageHandler: jest.fn(),
}))
