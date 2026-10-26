import { renderHook } from "@testing-library/react-native"
import { AccessibilityInfo } from "react-native"

import { usePlatform } from "@/test-support/platform"

import { useErrorAnnouncement } from "./use-error-announcement"

type Props = { message?: string; announcementKey?: string; native?: boolean }

let ios: jest.SpiedFunction<
  typeof AccessibilityInfo.announceForAccessibilityWithOptions
>
let android: jest.SpiedFunction<
  typeof AccessibilityInfo.announceForAccessibility
>

beforeEach(() => {
  ios = jest
    .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
    .mockImplementation(() => {})
  android = jest
    .spyOn(AccessibilityInfo, "announceForAccessibility")
    .mockImplementation(() => {})
})
afterEach(() => {
  ios.mockRestore()
  android.mockRestore()
})

function mount(initialProps: Props) {
  return renderHook(
    ({ message, announcementKey, native }: Props) =>
      useErrorAnnouncement(message, {
        ...(native === undefined ? {} : { native }),
        ...(announcementKey === undefined ? {} : { key: announcementKey }),
      }),
    { initialProps },
  )
}

describe("on iOS", () => {
  usePlatform("ios")

  it("queues the announcement on mount", async () => {
    await mount({ message: "Failed" })
    expect(ios).toHaveBeenCalledTimes(1)
    expect(ios).toHaveBeenCalledWith("Failed", { queue: true })
  })

  it("re-announces a changed message without a key", async () => {
    const hook = await mount({ message: "Failed" })
    await hook.rerender({ message: "Failed" })
    expect(ios).toHaveBeenCalledTimes(1)
    await hook.rerender({ message: "Still failing" })
    expect(ios).toHaveBeenCalledTimes(2)
    expect(ios).toHaveBeenLastCalledWith("Still failing", { queue: true })
  })

  it("keeps quiet on a message change under the same key", async () => {
    const hook = await mount({
      message: "No result for a",
      announcementKey: "k",
    })
    await hook.rerender({ message: "No result for ab", announcementKey: "k" })
    expect(ios).toHaveBeenCalledTimes(1)
    expect(ios).toHaveBeenCalledWith("No result for a", { queue: true })
  })

  it("announces the latest message when the key changes", async () => {
    const hook = await mount({ message: "Loading", announcementKey: "loading" })
    await hook.rerender({ message: "Nothing here", announcementKey: "empty" })
    expect(ios).toHaveBeenCalledTimes(2)
    expect(ios).toHaveBeenLastCalledWith("Nothing here", { queue: true })
  })

  it.each([undefined, ""])("never announces %p", async (message) => {
    const hook = await mount({ ...(message === undefined ? {} : { message }) })
    await hook.rerender({
      ...(message === undefined ? {} : { message }),
      announcementKey: "k",
    })
    expect(ios).not.toHaveBeenCalled()
  })
})

describe("on Android", () => {
  usePlatform("android")

  it("stays silent unless native", async () => {
    await mount({ message: "Failed" })
    await mount({ message: "Failed", announcementKey: "k" })
    expect(android).not.toHaveBeenCalled()
    expect(ios).not.toHaveBeenCalled()
  })

  it("announces explicitly for native hosts", async () => {
    await mount({ message: "Failed", native: true })
    expect(android).toHaveBeenCalledTimes(1)
    expect(android).toHaveBeenCalledWith("Failed")
    expect(ios).not.toHaveBeenCalled()
  })
})
