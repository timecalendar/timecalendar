import { act, renderHook } from "@testing-library/react-native"
import { useRouter } from "expo-router"

import { useSyncCalendars } from "@/features/calendar/data"
import {
  getInitialTap,
  onForegroundMessage,
  onNotificationTap,
  recordError,
  type RemoteMessage,
} from "@/firebase"

import {
  parseNotificationRoute,
  useNotificationTapRouting,
} from "./tap-routing"

// The pure parser is unit-tested for every branch; the dispatcher is proven by
// mocking the three @/firebase tap entrypoints, the calendar sync seam, and the
// expo-router router (testing.md mock-at-mutator). @/firebase is mocked so
// recordError is a spy and the entrypoints hand back driveable handlers.
jest.mock("@/firebase")
jest.mock("@/features/calendar/data")
jest.mock("expo-router", () => ({ useRouter: jest.fn() }))

const mockRecordError = recordError as jest.Mock
const mockUseSyncCalendars = useSyncCalendars as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockOnForegroundMessage = onForegroundMessage as jest.Mock
const mockOnNotificationTap = onNotificationTap as jest.Mock
const mockGetInitialTap = getInitialTap as jest.Mock

function message(action: string | undefined, payload?: unknown): RemoteMessage {
  const data: Record<string, string> = {}
  if (action !== undefined) data.action = action
  if (payload !== undefined) data.payload = JSON.stringify(payload)
  return { data } as unknown as RemoteMessage
}

describe("parseNotificationRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("maps NEW to the event route", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "NEW", event: { uid: "u-1" } }),
      ),
    ).toEqual({ kind: "event", uid: "u-1" })
  })

  it("maps EDIT to the event route", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "EDIT", event: { uid: "u-2" } }),
      ),
    ).toEqual({ kind: "event", uid: "u-2" })
  })

  it("maps CANCEL to the calendar route", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "CANCEL", event: { uid: "u-3" } }),
      ),
    ).toEqual({ kind: "calendar" })
  })

  it("returns null when there is no data", () => {
    expect(parseNotificationRoute({})).toBeNull()
  })

  it("returns null for a non-calendar_changed action", () => {
    expect(
      parseNotificationRoute(
        message("something_else", { type: "NEW", event: { uid: "u-1" } }),
      ),
    ).toBeNull()
  })

  it("records the error and returns null on a malformed payload", () => {
    const malformed = {
      data: { action: "calendar_changed", payload: "{not json" },
    } as unknown as RemoteMessage
    expect(parseNotificationRoute(malformed)).toBeNull()
    expect(mockRecordError).toHaveBeenCalledWith(
      expect.any(Error),
      "notifications/tap-routing",
    )
  })

  it("returns null when the event uid is missing", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "NEW", event: {} }),
      ),
    ).toBeNull()
  })

  it("returns null when the event uid is blank", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "NEW", event: { uid: "" } }),
      ),
    ).toBeNull()
  })
})

describe("useNotificationTapRouting", () => {
  let sync: jest.Mock
  let push: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    sync = jest.fn().mockResolvedValue(undefined)
    push = jest.fn()
    mockUseSyncCalendars.mockReturnValue({ sync })
    mockUseRouter.mockReturnValue({ push })
    mockOnForegroundMessage.mockReturnValue(jest.fn())
    mockOnNotificationTap.mockReturnValue(jest.fn())
    mockGetInitialTap.mockResolvedValue(null)
  })

  // The cold-start getInitialTap().then resolves in a trailing microtask after
  // renderHook's own act scope closes; flush it inside act after the render so the
  // promise settles in-scope (no act-without-await warning, no leak into the next
  // test).
  async function mount() {
    const rendered = await renderHook(() => useNotificationTapRouting())
    await act(async () => {
      await Promise.resolve()
    })
    return rendered
  }

  function foregroundHandler(): (m: RemoteMessage) => void {
    return mockOnForegroundMessage.mock.calls[0]![0] as (
      m: RemoteMessage,
    ) => void
  }

  function tapHandler(): (m: RemoteMessage) => void {
    return mockOnNotificationTap.mock.calls[0]![0] as (m: RemoteMessage) => void
  }

  // Driving a handler inside a SYNC act() leaves the handler's `void sync()`
  // floating past the act scope (act-without-await), which corrupts the next
  // test's render — so drive every handler inside `await act(async () => …)`.
  it("refetches but does not navigate on a foreground calendar_changed message", async () => {
    await mount()
    await act(async () => {
      foregroundHandler()(
        message("calendar_changed", { type: "NEW", event: { uid: "u-1" } }),
      )
    })
    expect(sync).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
  })

  it("ignores a foreground message with another action", async () => {
    await mount()
    await act(async () => {
      foregroundHandler()(message("other"))
    })
    expect(sync).not.toHaveBeenCalled()
  })

  it("refetches then opens the event on a background NEW tap", async () => {
    await mount()
    await act(async () => {
      tapHandler()(
        message("calendar_changed", { type: "NEW", event: { uid: "u-9" } }),
      )
    })
    expect(sync).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith("/event-details/u-9")
  })

  it("refetches then opens the calendar on a background CANCEL tap", async () => {
    await mount()
    await act(async () => {
      tapHandler()(
        message("calendar_changed", { type: "CANCEL", event: { uid: "u-9" } }),
      )
    })
    expect(sync).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith("/calendar")
  })

  it("does not navigate on a background tap with an unhandled payload", async () => {
    await mount()
    await act(async () => {
      tapHandler()(message("other"))
    })
    expect(sync).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
  })

  it("refetches then navigates on a cold-start initial notification", async () => {
    mockGetInitialTap.mockResolvedValue(
      message("calendar_changed", { type: "EDIT", event: { uid: "u-cold" } }),
    )
    await mount()
    expect(sync).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith("/event-details/u-cold")
  })

  it("does nothing when there is no cold-start initial notification", async () => {
    await mount()
    expect(mockGetInitialTap).toHaveBeenCalledTimes(1)
    expect(sync).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it("subscribes both listeners on mount and reads the cold-start once", async () => {
    await mount()
    expect(mockOnForegroundMessage).toHaveBeenCalledTimes(1)
    expect(mockOnNotificationTap).toHaveBeenCalledTimes(1)
    expect(mockGetInitialTap).toHaveBeenCalledTimes(1)
  })

  it("does not re-read the cold-start notification across re-renders", async () => {
    const { rerender } = await mount()
    expect(mockGetInitialTap).toHaveBeenCalledTimes(1)
    // A new sync identity re-runs the effect; the ref guard must block a second
    // cold-start read (the one-shot at launch).
    mockUseSyncCalendars.mockReturnValue({
      sync: jest.fn().mockResolvedValue(undefined),
    })
    await act(async () => {
      rerender(undefined)
    })
    expect(mockGetInitialTap).toHaveBeenCalledTimes(1)
  })

  it("wires the listener unsubscribes as the effect cleanup", async () => {
    const unsubscribeForeground = jest.fn()
    const unsubscribeTap = jest.fn()
    mockOnForegroundMessage.mockReturnValue(unsubscribeForeground)
    mockOnNotificationTap.mockReturnValue(unsubscribeTap)
    const { unmount } = await mount()
    unmount()
    // The harness does not reliably run effect cleanup on unmount (Ship B note),
    // so assert the wiring: the seam handed back the unsubscribes that the
    // effect's returned cleanup calls.
    expect(mockOnForegroundMessage).toHaveReturnedWith(unsubscribeForeground)
    expect(mockOnNotificationTap).toHaveReturnedWith(unsubscribeTap)
  })
})
