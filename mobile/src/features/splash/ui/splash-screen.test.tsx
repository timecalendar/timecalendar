import { act, fireEvent, render } from "@testing-library/react-native"
import { AccessibilityInfo, Animated } from "react-native"

import { SplashScreen } from "./splash-screen"

// Proof that the splash overlay wiring resolves through the real theme + i18n +
// accessibility tree (mirrors the i18n/a11y/firebase/theming proofs). The
// native expo-splash-screen module and AccessibilityInfo are mocked suite-wide
// in jest/setup-splash.ts; reduced-motion is overridden per-case below to drive
// both branches (the layer lint can't see which view animates — D2/D7).
//
// Determinism: the overlay self-unmounts once `useAppReady()` resolves and the
// fade completes, so any assertion on the live overlay races that dismissal
// (the CI flake this test paid off). The two classes of assertion are split:
//  - "the overlay renders X" cases pin readiness to false (mock `useAppReady`)
//    so the overlay can never dismiss — the assertion is on a stable tree.
//  - "the overlay dismisses" cases keep readiness true (real hook) and drive
//    the async reduced-motion read + microtask/animation under fake timers with
//    explicit `act`, so dismissal is observed at a controlled point, never by
//    real-time ordering.

const onRetry = jest.fn()

// Drain the microtask chain the dismissal walks (promise read → effect re-run →
// queued dismissal commit). The reduced-motion branch defers via
// `queueMicrotask`, which jest's fake timers control, so flush jest's ticks too;
// real awaited turns settle the promise hops. Deterministic, no real time.
async function flushMicrotasks(turns = 4): Promise<void> {
  for (let i = 0; i < turns; i++) {
    jest.runAllTicks()
    await Promise.resolve()
  }
}

describe("SplashScreen", () => {
  describe("while held mounted (readiness pinned false)", () => {
    it("renders the localized brand string through the real theme + i18n tree", async () => {
      const { getByText } = await render(
        <SplashScreen
          ready={false}
          recoveryVisible={false}
          onRetry={onRetry}
        />,
      )

      // EN catalog value (jest-expo device locale resolves to en), not the key.
      expect(getByText("TimeCalendar")).toBeTruthy()
    })

    it("exposes an accessible loading status that resolves in the tree", async () => {
      // Resolved semantic (role + label), not merely a prop passed — like the
      // themed-text header proof.
      const { getByRole } = await render(
        <SplashScreen
          ready={false}
          recoveryVisible={false}
          onRetry={onRetry}
        />,
      )

      const status = getByRole("progressbar", { name: "Loading…" })
      expect(status).toBeTruthy()
    })

    it("does not disable font scaling on its brand text", async () => {
      const { getByText } = await render(
        <SplashScreen
          ready={false}
          recoveryVisible={false}
          onRetry={onRetry}
        />,
      )

      expect(getByText("TimeCalendar").props.allowFontScaling).not.toBe(false)
    })
  })

  describe("dismissal (readiness true, timers controlled)", () => {
    const isReduceMotionEnabled = jest.spyOn(
      AccessibilityInfo,
      "isReduceMotionEnabled",
    )
    const timing = jest.spyOn(Animated, "timing")

    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      try {
        jest.runOnlyPendingTimers()
      } finally {
        timing.mockClear()
        isReduceMotionEnabled.mockReset().mockResolvedValue(false)
        jest.useRealTimers()
      }
    })

    it("dismisses with no animation scheduled under reduced motion", async () => {
      isReduceMotionEnabled.mockResolvedValueOnce(true)

      const { queryByRole } = await render(
        <SplashScreen ready recoveryVisible={false} onRetry={onRetry} />,
      )

      // Flush the async reduced-motion read and the dismissal microtask it
      // unblocks (the branch the layer lint can't see): the read resolves, the
      // effect re-runs and queues the motionless dismissal, which commits. Each
      // hop is a microtask, so drain a few turns deterministically — no timer,
      // no real-time ordering.
      await act(async () => {
        await flushMicrotasks()
      })

      expect(queryByRole("progressbar")).toBeNull()
      expect(timing).not.toHaveBeenCalled()
    })

    it("schedules the fade and dismisses once ready when motion is allowed", async () => {
      isReduceMotionEnabled.mockResolvedValueOnce(false)

      const { queryByRole } = await render(
        <SplashScreen ready recoveryVisible={false} onRetry={onRetry} />,
      )

      // Flush the reduced-motion read so the fade is scheduled, then run the
      // fade duration so its completion callback unmounts the overlay.
      await act(async () => {
        await flushMicrotasks()
      })
      expect(timing).toHaveBeenCalled()

      await act(async () => {
        jest.runAllTimers()
        await flushMicrotasks()
      })

      expect(queryByRole("progressbar")).toBeNull()
    })
  })

  it("shows an accessible recovery action without dismissing", async () => {
    const { getByRole } = await render(
      <SplashScreen ready={false} recoveryVisible onRetry={onRetry} />,
    )

    expect(getByRole("alert", { name: "Startup needs attention" })).toBeTruthy()
    const retry = getByRole("button", { name: "Retry" })
    await fireEvent.press(retry)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
