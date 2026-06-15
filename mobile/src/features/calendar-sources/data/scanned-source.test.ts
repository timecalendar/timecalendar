import { act, renderHook } from "@testing-library/react-native"

import {
  clearScannedSource,
  getScannedSource,
  setScannedSource,
  useScannedSource,
} from "./scanned-source"

afterEach(() => {
  clearScannedSource()
})

describe("scanned-source holder", () => {
  it("starts empty", () => {
    expect(getScannedSource()).toBeNull()
  })

  it("holds a source after setting it", () => {
    setScannedSource({ url: "https://example.com/cal.ics" })
    expect(getScannedSource()).toEqual({ url: "https://example.com/cal.ics" })
  })

  it("resets to null when cleared", () => {
    setScannedSource({ url: "https://example.com/cal.ics" })
    clearScannedSource()
    expect(getScannedSource()).toBeNull()
  })

  it("re-renders a reactive consumer when a source lands and clears", async () => {
    const { result } = await renderHook(() => useScannedSource())
    expect(result.current).toBeNull()

    await act(async () => {
      setScannedSource({ url: "https://example.com/cal.ics" })
    })
    expect(result.current).toEqual({ url: "https://example.com/cal.ics" })

    await act(async () => {
      clearScannedSource()
    })
    expect(result.current).toBeNull()
  })
})
