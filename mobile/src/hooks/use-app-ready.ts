import { useEffect } from "react"

import { failLaunch, useLaunchState } from "@/features/startup"

// Max time the splash may wait for the readiness gate. Native cold-start CI and
// low-end devices can legitimately spend several seconds opening/migrating the
// database and resolving identity, so this shares Maestro's 60-second launch
// budget. The watchdog remains the load-bearing safety net the design requires:
// it fails closed to a retry surface instead of exposing unverified app content.
const READY_WATCHDOG_MS = 60_000

// First-paint prerequisites are owned by the launch coordinator; this hook
// converts its process-lifetime state into splash readiness:
//  - i18n: synchronous via the `import "@/i18n"` side-effect in the root layout
//    (initializes before render); a future async-catalog change gates here.
//  - fonts: a no-op seam while the app uses system fonts; adding expo-font's
//    `useFonts` later is a one-line `&& fontsLoaded` here.
//  - migrations and identity: asynchronous, idempotent, and awaited before the
//    winning route is committed.
/**
 * Readiness gate: returns true once first-paint prerequisites are satisfied.
 * The reusable "render only when prerequisites are satisfied" pattern features
 * inherit. The gate resolves after launch commitment/failure, and never later
 * than the watchdog deadline if an async prerequisite stalls.
 */
export function useAppReady(): boolean {
  const launch = useLaunchState()
  const ready = launch.kind === "committed" || launch.kind === "failure"

  useEffect(() => {
    if (ready) return
    // A stalled prerequisite becomes a visible blocking failure rather than
    // hanging the splash or revealing tabs whose schema/identity is unknown.
    const watchdog = setTimeout(
      () => failLaunch(new Error("Launch readiness timed out")),
      READY_WATCHDOG_MS,
    )
    return () => clearTimeout(watchdog)
  }, [ready])

  return ready
}
