import { useRouter } from "expo-router"
import { useEffect, useRef } from "react"

import { useSyncCalendars } from "@/features/calendar/data"
import {
  getInitialTap,
  onForegroundMessage,
  onNotificationTap,
  recordUnknownError,
} from "@/firebase"

// The server's v2 wire contract (frozen). A detail push — one FCM message per
// changed event — carries `data.action = "calendar_changed"` with `data.payload`
// a JSON string of { type, event }; `type ∈ new | edit | cancel` (lowercase
// canonical) and `event` carries the iCal `uid`. A digest push carries
// `data.action = "calendar_digest"` with a display-only `data.count`. ADR 028.
const CALENDAR_CHANGED_ACTION = "calendar_changed"
const CALENDAR_DIGEST_ACTION = "calendar_digest"
const CANCEL = "cancel"

// A tap routes to the affected event (new/edit), or to the calendar (cancel — the
// event is gone server-side, so a detail page would be empty — and digests).
export type TapRoute = { kind: "event"; uid: string } | { kind: "calendar" }

// The decoded `payload` shape we depend on — a minimal local type, NOT the server
// types (the wire `event` dates are ISO strings; the parser only needs `uid`).
interface DecodedPayload {
  type: string
  event: { uid?: string }
}

// The slice of the wire message the parser reads: the `data` map (absent in a
// notification-only message). A minimal structural input so the parser stays pure
// and testable without constructing a full RemoteMessage.
interface TapMessage {
  data?: { action?: string; payload?: string } | null
}

/**
 * Decode the server's v2 data message into a tap route, or null for anything we
 * do not handle. Pure (no React / Expo / native) so every branch is
 * unit-testable to the branch gate. A malformed `payload` is recorded via
 * `recordError` (the only non-pure dependency, in the catch) and yields null —
 * never a crash. R-2: an unrecognized action is ignored (forward-compatible;
 * the server grows new actions on its own ship).
 */
export function parseNotificationRoute(message: TapMessage): TapRoute | null {
  const data = message.data
  // A digest tap opens the calendar; `payload`/`count` are not read.
  if (data?.action === CALENDAR_DIGEST_ACTION) {
    return { kind: "calendar" }
  }
  if (data?.action !== CALENDAR_CHANGED_ACTION) {
    return null
  }

  let decoded: DecodedPayload
  try {
    decoded = JSON.parse(String(data.payload)) as DecodedPayload
  } catch (error) {
    recordUnknownError(error, "notifications/tap-routing")
    return null
  }

  const uid = decoded.event?.uid
  if (uid == null || uid === "") {
    return null
  }

  // cancel → the event no longer exists; route to the calendar. Any other type
  // carrying a uid (new / edit, defensively also unknown ones) → the event.
  return decoded.type === CANCEL ? { kind: "calendar" } : { kind: "event", uid }
}

/**
 * The tap-routing dispatcher (ADR 028 / design Decision 2), mounted once in the
 * root layout beside `useNotificationRegistration`. Wires the three messaging
 * entrypoints to the calendar sync + the router:
 *   - Foreground (`onForegroundMessage`): a `calendar_changed` or
 *     `calendar_digest` message refetches the calendar and does NOT navigate
 *     (Flutter parity — never yank the user).
 *   - Background tap (`onNotificationTap`): refetch, then navigate per the route.
 *   - Killed/cold-start (`getInitialTap`): resolved in a ref-guarded mount effect
 *     so the <Stack> is mounted before navigation (Decision 3); refetch then
 *     navigate. A null initial notification is a safe no-op.
 * A failed sync is silent/last-good (ADR 021).
 */
export function useNotificationTapRouting(): void {
  const { sync } = useSyncCalendars()
  const router = useRouter()
  const coldStartHandled = useRef(false)

  useEffect(() => {
    // A tap (background or cold-start): refetch, then navigate per the route.
    function routeTap(message: TapMessage): void {
      void sync()
      const route = parseNotificationRoute(message)
      if (route == null) return
      if (route.kind === "event") {
        router.push(`/event-details/${route.uid}`)
      } else {
        router.push("/calendar")
      }
    }

    const unsubscribeForeground = onForegroundMessage((message) => {
      const action = message.data?.action
      if (
        action === CALENDAR_CHANGED_ACTION ||
        action === CALENDAR_DIGEST_ACTION
      ) {
        void sync()
      }
    })

    const unsubscribeTap = onNotificationTap(routeTap)

    if (!coldStartHandled.current) {
      coldStartHandled.current = true
      void getInitialTap().then((message) => {
        if (message != null) routeTap(message)
      })
    }

    return () => {
      unsubscribeForeground()
      unsubscribeTap()
    }
  }, [sync, router])
}
