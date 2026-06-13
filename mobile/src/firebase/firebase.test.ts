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

import { crashTest, logEvent, logMessage, recordError } from "@/firebase"

// Proof (mirrors the i18n/a11y proof tests): assert the wrapper drives the
// modular SDK with the expected arguments. CI can't assert an event or crash
// *arrives* in the Firebase console — that half is manual, on-device.
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
