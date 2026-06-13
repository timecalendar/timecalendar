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

// Thin seam over @react-native-firebase's modular API — the single place the
// app touches Firebase, so the SDK is swappable and call sites stay decoupled.
// There is no startup init to run: the native default app auto-initializes from
// the google-services.json / GoogleService-Info.plist baked in at build time,
// and Crashlytics installs the global JS exception handler natively — so unlike
// i18n this is a call-site module, not a side-effect import in _layout.tsx.
// Each helper resolves the native instance lazily inside its body (never at
// module load) so importing this file never touches native modules.

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
