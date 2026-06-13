import { act, render } from "@testing-library/react-native"
import { AccessibilityInfo, Animated } from "react-native"

import { SplashScreen } from "@/components/splash-screen"

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

// Controllable readiness: false keeps the overlay mounted for render assertions.
const mockUseAppReady = jest.fn<boolean, []>()
jest.mock("@/hooks/use-app-ready", () => ({
  useAppReady: () => mockUseAppReady(),
}))

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
    beforeEach(() => mockUseAppReady.mockReturnValue(false))

    it("renders the localized brand string through the real theme + i18n tree", async () => {
      const { getByText } = await render(<SplashScreen />)

      // EN catalog value (jest-expo device locale resolves to en), not the key.
      expect(getByText("TimeCalendar")).toBeTruthy()
    })

    it("exposes an accessible loading status that resolves in the tree", async () => {
      // Resolved semantic (role + label), not merely a prop passed — like the
      // themed-text header proof.
      const { getByRole } = await render(<SplashScreen />)

      const status = getByRole("progressbar", { name: "Loading…" })
      expect(status).toBeTruthy()
    })

    it("does not disable font scaling on its brand text", async () => {
      const { getByText } = await render(<SplashScreen />)

      expect(getByText("TimeCalendar").props.allowFontScaling).not.toBe(false)
    })
  })

  describe("dismissal (readiness true, timers controlled)", () => {
    beforeEach(() => {
      mockUseAppReady.mockReturnValue(true)
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it("dismisses with no animation scheduled under reduced motion", async () => {
      jest
        .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
        .mockResolvedValueOnce(true)
      const timing = jest.spyOn(Animated, "timing")

      const { queryByRole } = await render(<SplashScreen />)

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
      jest
        .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
        .mockResolvedValueOnce(false)
      const timing = jest.spyOn(Animated, "timing")

      const { queryByRole } = await render(<SplashScreen />)

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
})
