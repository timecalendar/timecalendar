import { act, renderHook } from "@testing-library/react-native"
import { useRouter } from "expo-router"

import { refreshNewestPage } from "@/features/activity"
import { useSyncCalendars } from "@/features/calendar/data"
import {
  getInitialTap,
  onForegroundMessage,
  onNotificationTap,
  recordUnknownError,
  type RemoteMessage,
} from "@/firebase"

import {
  parseNotificationRoute,
  useNotificationTapRouting,
} from "./tap-routing"

// The pure parser is unit-tested for every branch; the dispatcher is proven by
// mocking the three @/firebase tap entrypoints, the calendar sync seam, and the
// expo-router router (testing.md mock-at-mutator). @/firebase is mocked so
// recordUnknownError is a spy and the entrypoints hand back driveable handlers.
jest.mock("@/firebase")
jest.mock("@/features/calendar/data")
// The second, INDEPENDENT cross-feature seam notification receipt now drives
// (TIM-399 / ADR 049 D4), mocked at the feature barrel like the sync above it.
jest.mock("@/features/activity", () => ({ refreshNewestPage: jest.fn() }))
jest.mock("expo-router", () => ({ useRouter: jest.fn() }))

const mockRefreshActivity = refreshNewestPage as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock
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

// The literal v2 payload shapes below are the mobile-side record of the frozen
// epic 03 wire contract (design D5): lowercase `type` canon on the detail push,
// a display-only `count` on the digest push.
describe("parseNotificationRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("maps new to the event route", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "new", event: { uid: "u-1" } }),
      ),
    ).toEqual({ kind: "event", uid: "u-1" })
  })

  it("maps edit to the event route", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "edit", event: { uid: "u-2" } }),
      ),
    ).toEqual({ kind: "event", uid: "u-2" })
  })

  it("maps cancel to the calendar route", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "cancel", event: { uid: "u-3" } }),
      ),
    ).toEqual({ kind: "calendar" })
  })

  it("maps an unknown type carrying a uid to the event route (defensive)", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "moved", event: { uid: "u-4" } }),
      ),
    ).toEqual({ kind: "event", uid: "u-4" })
  })

  it("maps a digest to the calendar route without reading the payload", () => {
    const digest = {
      data: { action: "calendar_digest", count: "3" },
    } as unknown as RemoteMessage
    expect(parseNotificationRoute(digest)).toEqual({ kind: "calendar" })
  })

  it("returns null when there is no data", () => {
    expect(parseNotificationRoute({})).toBeNull()
  })

  it("returns null for an unrecognized action", () => {
    expect(
      parseNotificationRoute(
        message("something_else", { type: "new", event: { uid: "u-1" } }),
      ),
    ).toBeNull()
  })

  it("records the error and returns null on a malformed payload", () => {
    const malformed = {
      data: { action: "calendar_changed", payload: "{not json" },
    } as unknown as RemoteMessage
    expect(parseNotificationRoute(malformed)).toBeNull()
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      expect.any(Error),
      "notifications/tap-routing",
    )
  })

  it("returns null when the event uid is missing", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "new", event: {} }),
      ),
    ).toBeNull()
  })

  it("returns null when the event uid is blank", () => {
    expect(
      parseNotificationRoute(
        message("calendar_changed", { type: "new", event: { uid: "" } }),
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
    mockRefreshActivity.mockResolvedValue({ status: "updated" })
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
        message("calendar_changed", { type: "new", event: { uid: "u-1" } }),
      )
    })
    expect(sync).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
  })

  it("refetches but does not navigate on a foreground calendar_digest message", async () => {
    await mount()
    await act(async () => {
      foregroundHandler()(message("calendar_digest"))
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

  it("refetches then opens the event on a background new tap", async () => {
    await mount()
    await act(async () => {
      tapHandler()(
        message("calendar_changed", { type: "new", event: { uid: "u-9" } }),
      )
    })
    expect(sync).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith("/event-details/u-9")
  })

  it("refetches then opens the calendar on a background cancel tap", async () => {
    await mount()
    await act(async () => {
      tapHandler()(
        message("calendar_changed", { type: "cancel", event: { uid: "u-9" } }),
      )
    })
    expect(sync).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith("/calendar")
  })

  it("refetches then opens the calendar on a background digest tap", async () => {
    await mount()
    await act(async () => {
      tapHandler()(message("calendar_digest"))
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
      message("calendar_changed", { type: "edit", event: { uid: "u-cold" } }),
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

  // TIM-399 / ADR 049 D4. Every case below is additive: not one assertion in a
  // pre-existing test above changed, which is the routing-regression proof for
  // this ticket's named sensitive surface — an edit up there would have meant
  // routing behavior moved.
  describe("Activity refresh (independent of the sync)", () => {
    it("requests a forced refresh on a foreground calendar_changed", async () => {
      await mount()
      await act(async () => {
        foregroundHandler()(
          message("calendar_changed", { type: "new", event: { uid: "u-1" } }),
        )
      })
      expect(mockRefreshActivity).toHaveBeenCalledTimes(1)
      expect(mockRefreshActivity).toHaveBeenCalledWith({ force: true })
    })

    it("requests a forced refresh on a foreground calendar_digest", async () => {
      await mount()
      await act(async () => {
        foregroundHandler()(message("calendar_digest"))
      })
      expect(mockRefreshActivity).toHaveBeenCalledTimes(1)
      expect(mockRefreshActivity).toHaveBeenCalledWith({ force: true })
    })

    it("requests a forced refresh on a background tap", async () => {
      await mount()
      await act(async () => {
        tapHandler()(
          message("calendar_changed", { type: "new", event: { uid: "u-9" } }),
        )
      })
      expect(mockRefreshActivity).toHaveBeenCalledTimes(1)
      expect(mockRefreshActivity).toHaveBeenCalledWith({ force: true })
    })

    it("requests a forced refresh on a cold-start tap", async () => {
      mockGetInitialTap.mockResolvedValue(message("calendar_digest", undefined))
      await mount()
      expect(mockRefreshActivity).toHaveBeenCalledTimes(1)
      expect(mockRefreshActivity).toHaveBeenCalledWith({ force: true })
    })

    it("requests nothing for an unrecognized foreground action", async () => {
      await mount()
      await act(async () => {
        foregroundHandler()(message("other"))
      })
      expect(mockRefreshActivity).not.toHaveBeenCalled()
    })

    it("requests nothing for an unrecognized tap action, while the sync still runs", async () => {
      await mount()
      await act(async () => {
        tapHandler()(message("other"))
      })
      expect(mockRefreshActivity).not.toHaveBeenCalled()
      // routeTap's sync stays UNCONDITIONAL — narrowing it to the Activity
      // relevance test would be a routing-behavior change.
      expect(sync).toHaveBeenCalledTimes(1)
    })

    // The reason the gate is the ACTION and not `parseNotificationRoute(…) !==
    // null`: an undecodable payload is still a real calendar change.
    it("refreshes a calendar_changed whose payload cannot be decoded, and still does not navigate", async () => {
      const undecodable = {
        data: { action: "calendar_changed", payload: "{not json" },
      } as unknown as RemoteMessage

      await mount()
      await act(async () => {
        tapHandler()(undecodable)
      })

      expect(mockRefreshActivity).toHaveBeenCalledTimes(1)
      expect(mockRefreshActivity).toHaveBeenCalledWith({ force: true })
      // Routing declines, exactly as before — the parse failed.
      expect(push).not.toHaveBeenCalled()
    })

    // THE INDEPENDENCE PROOF (architecture decision 7): the push guarantee has
    // to survive a sync that fails, so the refresh must not be chained onto the
    // sync's promise.
    it("still refreshes when the sync rejects", async () => {
      const rejected = Promise.reject(new Error("sync offline"))
      // Handled HERE so the rejection is not unhandled process-wide; production
      // deliberately adds no handler (`void sync()`), which is what this asserts.
      rejected.catch(() => undefined)
      sync.mockReturnValue(rejected)

      await mount()
      await act(async () => {
        tapHandler()(message("calendar_digest"))
      })

      expect(sync).toHaveBeenCalledTimes(1)
      expect(mockRefreshActivity).toHaveBeenCalledTimes(1)
    })

    it("still refreshes while the sync is still pending (never chained onto it)", async () => {
      // A sync that never settles: if the refresh were `sync().then(…)` it could
      // not have been called yet.
      sync.mockReturnValue(new Promise(() => undefined))

      await mount()
      await act(async () => {
        foregroundHandler()(message("calendar_digest"))
      })

      expect(mockRefreshActivity).toHaveBeenCalledTimes(1)
    })
  })
})
