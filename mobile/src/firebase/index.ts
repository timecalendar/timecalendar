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
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  type RemoteMessage,
  requestPermission,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging"
import { Platform } from "react-native"

// Re-export the wire message type so call sites (the tap-routing dispatcher)
// type their handlers without reaching the native module directly.
export type { RemoteMessage }

// Thin seam over @react-native-firebase's modular API — the single place the
// app touches Firebase, so the SDK is swappable and call sites stay decoupled.
// There is no startup init to run for Crashlytics/Analytics: the native default
// app auto-initializes from the google-services.json / GoogleService-Info.plist
// baked in at build time, and Crashlytics installs the global JS exception
// handler natively. Each helper resolves the native instance lazily inside its
// body (never at module load) so importing this file never touches native
// modules — with the SINGLE documented exception of the messaging
// background-message handler registered at the bottom (see ADR 026).

/** Log an Analytics event. Event names are identifiers, not user-facing copy. */
export function logEvent(
  name: string,
  params?: Record<string, string | number>,
): Promise<void> {
  return analyticsLogEvent(getAnalytics(), name, params)
}

/** Append a message to the current Crashlytics session log (breadcrumb). */
export function logMessage(message: string): void {
  log(getCrashlytics(), message)
}

/** Record a caught error to Crashlytics, optionally with a breadcrumb first. */
export function recordError(error: Error, context?: string): void {
  const crashlytics = getCrashlytics()
  if (context !== undefined) {
    log(crashlytics, context)
  }
  crashlyticsRecordError(crashlytics, error)
}

/** Force a native crash — the step-8 end-to-end Crashlytics verification. */
export function crashTest(): void {
  crash(getCrashlytics())
}

// --- Cloud Messaging (FCM push receive, ADR 026) ----------------------------
// Mirrors the Flutter modules/firebase/services/notification/notification.dart.
// Receive + seam only — token-to-backend registration, prefs UI, tap-routing,
// and local reminders are Ships B/C/D.

/**
 * Request notification authorization — the iOS UNUserNotification prompt and,
 * on Android 13+, the runtime POST_NOTIFICATIONS permission. Mirrors Flutter
 * `subscribe()`.
 */
export async function requestNotificationPermission(): Promise<void> {
  await requestPermission(getMessaging())
}

/**
 * Resolve the FCM token, or null if it is not yet obtainable. On iOS the APNS
 * token MUST be vended before the FCM token — calling `getToken` first races
 * and can error — so we fetch `getAPNSToken` first and return null (the caller
 * retries on the next refresh/foreground cycle) when APNS is not ready. Exact
 * parity with Flutter `getFcmToken`. `getToken` errors are surfaced via the
 * existing `recordError` seam and yield null.
 */
export async function getFcmToken(): Promise<string | null> {
  const messaging = getMessaging()
  if (Platform.OS === "ios") {
    const apnsToken = await getAPNSToken(messaging)
    if (apnsToken == null) {
      return null
    }
  }
  try {
    return await getToken(messaging)
  } catch (error) {
    recordError(error as Error, "getFcmToken")
    return null
  }
}

/** Subscribe to foreground messages; returns the unsubscribe function. */
export function onForegroundMessage(
  handler: (message: RemoteMessage) => void,
): () => void {
  return onMessage(getMessaging(), handler)
}

/**
 * Subscribe to a notification TAP that opens the app from the background (not a
 * cold start); returns the unsubscribe function. The killed/cold-start tap is
 * `getInitialNotification` instead (a one-shot at launch). Tap-routing, Ship C.
 */
export function onNotificationTap(
  handler: (message: RemoteMessage) => void,
): () => void {
  return onNotificationOpenedApp(getMessaging(), handler)
}

/**
 * The notification that cold-started the app from a killed state, or null if the
 * app was opened any other way. A one-shot read at launch (the background-tap
 * path is `onNotificationTap`). Tap-routing, Ship C.
 */
export function getInitialTap(): Promise<RemoteMessage | null> {
  return getInitialNotification(getMessaging())
}

/** Subscribe to FCM token refreshes; returns the unsubscribe function. */
export function onFcmTokenRefresh(
  handler: (token: string) => void,
): () => void {
  return onTokenRefresh(getMessaging(), handler)
}

// The ONE documented exception to the no-native-on-import posture (ADR 026):
// the background-message handler MUST be registered at the top level, before
// the JS app finishes booting — RNFB drops background/quit-state messages for a
// handler registered late (e.g. inside a component effect) and warns/throws.
// This is the only top-level native access in the seam; it loads during boot
// via the side-effect `import "@/firebase"` in src/app/_layout.tsx, and stays
// Jest-safe because jest/setup-firebase.ts mocks the messaging module. Receive
// only here — data-message action handling (tap-routing) is Ship C.
setBackgroundMessageHandler(getMessaging(), async () => {})
