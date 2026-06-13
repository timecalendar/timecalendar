import { render, waitFor } from "@testing-library/react-native"
import { AccessibilityInfo, Animated } from "react-native"

import { SplashScreen } from "@/components/splash-screen"

// Proof that the splash overlay wiring resolves through the real theme + i18n +
// accessibility tree (mirrors the i18n/a11y/firebase/theming proofs). The
// native expo-splash-screen module and AccessibilityInfo are mocked suite-wide
// in jest/setup-splash.ts; reduced-motion is overridden per-case below to drive
// both branches (the layer lint can't see which view animates — D2/D7).

describe("SplashScreen", () => {
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

  it("dismisses with no animation scheduled under reduced motion", async () => {
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValueOnce(true)
    const timing = jest.spyOn(Animated, "timing")

    const { queryByRole } = await render(<SplashScreen />)

    // The branch is honored (the layer lint can't see this): no fade is
    // scheduled and the overlay unmounts once ready.
    await waitFor(() => expect(queryByRole("progressbar")).toBeNull())
    expect(timing).not.toHaveBeenCalled()
  })

  it("schedules the fade and dismisses once ready when motion is allowed", async () => {
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValueOnce(false)
    const timing = jest.spyOn(Animated, "timing")

    const { queryByRole } = await render(<SplashScreen />)

    // The fade path is taken and the overlay ultimately dismisses once ready.
    await waitFor(() => expect(queryByRole("progressbar")).toBeNull())
    expect(timing).toHaveBeenCalled()
  })
})
