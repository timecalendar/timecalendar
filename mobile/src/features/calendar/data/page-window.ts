import type { PageIndex } from "./page-index"

export const PAGE_WINDOW_RADIUS = 260
export const PAGE_REBASE_MARGIN = 30
export const MOUNTED_PAGE_RADIUS = 2

/** The content range of the horizontal pager: `baseIndex ± radius` pages. */
export interface PageWindow {
  baseIndex: PageIndex
  firstIndex: PageIndex
  lastIndex: PageIndex
  radius: number
  rebaseMargin: number
}

export function createPageWindow(
  baseIndex: PageIndex,
  options: { radius?: number; rebaseMargin?: number } = {},
): PageWindow {
  const radius = options.radius ?? PAGE_WINDOW_RADIUS
  const rebaseMargin = options.rebaseMargin ?? PAGE_REBASE_MARGIN
  if (!Number.isSafeInteger(baseIndex)) {
    throw new RangeError("baseIndex must be a safe integer")
  }
  if (!Number.isInteger(radius) || radius < 1) {
    throw new RangeError("radius must be a positive integer")
  }
  if (!Number.isInteger(rebaseMargin) || rebaseMargin < 0) {
    throw new RangeError("rebaseMargin must be a non-negative integer")
  }
  if (rebaseMargin >= radius) {
    throw new RangeError("rebaseMargin must be smaller than radius")
  }
  return Object.freeze({
    baseIndex,
    firstIndex: baseIndex - radius,
    lastIndex: baseIndex + radius,
    radius,
    rebaseMargin,
  })
}

export function pageWindowSlotCount(window: PageWindow): number {
  return window.radius * 2 + 1
}

export function isInPageWindow(window: PageWindow, index: PageIndex): boolean {
  return index >= window.firstIndex && index <= window.lastIndex
}

export function pageSlot(window: PageWindow, index: PageIndex): number {
  if (!isInPageWindow(window, index)) {
    throw new RangeError("index is outside the page window")
  }
  return index - window.firstIndex
}

export function pageContentOffset(
  window: PageWindow,
  index: PageIndex,
  pageWidth: number,
): number {
  return pageSlot(window, index) * pageWidth
}

/** The page nearest to a horizontal content offset, clamped to the window. */
export function pageIndexAtOffset(
  window: PageWindow,
  offset: number,
  pageWidth: number,
): PageIndex {
  if (!(pageWidth > 0)) throw new RangeError("pageWidth must be positive")
  const slot = Math.min(
    Math.max(Math.round(offset / pageWidth), 0),
    pageWindowSlotCount(window) - 1,
  )
  return window.firstIndex + slot
}

/**
 * A new window centred on `index` when it lies outside the window or within
 * `rebaseMargin` pages of an edge, otherwise `null`.
 */
export function planPageRebase(
  window: PageWindow,
  index: PageIndex,
): PageWindow | null {
  const nearEdge =
    !isInPageWindow(window, index) ||
    Math.min(index - window.firstIndex, window.lastIndex - index) <=
      window.rebaseMargin
  return nearEdge
    ? createPageWindow(index, {
        radius: window.radius,
        rebaseMargin: window.rebaseMargin,
      })
    : null
}

/** The pages to mount around `center`: `center ± MOUNTED_PAGE_RADIUS`, inside the window. */
export function mountedPageIndexes(
  window: PageWindow,
  center: PageIndex,
  radius: number = MOUNTED_PAGE_RADIUS,
): readonly PageIndex[] {
  const first = Math.max(center - radius, window.firstIndex)
  const last = Math.min(center + radius, window.lastIndex)
  return Array.from(
    { length: Math.max(last - first + 1, 0) },
    (_, i) => first + i,
  )
}
