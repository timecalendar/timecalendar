import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { PixelRatio, Platform } from "react-native"
import { Gesture, type GestureType } from "react-native-gesture-handler"
import Animated, {
  scrollTo,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated"
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets"

import {
  createPageWindow,
  HOURS_COLUMN_WIDTH,
  mountedPageIndexes,
  PAGE_WINDOW_RADIUS,
  type PageIndex,
  pageSlot,
  type PageSpace,
  planPageRebase,
} from "@/features/calendar/data"

import { useScrollLockProps } from "./owned-calendar-geometry"
import { pagingLog } from "./owned-calendar-paging-log"

const PIXEL_RATIO = PixelRatio.get()
const ALIGNMENT_TOLERANCE = 1 / PIXEL_RATIO
const CONTENT_SLOTS = 2 * PAGE_WINDOW_RADIUS + 1
/** A chained swipe shorter than this share of a page is left to the native snap. */
const CHAINED_SWIPE_INTENT = 0.05

/** The horizontal pager's page width: the viewport beside the hour gutter, on device pixels. */
export function pagerPageWidth(viewportWidth: number): number {
  return Math.max(
    Math.round((viewportWidth - HOURS_COLUMN_WIDTH) * PIXEL_RATIO) /
      PIXEL_RATIO,
    0,
  )
}

type Placement = { id: number; index: PageIndex | null; animated: boolean }

type PagerState = {
  spaceKey: string
  baseIndex: PageIndex
  center: PageIndex
  settled: PageIndex
  placement: Placement
}

function initialPagerState(spaceKey: string, index: PageIndex): PagerState {
  return {
    spaceKey,
    baseIndex: index,
    center: index,
    settled: index,
    placement: { id: 0, index, animated: false },
  }
}

/**
 * The windowed horizontal pager. The UI thread owns motion and settlement: it
 * derives the rounded and settled page from the native offset and tells React
 * only about page crossings and settles. Pages are absolute indexes, so a
 * report never depends on which content window React has rendered.
 */
export function useOwnedCalendarPager({
  space,
  anchorIndex,
  pageWidth,
  scrollLocked,
  pinchGesture,
  trackNativeTouch,
  onSettled,
  onCenterChange,
}: {
  space: PageSpace
  anchorIndex: PageIndex
  pageWidth: number
  scrollLocked: SharedValue<boolean>
  pinchGesture: GestureType
  trackNativeTouch: (axis: "horizontal", down: boolean) => void
  onSettled: (index: PageIndex) => void
  onCenterChange: (index: PageIndex) => void
}) {
  const spaceKey = `${space.mode}:${space.firstWeekday}`
  const [stored, setState] = useState(() =>
    initialPagerState(spaceKey, anchorIndex),
  )
  let state = stored
  if (stored.spaceKey !== spaceKey) {
    state = initialPagerState(spaceKey, anchorIndex)
    setState(state)
  }
  const window = createPageWindow(state.baseIndex)
  const contentWidth = CONTENT_SLOTS * pageWidth

  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollX = useSharedValue(0)
  const positioned = useSharedValue(false)
  const dragging = useSharedValue(false)
  const momentum = useSharedValue(false)
  const roundedIndex = useSharedValue(anchorIndex)
  const settledIndex = useSharedValue(anchorIndex)
  const firstIndex = useSharedValue(window.firstIndex)
  const placedWidth = useSharedValue(0)
  const travel = useSharedValue(0)
  const dragStartX = useSharedValue(0)
  const chainedFromSlot = useSharedValue(Number.NaN)
  const chainedTravel = useSharedValue(0)
  const aimedSlot = useSharedValue(Number.NaN)
  // Android snaps a lifted drag to the next page boundary from the lift
  // position. A swipe that starts while the previous snap is still running in
  // the same direction would then only finish that page, so it is re-aimed one
  // page further. A reversal already lands right from where the finger lifts.
  const aimsChainedSwipes = Platform.OS === "android"
  const appliedPlacement = useRef(0)
  const placedFor = useRef<string | null>(null)
  const reported = useRef({ spaceKey, index: anchorIndex })
  const crossingStartedAt = useRef(0)

  const onCross = (index: PageIndex) => {
    crossingStartedAt.current = pagingLog.now()
    setState((current) =>
      current.center === index ? current : { ...current, center: index },
    )
    onCenterChange(index)
  }

  const onSettle = (index: PageIndex) => {
    reported.current = { spaceKey, index }
    pagingLog.settle(index)
    setState((current) => {
      const rebase = planPageRebase(createPageWindow(current.baseIndex), index)
      return {
        ...current,
        center: index,
        settled: index,
        ...(rebase === null
          ? {}
          : {
              baseIndex: rebase.baseIndex,
              placement: {
                id: current.placement.id + 1,
                index: null,
                animated: false,
              },
            }),
      }
    })
    onCenterChange(index)
    onSettled(index)
  }

  // An event describes this content only when its viewport and content width
  // are the ones the last placement laid out; anything else predates a resize
  // or a remount and is ignored until the pager is placed again.
  const describesPlacedContent = (event: {
    layoutMeasurement: { width: number }
    contentSize: { width: number }
  }) => {
    "worklet"
    const width = placedWidth.get()
    return (
      width > 0 &&
      Math.abs(event.layoutMeasurement.width - width) < 1 &&
      Math.abs(event.contentSize.width - CONTENT_SLOTS * width) < 1
    )
  }

  const settleIfAligned = (x: number) => {
    "worklet"
    if (dragging.get() || momentum.get()) return
    const width = placedWidth.get()
    const slot = Math.round(x / width)
    if (Math.abs(x - slot * width) > ALIGNMENT_TOLERANCE) return
    const aimed = aimedSlot.get()
    if (!Number.isNaN(aimed) && slot !== aimed) return
    aimedSlot.set(Number.NaN)
    const index = firstIndex.get() + slot
    if (index === settledIndex.get()) return
    settledIndex.set(index)
    scheduleOnRN(onSettle, index)
  }

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (!describesPlacedContent(event)) return
      const x = event.contentOffset.x
      if (x !== scrollX.get()) travel.set(Math.sign(x - scrollX.get()))
      scrollX.set(x)
      positioned.set(true)
      const index = firstIndex.get() + Math.round(x / placedWidth.get())
      if (index !== roundedIndex.get()) {
        roundedIndex.set(index)
        scheduleOnRN(onCross, index)
      }
      settleIfAligned(x)
    },
    onBeginDrag: (event) => {
      dragging.set(true)
      momentum.set(false)
      chainedFromSlot.set(Number.NaN)
      aimedSlot.set(Number.NaN)
      if (!describesPlacedContent(event)) return
      const x = event.contentOffset.x
      dragStartX.set(x)
      const width = placedWidth.get()
      const slot = x / width
      if (
        !aimsChainedSwipes ||
        Math.abs(x - Math.round(slot) * width) <= ALIGNMENT_TOLERANCE
      )
        return
      chainedTravel.set(travel.get() < 0 ? -1 : 1)
      chainedFromSlot.set(travel.get() < 0 ? Math.floor(slot) : Math.ceil(slot))
      // The scroll command aborts the running snap, so the finger owns the offset.
      scrollTo(scrollRef, x, 0, false)
    },
    onEndDrag: (event) => {
      dragging.set(false)
      if (!describesPlacedContent(event)) return
      const x = event.contentOffset.x
      const fromSlot = chainedFromSlot.get()
      if (!Number.isNaN(fromSlot)) {
        chainedFromSlot.set(Number.NaN)
        const width = placedWidth.get()
        const displacement = x - dragStartX.get()
        if (
          Math.abs(displacement) >= CHAINED_SWIPE_INTENT * width &&
          Math.sign(displacement) === chainedTravel.get()
        ) {
          const target = fromSlot + chainedTravel.get()
          aimedSlot.set(target)
          // The native snap starts after this event; the next frame replaces it.
          requestAnimationFrame(() => {
            scrollTo(scrollRef, target * width, 0, true)
          })
        }
      }
      settleIfAligned(x)
    },
    // iOS sends no end-drag for a grab released without moving mid-fling;
    // the deceleration that resumes is the drag's end.
    onMomentumBegin: () => {
      dragging.set(false)
      momentum.set(true)
    },
    onMomentumEnd: (event) => {
      momentum.set(false)
      if (describesPlacedContent(event)) settleIfAligned(event.contentOffset.x)
    },
  })

  // A target of `null` keeps the current absolute position across a new
  // content window, which is how a re-base moves the offset without motion.
  const place = (
    first: PageIndex,
    width: number,
    target: PageIndex | null,
    animated: boolean,
  ) => {
    "worklet"
    const previousWidth = placedWidth.get()
    const position =
      target ??
      (previousWidth > 0
        ? firstIndex.get() + scrollX.get() / previousWidth
        : first + PAGE_WINDOW_RADIUS)
    firstIndex.set(first)
    placedWidth.set(width)
    roundedIndex.set(Math.round(position))
    scrollTo(scrollRef, (position - first) * width, 0, animated)
  }

  useLayoutEffect(() => {
    positioned.set(false)
    placedWidth.set(0)
  }, [spaceKey, positioned, placedWidth])

  useLayoutEffect(() => {
    const { placement } = state
    if (pageWidth <= 0 || appliedPlacement.current === placement.id) return
    if (placedFor.current !== `${spaceKey}:${pageWidth}`) return
    appliedPlacement.current = placement.id
    scheduleOnUI(
      place,
      window.firstIndex,
      pageWidth,
      placement.index,
      placement.animated,
    )
  })

  // The content view lays out after mount and after every page-width change,
  // so this is the first moment a placement cannot be clamped to a stale size.
  const onContentSizeChange = (width: number) => {
    if (pageWidth <= 0 || Math.abs(width - contentWidth) > 1) return
    const key = `${spaceKey}:${pageWidth}`
    if (placedFor.current === key) return
    placedFor.current = key
    const { placement } = state
    const pending = appliedPlacement.current !== placement.id
    appliedPlacement.current = placement.id
    scheduleOnUI(
      place,
      window.firstIndex,
      pageWidth,
      pending && placement.index !== null ? placement.index : state.settled,
      false,
    )
  }

  const jump = (index: PageIndex, animated: boolean) => {
    setState((current) => {
      const rebase = planPageRebase(createPageWindow(current.baseIndex), index)
      return {
        ...current,
        baseIndex: rebase?.baseIndex ?? current.baseIndex,
        center: index,
        placement: {
          id: current.placement.id + 1,
          index,
          animated: animated && rebase === null,
        },
      }
    })
  }

  useEffect(() => {
    const last = reported.current
    reported.current = { spaceKey, index: anchorIndex }
    if (last.spaceKey !== spaceKey || last.index === anchorIndex) return
    jump(anchorIndex, false)
  }, [anchorIndex, spaceKey])

  useLayoutEffect(() => {
    if (crossingStartedAt.current === 0) return
    pagingLog.commit(state.center, pagingLog.now() - crossingStartedAt.current)
    crossingStartedAt.current = 0
  }, [state.center])

  // A pager locked mid-drag never received its lift, so it neither snapped
  // nor reported the drag's end.
  useAnimatedReaction(
    () => scrollLocked.get(),
    (locked, previous) => {
      if (locked || previous !== true) return
      dragging.set(false)
      momentum.set(false)
      aimedSlot.set(Number.NaN)
      const width = placedWidth.get()
      if (width <= 0) return
      const x = scrollX.get()
      const slot = Math.round(x / width)
      if (Math.abs(x - slot * width) > ALIGNMENT_TOLERANCE) {
        scrollTo(scrollRef, slot * width, 0, true)
      } else {
        settleIfAligned(x)
      }
    },
  )

  const scrollProps = useScrollLockProps(scrollLocked)

  // Both native handlers are uninterruptible: the vertical ScrollView
  // activating mid-swipe would otherwise cancel this one between pages.
  const nativeGesture = Gesture.Native()
    .withTestId("owned-calendar-native-pager")
    .disallowInterruption(true)
    .simultaneousWithExternalGesture(pinchGesture)
    .onBegin(() => {
      "worklet"
      trackNativeTouch("horizontal", true)
    })
    .onFinalize(() => {
      "worklet"
      trackNativeTouch("horizontal", false)
    })

  return {
    scrollRef,
    scrollHandler,
    scrollProps,
    nativeGesture,
    onContentSizeChange,
    scrollX,
    positioned,
    pageWidth,
    contentWidth,
    firstIndex: window.firstIndex,
    mountedIndexes: mountedPageIndexes(window, state.center),
    settled: state.settled,
    moving: state.center !== state.settled || state.settled !== anchorIndex,
    isMoving: () => dragging.get() || momentum.get(),
    pageLeft: (index: PageIndex) => pageSlot(window, index) * pageWidth,
    step: (direction: -1 | 1, animated: boolean) => {
      onCenterChange(state.settled + direction)
      jump(state.settled + direction, animated)
    },
  }
}
