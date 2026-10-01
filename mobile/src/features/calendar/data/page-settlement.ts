import type { PageIndex } from "./page-index"
import {
  createPageWindow,
  isInPageWindow,
  type PageWindow,
  planPageRebase,
} from "./page-window"

/**
 * Epochs stamped on every UI-thread scroll report. A report whose epochs are
 * not current was produced against an older page width or content offset.
 */
export interface PagerEpochs {
  geometryEpoch: number
  rebaseEpoch: number
}

export interface PagerState extends PagerEpochs {
  window: PageWindow
  settledIndex: PageIndex
  visibleIndex: PageIndex
}

export type PagerEvent =
  /** The UI-thread rounded index crossed a page boundary. */
  | { type: "crossed"; index: PageIndex; epochs: PagerEpochs }
  /** The scroll view came to rest, page-aligned, with no finger down. */
  | { type: "settled"; index: PageIndex; epochs: PagerEpochs }
  /** The page width changed; the settled page is kept. */
  | { type: "geometryChanged" }
  /** A non-animated programmatic placement, re-based around the target. */
  | { type: "jumped"; index: PageIndex }

export function createPagerState(
  index: PageIndex,
  options?: Parameters<typeof createPageWindow>[1],
): PagerState {
  return {
    window: createPageWindow(index, options),
    settledIndex: index,
    visibleIndex: index,
    geometryEpoch: 0,
    rebaseEpoch: 0,
  }
}

export function pagerEpochs(state: PagerState): PagerEpochs {
  return {
    geometryEpoch: state.geometryEpoch,
    rebaseEpoch: state.rebaseEpoch,
  }
}

function isCurrent(state: PagerState, epochs: PagerEpochs): boolean {
  return (
    epochs.geometryEpoch === state.geometryEpoch &&
    epochs.rebaseEpoch === state.rebaseEpoch
  )
}

export function reducePager(state: PagerState, event: PagerEvent): PagerState {
  switch (event.type) {
    case "crossed":
      if (
        !isCurrent(state, event.epochs) ||
        !isInPageWindow(state.window, event.index) ||
        event.index === state.visibleIndex
      ) {
        return state
      }
      return { ...state, visibleIndex: event.index }
    case "settled": {
      if (
        !isCurrent(state, event.epochs) ||
        !isInPageWindow(state.window, event.index)
      ) {
        return state
      }
      const rebase = planPageRebase(state.window, event.index)
      if (
        rebase === null &&
        event.index === state.settledIndex &&
        event.index === state.visibleIndex
      ) {
        return state
      }
      return {
        ...state,
        settledIndex: event.index,
        visibleIndex: event.index,
        ...(rebase === null
          ? {}
          : { window: rebase, rebaseEpoch: state.rebaseEpoch + 1 }),
      }
    }
    case "geometryChanged":
      return {
        ...state,
        visibleIndex: state.settledIndex,
        geometryEpoch: state.geometryEpoch + 1,
      }
    case "jumped":
      return {
        ...state,
        window: createPageWindow(event.index, {
          radius: state.window.radius,
          rebaseMargin: state.window.rebaseMargin,
        }),
        settledIndex: event.index,
        visibleIndex: event.index,
        rebaseEpoch: state.rebaseEpoch + 1,
      }
  }
}
