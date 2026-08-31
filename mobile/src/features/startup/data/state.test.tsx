import { act, renderHook } from "@testing-library/react-native"

import {
  beginLaunchNavigation,
  commitLaunch,
  failLaunch,
  getLaunchState,
  resetLaunchStateForTests,
  retryLaunch,
  useLaunchCommitted,
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

  it("normalizes non-Error failures", () => {
    failLaunch("broken")
    expect(getLaunchState()).toMatchObject({
      kind: "failure",
      error: expect.objectContaining({ message: "broken" }),
    })
  })

  it("reports commitment reactively", async () => {
    const { result } = await renderHook(() => useLaunchCommitted())
    expect(result.current).toBe(false)
    await act(async () => commitLaunch("/"))
    expect(result.current).toBe(true)
  })
})
