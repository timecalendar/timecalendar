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
const REST_FRAMES = 45
const REST_SNAP_ATTEMPTS = 3

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
  const touching = useSharedValue(false)
  const mounted = useSharedValue(true)
  const restWatching = useSharedValue(false)
  const restX = useSharedValue(0)
  const restFrames = useSharedValue(0)
  const restSnaps = useSharedValue(0)
  const appliedPlacement = useRef(0)
  const placedFor = useRef<string | null>(null)
  const reported = useRef({ spaceKey, index: anchorIndex })
  const crossingStartedAt = useRef(0)
  // The scroll handler worklet captures the crossing and settle callbacks. If
  // they changed with every parent render, Reanimated would re-register the
  // handler mid-gesture and could drop an end-drag, leaving a page unsettled.
  const listeners = useRef({ onSettled, onCenterChange })
  useLayoutEffect(() => {
    listeners.current = { onSettled, onCenterChange }
  })

  const onCross = (index: PageIndex) => {
    crossingStartedAt.current = pagingLog.now()
    setState((current) =>
      current.center === index ? current : { ...current, center: index },
    )
    listeners.current.onCenterChange(index)
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
    listeners.current.onCenterChange(index)
    listeners.current.onSettled(index)
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
    if (
      touching.get() ||
      scrollLocked.get() ||
      dragging.get() ||
      momentum.get()
    )
      return
    const width = placedWidth.get()
    const slot = Math.round(x / width)
    if (Math.abs(x - slot * width) > ALIGNMENT_TOLERANCE) return
    const index = firstIndex.get() + slot
    if (index === settledIndex.get()) return
    settledIndex.set(index)
    scheduleOnRN(onSettle, index)
  }

  // Android can leave the pager at rest between pages, or aligned with its
  // drag never ended: a lift that reaches the scroll view while its previous
  // post-touch snap is still pending gets no snap, because the ACTION_DOWN that
  // would cancel that snap goes to the page under the finger, and a cancelled
  // drag never snaps. Once the pager has been still for REST_FRAMES with no finger
  // on it and no pinch lock, it is snapped to the nearest page and settled.
  const restCheck = Platform.OS === "android"

  function checkRest() {
    "worklet"
    const width = placedWidth.get()
    if (!mounted.get() || width <= 0) {
      restWatching.set(false)
      return
    }
    const x = scrollX.get()
    if (touching.get() || scrollLocked.get() || x !== restX.get()) {
      restX.set(x)
      restFrames.set(0)
    } else if (restFrames.get() < REST_FRAMES) {
      restFrames.set(restFrames.get() + 1)
    } else {
      dragging.set(false)
      momentum.set(false)
      const slot = Math.round(x / width)
      if (
        Math.abs(x - slot * width) <= ALIGNMENT_TOLERANCE ||
        restSnaps.get() >= REST_SNAP_ATTEMPTS
      ) {
        restWatching.set(false)
        settleIfAligned(x)
        return
      }
      const attempt = restSnaps.get() + 1
      restSnaps.set(attempt)
      restFrames.set(0)
      scheduleOnRN(pagingLog.restSnap, firstIndex.get() + slot)
      scrollTo(scrollRef, slot * width, 0, attempt < REST_SNAP_ATTEMPTS)
      if (attempt === REST_SNAP_ATTEMPTS) {
        restWatching.set(false)
        return
      }
    }
    requestAnimationFrame(checkRest)
  }

  const watchRest = () => {
    "worklet"
    if (!restCheck || restWatching.get()) return
    restWatching.set(true)
    restX.set(Number.NaN)
    restSnaps.set(0)
    requestAnimationFrame(checkRest)
  }

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (!describesPlacedContent(event)) return
      const x = event.contentOffset.x
      scrollX.set(x)
      positioned.set(true)
      const index = firstIndex.get() + Math.round(x / placedWidth.get())
      if (index !== roundedIndex.get()) {
        roundedIndex.set(index)
        scheduleOnRN(onCross, index)
      }
      settleIfAligned(x)
      watchRest()
    },
    onBeginDrag: () => {
      dragging.set(true)
      momentum.set(false)
    },
    onEndDrag: (event) => {
      dragging.set(false)
      if (describesPlacedContent(event)) settleIfAligned(event.contentOffset.x)
      watchRest()
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
    // A placement can abort a native fling without a momentum-end event.
    if (target !== null) {
      dragging.set(false)
      momentum.set(false)
    }
    scrollTo(scrollRef, (position - first) * width, 0, animated)
  }

  useLayoutEffect(() => {
    positioned.set(false)
    placedWidth.set(0)
  }, [spaceKey, positioned, placedWidth])

  useEffect(() => {
    mounted.set(true)
    return () => mounted.set(false)
  }, [mounted])

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
      touching.set(true)
      trackNativeTouch("horizontal", true)
    })
    .onFinalize(() => {
      "worklet"
      touching.set(false)
      trackNativeTouch("horizontal", false)
    })

  if (Platform.OS === "android") {
    nativeGesture.onTouchesDown(() => {
      "worklet"
      touching.set(true)
      trackNativeTouch("horizontal", true)
    })
  }

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
