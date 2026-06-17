import {
  getAnalytics,
  logEvent as analyticsLogEvent,
} from "@react-native-firebase/analytics"
import {
  crash,
  getCrashlytics,
  log,
  recordError as crashlyticsRecordError,
} from "@react-native-firebase/crashlytics"
import {
  getAPNSToken,
  getInitialNotification,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging"
import { Platform } from "react-native"

import {
  crashTest,
  getFcmToken,
  getInitialTap,
  logEvent,
  logMessage,
  onFcmTokenRefresh,
  onForegroundMessage,
  onNotificationTap,
  recordError,
  requestNotificationPermission,
} from "@/firebase"

// Proof (mirrors the i18n/a11y proof tests): assert the wrapper drives the
// modular SDK with the expected arguments. CI can't assert an event/crash
// *arrives* in the Firebase console, nor that a real push is *received* on a
// device (foreground/background/killed) — that half is manual, on-device, and
// recorded in docs/react-native-migration/inbox/2026-06-17-fcm-push-receive-
// device-verification.md. Here we prove the seam WIRING only.
describe("firebase wrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("forwards logEvent to Analytics with name and params", async () => {
    await logEvent("debug_test_event", { source: "test" })

    expect(getAnalytics).toHaveBeenCalled()
    expect(analyticsLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      "debug_test_event",
      {
        source: "test",
      },
    )
  })

  it("forwards logMessage to Crashlytics.log", () => {
    logMessage("hello")

    expect(log).toHaveBeenCalledWith(expect.anything(), "hello")
  })

  it("records an error, with an optional breadcrumb first", () => {
    const error = new Error("boom")
    recordError(error, "while doing X")

    expect(log).toHaveBeenCalledWith(expect.anything(), "while doing X")
    expect(crashlyticsRecordError).toHaveBeenCalledWith(
      expect.anything(),
      error,
    )
  })

  it("records an error without a breadcrumb when no context is given", () => {
    const error = new Error("boom")
    recordError(error)

    expect(log).not.toHaveBeenCalled()
    expect(crashlyticsRecordError).toHaveBeenCalledWith(
      expect.anything(),
      error,
    )
  })

  it("triggers a native crash via crashTest", () => {
    crashTest()

    expect(getCrashlytics).toHaveBeenCalled()
    expect(crash).toHaveBeenCalled()
  })
})

describe("firebase messaging wrapper", () => {
  const mockGetAPNSToken = getAPNSToken as jest.Mock
  const mockGetToken = getToken as jest.Mock
  const originalOS = Platform.OS

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAPNSToken.mockResolvedValue("apns-token")
    mockGetToken.mockResolvedValue("fcm-token")
  })

  afterEach(() => {
    Platform.OS = originalOS
  })

  it("requests notification permission through messaging", async () => {
    await requestNotificationPermission()

    expect(requestPermission).toHaveBeenCalledWith(expect.anything())
  })

  it("on iOS gets the APNS token before the FCM token, then returns it", async () => {
    Platform.OS = "ios"

    const token = await getFcmToken()

    expect(mockGetAPNSToken).toHaveBeenCalled()
    expect(mockGetToken).toHaveBeenCalled()
    const apnsOrder = mockGetAPNSToken.mock.invocationCallOrder[0]!
    const tokenOrder = mockGetToken.mock.invocationCallOrder[0]!
    expect(apnsOrder).toBeLessThan(tokenOrder)
    expect(token).toBe("fcm-token")
  })

  it("on iOS returns null and does not call getToken when APNS is not ready", async () => {
    Platform.OS = "ios"
    mockGetAPNSToken.mockResolvedValue(null)

    const token = await getFcmToken()

    expect(token).toBeNull()
    expect(mockGetToken).not.toHaveBeenCalled()
  })

  it("on Android calls getToken directly with no APNS lookup", async () => {
    Platform.OS = "android"

    const token = await getFcmToken()

    expect(mockGetAPNSToken).not.toHaveBeenCalled()
    expect(mockGetToken).toHaveBeenCalled()
    expect(token).toBe("fcm-token")
  })

  it("records a getToken error and returns null", async () => {
    Platform.OS = "android"
    const error = new Error("token boom")
    mockGetToken.mockRejectedValue(error)

    const token = await getFcmToken()

    expect(token).toBeNull()
    expect(crashlyticsRecordError).toHaveBeenCalledWith(
      expect.anything(),
      error,
    )
  })

  it("subscribes to foreground messages and returns the unsubscribe", () => {
    const unsubscribe = jest.fn()
    ;(onMessage as jest.Mock).mockReturnValue(unsubscribe)
    const handler = jest.fn()

    const result = onForegroundMessage(handler)

    expect(onMessage).toHaveBeenCalledWith(expect.anything(), handler)
    expect(result).toBe(unsubscribe)
  })

  it("subscribes to the background notification tap and returns the unsubscribe", () => {
    const unsubscribe = jest.fn()
    ;(onNotificationOpenedApp as jest.Mock).mockReturnValue(unsubscribe)
    const handler = jest.fn()

    const result = onNotificationTap(handler)

    expect(onNotificationOpenedApp).toHaveBeenCalledWith(
      expect.anything(),
      handler,
    )
    expect(result).toBe(unsubscribe)
  })

  it("reads the cold-start initial notification through messaging", async () => {
    const message = { data: { action: "calendar_changed" } }
    ;(getInitialNotification as jest.Mock).mockResolvedValue(message)

    const result = await getInitialTap()

    expect(getInitialNotification).toHaveBeenCalledWith(expect.anything())
    expect(result).toBe(message)
  })

  it("subscribes to token refresh and returns the unsubscribe", () => {
    const unsubscribe = jest.fn()
    ;(onTokenRefresh as jest.Mock).mockReturnValue(unsubscribe)
    const handler = jest.fn()

    const result = onFcmTokenRefresh(handler)

    expect(onTokenRefresh).toHaveBeenCalledWith(expect.anything(), handler)
    expect(result).toBe(unsubscribe)
  })

  it("registers the background-message handler exactly once on module load", () => {
    // The registration is a module-init side-effect (the one documented
    // top-level native access). Re-import in isolation to observe the call
    // independently of the suite-wide clearAllMocks.
    jest.isolateModules(() => {
      const mock = setBackgroundMessageHandler as jest.Mock
      mock.mockClear()
      // require() (not import) so jest.isolateModules re-evaluates the seam's
      // module-init registration in isolation.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/firebase")
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(expect.anything(), expect.any(Function))
    })
  })
})
