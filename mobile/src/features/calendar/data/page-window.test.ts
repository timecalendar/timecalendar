import {
  createPageWindow,
  isInPageWindow,
  mountedPageIndexes,
  PAGE_REBASE_MARGIN,
  PAGE_WINDOW_RADIUS,
  pageContentOffset,
  pageIndexAtOffset,
  pageSlot,
  pageWindowSlotCount,
  planPageRebase,
} from "./page-window"

describe("page content window", () => {
  const window = createPageWindow(1_000)

  it("spans ±260 pages around the base index", () => {
    expect(PAGE_WINDOW_RADIUS).toBe(260)
    expect(window).toEqual({
      baseIndex: 1_000,
      firstIndex: 740,
      lastIndex: 1_260,
      radius: 260,
      rebaseMargin: PAGE_REBASE_MARGIN,
    })
    expect(Object.isFrozen(window)).toBe(true)
    expect(pageWindowSlotCount(window)).toBe(521)
    expect(isInPageWindow(window, 740)).toBe(true)
    expect(isInPageWindow(window, 1_260)).toBe(true)
    expect(isInPageWindow(window, 739)).toBe(false)
    expect(isInPageWindow(window, 1_261)).toBe(false)
  })

  it("rejects invalid shapes", () => {
    expect(() => createPageWindow(0.5)).toThrow(RangeError)
    expect(() => createPageWindow(0, { radius: 0 })).toThrow(RangeError)
    expect(() => createPageWindow(0, { radius: 2.5 })).toThrow(RangeError)
    expect(() => createPageWindow(0, { rebaseMargin: -1 })).toThrow(RangeError)
    expect(() => createPageWindow(0, { rebaseMargin: 0.5 })).toThrow(RangeError)
    expect(() => createPageWindow(0, { radius: 4, rebaseMargin: 4 })).toThrow(
      RangeError,
    )
  })

  it("maps indexes to content offsets and back", () => {
    expect(pageSlot(window, 740)).toBe(0)
    expect(pageSlot(window, 1_000)).toBe(260)
    expect(pageContentOffset(window, 1_001, 350)).toBe(261 * 350)
    expect(() => pageSlot(window, 1_261)).toThrow(RangeError)
    expect(pageIndexAtOffset(window, 261 * 350, 350)).toBe(1_001)
    expect(pageIndexAtOffset(window, 261 * 350 + 174, 350)).toBe(1_001)
    expect(pageIndexAtOffset(window, 261 * 350 + 175, 350)).toBe(1_002)
    expect(pageIndexAtOffset(window, -500, 350)).toBe(740)
    expect(pageIndexAtOffset(window, 10_000_000, 350)).toBe(1_260)
    expect(() => pageIndexAtOffset(window, 0, 0)).toThrow(RangeError)
    expect(() => pageIndexAtOffset(window, 0, Number.NaN)).toThrow(RangeError)
  })

  it("keeps the whole content within a float32-safe width", () => {
    expect(pageWindowSlotCount(window) * 430).toBeLessThan(2 ** 24 / 64)
  })

  describe("re-base planning", () => {
    it("stays put while the settled page is more than 30 pages from an edge", () => {
      expect(planPageRebase(window, 1_000)).toBeNull()
      expect(planPageRebase(window, 740 + 31)).toBeNull()
      expect(planPageRebase(window, 1_260 - 31)).toBeNull()
    })

    it("re-centres on the settled page within 30 pages of either edge", () => {
      expect(planPageRebase(window, 740 + 30)).toEqual(createPageWindow(770))
      expect(planPageRebase(window, 1_260 - 30)).toEqual(
        createPageWindow(1_230),
      )
      expect(planPageRebase(window, 740)).toEqual(createPageWindow(740))
      expect(planPageRebase(window, 1_260)).toEqual(createPageWindow(1_260))
    })

    it("re-centres on a target outside the window", () => {
      expect(planPageRebase(window, 5_000)).toEqual(createPageWindow(5_000))
      expect(planPageRebase(window, -5_000)).toEqual(createPageWindow(-5_000))
    })

    it("keeps custom radius and margin", () => {
      const small = createPageWindow(0, { radius: 10, rebaseMargin: 2 })
      expect(planPageRebase(small, 7)).toBeNull()
      expect(planPageRebase(small, 8)).toEqual(
        createPageWindow(8, { radius: 10, rebaseMargin: 2 }),
      )
    })
  })

  describe("mounted window", () => {
    it("mounts the centre ±2 pages", () => {
      expect(mountedPageIndexes(window, 1_000)).toEqual([
        998, 999, 1_000, 1_001, 1_002,
      ])
      expect(mountedPageIndexes(window, 1_000, 1)).toEqual([999, 1_000, 1_001])
    })

    it("clips the mounted pages to the content window", () => {
      expect(mountedPageIndexes(window, 740)).toEqual([740, 741, 742])
      expect(mountedPageIndexes(window, 1_260)).toEqual([1_258, 1_259, 1_260])
      expect(mountedPageIndexes(window, 2_000)).toEqual([])
    })
  })
})
