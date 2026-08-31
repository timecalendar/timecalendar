import { act, renderHook } from "@testing-library/react-native"

import {
  beginLaunchNavigation,
  commitLaunch,
  failLaunch,
  resetLaunchStateForTests,
  retryLaunch,
  useLaunchState,
} from "./state"

describe("launch state", () => {
  beforeEach(resetLaunchStateForTests)

  it("tracks navigation commitment once", async () => {
    const { result } = await renderHook(() => useLaunchState())
    await act(async () => beginLaunchNavigation("/calendar"))
    expect(result.current).toMatchObject({
      kind: "navigating",
      target: "/calendar",
    })
    await act(async () => commitLaunch("/calendar"))
    expect(result.current).toMatchObject({
      kind: "committed",
      target: "/calendar",
    })
  })

  it("exposes failure and increments only an explicit retry attempt", async () => {
    const { result } = await renderHook(() => useLaunchState())
    await act(async () => failLaunch(new Error("boom")))
    expect(result.current.kind).toBe("failure")
    await act(async () => retryLaunch())
    expect(result.current).toEqual({ kind: "resolving", attempt: 1 })
  })
})
