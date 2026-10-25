import { renderHook } from "@testing-library/react-native"

import {
  useGalleryIndexAnchor,
  withGalleryIndexBeneath,
} from "./gallery-anchor"

const mockStateListeners = new Set<() => void>()
const mockNavigation = {
  getState: jest.fn(),
  reset: jest.fn(),
  addListener: jest.fn((event: string, listener: () => void) => {
    if (event === "state") mockStateListeners.add(listener)
    return () => mockStateListeners.delete(listener)
  }),
}
const emitState = () => mockStateListeners.forEach((listener) => listener())
jest.mock("expo-router", () => ({ useNavigation: () => mockNavigation }))

const tabs = { name: "(tabs)", key: "tabs-1" }
const about = { name: "about", key: "about-1" }
const index = { name: "developer/gallery", key: "gallery-1" }
const story = { name: "developer/gallery/[story]", key: "story-1" }
const anchor = {
  name: "developer/gallery",
  key: "developer/gallery-anchor-story-1",
}

const stack = (
  routes: { name: string; key: string }[],
  at = routes.length - 1,
) => ({
  key: "stack-1",
  type: "stack",
  stale: false as const,
  index: at,
  routes,
})

describe("withGalleryIndexBeneath", () => {
  it("anchors a cold deep link beneath the story", () => {
    expect(withGalleryIndexBeneath(stack([tabs, story]))).toEqual(
      stack([tabs, anchor, story]),
    )
  })

  it("anchors a warm deep link above the screen the app was on", () => {
    expect(withGalleryIndexBeneath(stack([tabs, about, story]))).toEqual(
      stack([tabs, about, anchor, story]),
    )
  })

  it("leaves a story opened from the index alone", () => {
    expect(withGalleryIndexBeneath(stack([tabs, index, story]))).toBeUndefined()
  })

  it("leaves a stack whose focused route is not a story alone", () => {
    expect(withGalleryIndexBeneath(stack([tabs, story, about]))).toBeUndefined()
    expect(withGalleryIndexBeneath(stack([tabs, story], 0))).toBeUndefined()
  })

  it("ignores a missing state", () => {
    expect(withGalleryIndexBeneath(undefined)).toBeUndefined()
  })
})

describe("useGalleryIndexAnchor", () => {
  beforeEach(() => {
    mockNavigation.getState.mockReturnValue(stack([tabs, story]))
    mockNavigation.reset.mockClear()
    mockStateListeners.clear()
  })

  it("resets the stack once with the index beneath the story", async () => {
    const hook = await renderHook(() => useGalleryIndexAnchor(true))
    await hook.rerender(undefined)
    expect(mockNavigation.reset).toHaveBeenCalledTimes(1)
    expect(mockNavigation.reset).toHaveBeenCalledWith(
      stack([tabs, anchor, story]),
    )
  })

  it("re-anchors when a cold start's initial state commit reverts the reset", async () => {
    await renderHook(() => useGalleryIndexAnchor(true))
    emitState()
    expect(mockNavigation.reset).toHaveBeenCalledTimes(2)
    mockNavigation.getState.mockReturnValue(stack([tabs, anchor, story]))
    emitState()
    expect(mockNavigation.reset).toHaveBeenCalledTimes(2)
  })

  it("stops listening on unmount", async () => {
    const hook = await renderHook(() => useGalleryIndexAnchor(true))
    await hook.unmount()
    expect(mockStateListeners.size).toBe(0)
  })

  it("does nothing when disabled", async () => {
    await renderHook(() => useGalleryIndexAnchor(false))
    expect(mockNavigation.reset).not.toHaveBeenCalled()
  })

  it("does nothing when the index is already beneath", async () => {
    mockNavigation.getState.mockReturnValue(stack([tabs, index, story]))
    await renderHook(() => useGalleryIndexAnchor(true))
    expect(mockNavigation.reset).not.toHaveBeenCalled()
  })
})
