// The Calendar surface's ONE displayed-precision clock. Everything that means
// "now" on the Calendar route — the dated-header Today cue, the Today action,
// and the timeline's current-time indicator — reads this single value, so they
// can never disagree and they roll over midnight together.
//
// It is also the calendar feature's only timer owner: the owned renderer arms
// none. The tick is aligned to the wall-clock minute (not a free-running 60 s
// interval) because minute alignment is what makes the indicator move when the
// displayed `HH:mm` actually changes, and it makes the tick that crosses
// midnight the day-rollover recomputation. Work is armed only while the route
// is focused AND the application is foreground; blur, a non-active application
// state, and unmount clear the pending handle and schedule nothing.

import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { AppState } from "react-native"

const MINUTE_MS = 60_000
// A 50 ms cushion past the boundary, so a timer that fires a hair early still
// reads the new minute (the cadence `use-home-screen-controller` already runs).
const BOUNDARY_GUARD_MS = 50

/** Milliseconds from now until just past the next wall-clock minute boundary. */
function msToNextMinute(): number {
  return MINUTE_MS + BOUNDARY_GUARD_MS - (Date.now() % MINUTE_MS)
}

const systemNow = () => new Date()

export function useCalendarClock({
  now = systemNow,
}: { now?: () => Date } = {}): Date {
  const [value, setValue] = useState(now)

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout> | undefined
      const clear = () => {
        if (timer === undefined) return
        clearTimeout(timer)
        timer = undefined
      }
      const tick = () => {
        setValue(now())
        timer = setTimeout(tick, msToNextMinute())
      }
      // Focus and every foreground return recompute the clock immediately, then
      // re-arm exactly one timer — never two.
      const arm = () => {
        clear()
        tick()
      }
      if (AppState.currentState === "active") arm()
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") arm()
        else clear()
      })
      return () => {
        clear()
        subscription.remove()
      }
    }, [now]),
  )

  return value
}
