// A `Platform.OS` override that is always undone, even when the test throws.
//
// `jest.replaceProperty(Platform, "OS", "android")` called inline in an `it`
// leaks: the handle is only restored by `jest.restoreAllMocks()` or at the end
// of the file, so every later test in the suite keeps seeing the foreign
// platform. Under the shipped declaration order that is dormant, but
// `jest --randomize` failed 22 of the first 25 seeds on
// `user-calendars-screen.test.tsx` — the iOS-only affordances vanish because a
// test declared later reads `Platform.OS` as "android" (TIM-273 task 3; a
// separate defect from the per-test budget, not the cause of that ticket).
//
// Restoring in `afterEach` — not at the end of the test body — is the point:
// an inline `.restore()` is skipped whenever the test throws first, which turns
// one genuine failure into a red tail of unrelated tests and reads as a flake.
//
// Do NOT reach for `jest.restoreAllMocks()` instead. It would also discard the
// suite-wide `AccessibilityInfo` spies installed by `jest/setup-splash.ts`,
// silently un-mocking native reads for every later test — the same hazard class
// `jest/setup-localization.ts` documents.
import { Platform } from "react-native"

/**
 * Pins `Platform.OS` for every test in the enclosing `describe`, and restores
 * the real value afterwards. Call at `describe` scope, not inside an `it`:
 *
 *     describe("on Android", () => {
 *       usePlatform("android")
 *       it("renders the FAB", async () => { … })
 *     })
 */
export const usePlatform = (os: typeof Platform.OS): void => {
  let override: ReturnType<typeof jest.replaceProperty> | undefined

  beforeEach(() => {
    override = jest.replaceProperty(Platform, "OS", os)
  })

  afterEach(() => {
    override?.restore()
    override = undefined
  })
}
