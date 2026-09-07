import { act, renderHook } from "@testing-library/react-native"

import { getString, remove, setString, STORAGE_KEYS } from "@/storage"

import {
  dismissFirstIcalReminder,
  getFirstIcalReminderState,
  getOnboardingResolution,
  setOnboardingResolution,
  useFirstIcalReminderState,
  useOnboardingResolution,
} from "./index"

beforeEach(() => {
  remove(STORAGE_KEYS.onboardingResolution)
  remove(STORAGE_KEYS.firstIcalReminderState)
})

describe("first-launch stores", () => {
  it("total-decodes missing and malformed values", () => {
    expect(getOnboardingResolution()).toBeUndefined()
    expect(getFirstIcalReminderState()).toBe("pending")

    setString(STORAGE_KEYS.onboardingResolution, "complete")
    setString(STORAGE_KEYS.firstIcalReminderState, "hidden")

    expect(getOnboardingResolution()).toBeUndefined()
    expect(getFirstIcalReminderState()).toBe("pending")
  })

  it.each(["skipped", "calendarImported"] as const)(
    "round-trips onboarding resolution %s",
    (resolution) => {
      setOnboardingResolution(resolution)
      expect(getOnboardingResolution()).toBe(resolution)
    },
  )

  it("keeps onboarding and reminder writes independent", () => {
    setOnboardingResolution("skipped")
    expect(getFirstIcalReminderState()).toBe("pending")

    dismissFirstIcalReminder()
    expect(getOnboardingResolution()).toBe("skipped")
    expect(getFirstIcalReminderState()).toBe("dismissed")
  })

  it("reacts to writes and reproduces durable relaunch reads", async () => {
    const stores = await renderHook(() => ({
      resolution: useOnboardingResolution(),
      reminder: useFirstIcalReminderState(),
    }))

    await act(async () => setOnboardingResolution("calendarImported"))
    await act(async () => dismissFirstIcalReminder())

    expect(stores.result.current).toEqual({
      resolution: "calendarImported",
      reminder: "dismissed",
    })
    expect(getString(STORAGE_KEYS.onboardingResolution)).toBe(
      "calendarImported",
    )

    await stores.unmount()
    const relaunched = await renderHook(() => ({
      resolution: useOnboardingResolution(),
      reminder: useFirstIcalReminderState(),
    }))
    expect(relaunched.result.current).toEqual({
      resolution: "calendarImported",
      reminder: "dismissed",
    })
  })
})
