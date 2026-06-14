import { useEffect, useState } from "react"

// Max time the splash may wait for the readiness gate before dismissing anyway.
// A watchdog so a future slow/stalled gate can never brick launch: every branch
// of the gate below already resolves immediately today, but the timeout is the
// load-bearing safety net the design (D3 risk) requires — the native splash is
// held by preventAutoHideAsync() and only hideAsync() releases it, so a gate
// that never resolves would hang the app forever.
const READY_WATCHDOG_MS = 5000

// First-paint prerequisites. All resolve synchronously today, so the gate is
// satisfied on mount and the hook exists to give a future async prerequisite
// one place to gate (design D3):
//  - i18n: synchronous via the `import "@/i18n"` side-effect in the root layout
//    (initializes before render); a future async-catalog change gates here.
//  - fonts: a no-op seam while the app uses system fonts; adding expo-font's
//    `useFonts` later is a one-line `&& fontsLoaded` here.
//  - migrations: the empty-bundle `runMigrations()` is instant and idempotent
//    today. The first feature whose initial read must block on a table adopts
//    the blocking `useMigrations()` hook and gates here — the app is not
//    converted to it prematurely (R-2, storage change posture).
function prerequisitesReady(): boolean {
  const i18nReady = true
  const fontsReady = true
  const migrationsReady = true
  return i18nReady && fontsReady && migrationsReady
}

/**
 * Readiness gate: returns true once first-paint prerequisites are satisfied.
 * The reusable "render only when prerequisites are satisfied" pattern features
 * inherit. The gate always resolves — synchronously today, and never later than
 * the watchdog deadline even if a future async prerequisite stalls.
 *
 * `isReady` is injectable (default `prerequisitesReady`) so the load-bearing
 * watchdog path — unreachable today because every prerequisite is synchronous —
 * is exercisable by a test that starts the gate not-ready, the shape a future
 * async prerequisite would produce.
 */
export function useAppReady(
  isReady: () => boolean = prerequisitesReady,
): boolean {
  const [ready, setReady] = useState(isReady)

  useEffect(() => {
    if (ready) return
    // Unreachable today (prerequisites are synchronous), but the load-bearing
    // watchdog: dismiss regardless once the deadline passes so a stalled future
    // gate cannot hang the splash.
    const watchdog = setTimeout(() => setReady(true), READY_WATCHDOG_MS)
    return () => clearTimeout(watchdog)
  }, [ready])

  return ready
}
