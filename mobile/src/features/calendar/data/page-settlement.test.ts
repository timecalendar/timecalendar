import {
  createPagerState,
  pagerEpochs,
  type PagerEvent,
  type PagerState,
  reducePager,
} from "./page-settlement"
import { createPageWindow, mountedPageIndexes } from "./page-window"

function settled(state: PagerState, index: number): PagerEvent {
  return { type: "settled", index, epochs: pagerEpochs(state) }
}

function crossed(state: PagerState, index: number): PagerEvent {
  return { type: "crossed", index, epochs: pagerEpochs(state) }
}

describe("pager settlement reducer", () => {
  const initial = createPagerState(1_000)

  it("starts settled on the initial page in a window centred on it", () => {
    expect(initial).toEqual({
      window: createPageWindow(1_000),
      settledIndex: 1_000,
      visibleIndex: 1_000,
      geometryEpoch: 0,
      rebaseEpoch: 0,
    })
    expect(pagerEpochs(initial)).toEqual({ geometryEpoch: 0, rebaseEpoch: 0 })
  })

  it("moves the mounted window on crossings without settling", () => {
    const next = reducePager(initial, crossed(initial, 1_001))
    expect(next.visibleIndex).toBe(1_001)
    expect(next.settledIndex).toBe(1_000)
    expect(reducePager(next, crossed(next, 1_001))).toBe(next)
    expect(reducePager(next, crossed(next, 5_000))).toBe(next)
  })

  it("commits the settled index once and ignores repeats", () => {
    const moved = reducePager(initial, crossed(initial, 1_001))
    const next = reducePager(moved, settled(moved, 1_001))
    expect(next).toMatchObject({ settledIndex: 1_001, visibleIndex: 1_001 })
    expect(next.window).toBe(initial.window)
    expect(reducePager(next, settled(next, 1_001))).toBe(next)
    expect(reducePager(next, settled(next, 5_000))).toBe(next)
  })

  it("settles back on the same page after a cancelled drag", () => {
    const dragged = reducePager(initial, crossed(initial, 999))
    const back = reducePager(dragged, settled(dragged, 1_000))
    expect(back).toMatchObject({ settledIndex: 1_000, visibleIndex: 1_000 })
  })

  it("drops reports stamped with a stale geometry epoch", () => {
    const stale = pagerEpochs(initial)
    const resized = reducePager(reducePager(initial, crossed(initial, 1_001)), {
      type: "geometryChanged",
    })
    expect(resized).toMatchObject({
      settledIndex: 1_000,
      visibleIndex: 1_000,
      geometryEpoch: 1,
    })
    expect(
      reducePager(resized, { type: "settled", index: 1_003, epochs: stale }),
    ).toBe(resized)
    expect(
      reducePager(resized, { type: "crossed", index: 1_003, epochs: stale }),
    ).toBe(resized)
  })

  it("re-bases at settle near an edge and drops reports from before the re-base", () => {
    let state = createPagerState(0, { radius: 10, rebaseMargin: 2 })
    const beforeRebase = pagerEpochs(state)
    state = reducePager(state, settled(state, 7))
    expect(state.window.baseIndex).toBe(0)
    state = reducePager(state, settled(state, 8))
    expect(state).toMatchObject({
      settledIndex: 8,
      visibleIndex: 8,
      rebaseEpoch: 1,
      window: { baseIndex: 8, firstIndex: -2, lastIndex: 18 },
    })
    expect(
      reducePager(state, { type: "settled", index: 9, epochs: beforeRebase }),
    ).toBe(state)
  })

  it("re-bases around a programmatic jump, in or out of the window", () => {
    const far = reducePager(initial, { type: "jumped", index: 20_000 })
    expect(far).toMatchObject({
      settledIndex: 20_000,
      visibleIndex: 20_000,
      rebaseEpoch: 1,
      window: createPageWindow(20_000),
    })
    const near = reducePager(far, { type: "jumped", index: 20_001 })
    expect(near.rebaseEpoch).toBe(2)
    expect(
      reducePager(near, {
        type: "settled",
        index: 20_000,
        epochs: pagerEpochs(far),
      }),
    ).toBe(near)
  })

  it.each([1, -1])(
    "pages 500 times in direction %i with a bounded window and exact index",
    (direction) => {
      let state = initial
      let rebases = 0
      for (let step = 1; step <= 500; step += 1) {
        const target = initial.settledIndex + direction * step
        state = reducePager(state, crossed(state, target))
        const before = state.rebaseEpoch
        state = reducePager(state, settled(state, target))
        if (state.rebaseEpoch !== before) rebases += 1
        expect(state.settledIndex).toBe(target)
        const distanceToEdge = Math.min(
          state.settledIndex - state.window.firstIndex,
          state.window.lastIndex - state.settledIndex,
        )
        expect(distanceToEdge).toBeGreaterThan(state.window.rebaseMargin)
        expect(mountedPageIndexes(state.window, state.visibleIndex)).toEqual(
          [-2, -1, 0, 1, 2].map((offset) => target + offset),
        )
        expect(Object.keys(state)).toHaveLength(5)
      }
      expect(rebases).toBe(2)
    },
  )
})
