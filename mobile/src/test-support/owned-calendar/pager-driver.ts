import { act, fireEvent, screen } from "@testing-library/react-native"

import { PAGE_WINDOW_RADIUS } from "@/features/calendar/data"
import { pagerPageWidth } from "@/features/calendar/renderer/owned-calendar-pager"

const CONTENT_SLOTS = 2 * PAGE_WINDOW_RADIUS + 1

export type PagerEventName =
  | "onScroll"
  | "onScrollBeginDrag"
  | "onScrollEndDrag"
  | "onMomentumScrollBegin"
  | "onMomentumScrollEnd"

/** Lets the UI-thread work scheduled by the pager (`scheduleOnUI`) run. */
export async function flushUiThread(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

/**
 * Drives the owned Calendar's horizontal pager the way the native views do:
 * a viewport layout, the content size that places the pager, then scroll
 * events in the native payload shape. Offsets are in pages from the slot the
 * pager was placed on, so a driver reads like the gesture it plays.
 */
export async function placeCalendarPager({
  width = 400,
  height = 800,
}: { width?: number; height?: number } = {}) {
  await act(async () => {
    fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width, height } },
    })
  })
  const pageWidth = pagerPageWidth(width)
  const contentWidth = CONTENT_SLOTS * pageWidth
  await act(async () => {
    fireEvent(screen.getByTestId("owned-calendar-pager"), "layout", {
      nativeEvent: {
        layout: { x: 0, y: 0, width: pageWidth, height: height },
      },
    })
    fireEvent(
      screen.getByTestId("owned-calendar-pager"),
      "contentSizeChange",
      contentWidth,
      1000,
    )
  })
  await flushUiThread()
  const origin = PAGE_WINDOW_RADIUS * pageWidth

  /** Sends one native scroll event at `pages` from the placed page, without flushing. */
  const send = (pages: number, eventName: PagerEventName = "onScroll") =>
    fireEvent.scroll(screen.getByTestId("owned-calendar-pager"), {
      nativeEvent: {
        eventName,
        contentOffset: { x: origin + pages * pageWidth, y: 0 },
        layoutMeasurement: { width: pageWidth, height: 1000 },
        contentSize: { width: contentWidth, height: 1000 },
      },
    })

  /** A finger drag from `from` that lifts at `lift` and decelerates to `to`, with no settle. */
  const swipeWithoutSettling = (from: number, lift: number, to: number) => {
    send(from, "onScrollBeginDrag")
    send((from + lift) / 2)
    send(lift)
    send(lift, "onScrollEndDrag")
    send(lift, "onMomentumScrollBegin")
    send(to)
  }

  /** A full swipe from `from` to `to` that comes to rest there. */
  const swipe = async (from: number, to: number) => {
    await act(async () => {
      swipeWithoutSettling(from, from + (to - from) * 0.6, to)
      send(to, "onMomentumScrollEnd")
    })
  }

  return { pageWidth, contentWidth, origin, send, swipeWithoutSettling, swipe }
}
