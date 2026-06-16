import { useEffect, useRef } from "react"

import { useSyncCalendars } from "./sync"

// The startup sync trigger (design D5): a fire-and-forget sync kicked once at app
// start, mirroring `void runMigrations()` / `import "@/i18n"`. Because the sync is
// a hook (it wires the generated mutation), the startup trigger is this once-effect
// mounted in the root layout. A failed startup sync is SILENT (no surfaced error) —
// an offline launch shows the last-good rows; the visible error surface is the
// user-initiated pull-to-refresh on the calendar screen. The ref guards against a
// double-fire under React strict-mode / re-render.
export function useStartupSync(): void {
  const { sync } = useSyncCalendars()
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    void sync()
  }, [sync])
}
