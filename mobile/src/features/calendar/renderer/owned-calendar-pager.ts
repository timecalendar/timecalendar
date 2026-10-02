import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { PixelRatio, Platform } from "react-native"
import { Gesture, type GestureType } from "react-native-gesture-handler"
import Animated, {
  type AnimatedRef,
  measure,
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

type Placement = {
  id: number
  index: PageIndex | null
  animated: boolean
  approachFrom: PageIndex | null
}

type PagerState = {
  spaceKey: string
  generation: number
  baseIndex: PageIndex
  center: PageIndex
  settled: PageIndex
  placement: Placement
}

function initialPagerState(
  spaceKey: string,
  index: PageIndex,
  generation: number,
): PagerState {
  return {
    spaceKey,
    generation,
    baseIndex: index,
    center: index,
    settled: index,
    placement: { id: 0, index, animated: false, approachFrom: null },
  }
}

function jumpPagerState(
  current: PagerState,
  index: PageIndex,
  animated: boolean,
  generation: number,
): PagerState {
  if (current.generation !== generation) return current
  const rebase = planPageRebase(createPageWindow(current.baseIndex), index)
  const distance = index - current.settled
  return {
    ...current,
    baseIndex: rebase?.baseIndex ?? current.baseIndex,
    center: index,
    placement: {
      id: current.placement.id + 1,
      index,
      animated,
      approachFrom:
        animated && (Math.abs(distance) > 1 || rebase !== null)
          ? index - Math.sign(distance)
          : null,
    },
  }
}

// The recursive worklet lives in its own hook so the React Compiler can retain
// its frame callback while the pager's mode generation changes.
function useRestWatcher({
  activeGeneration,
  generation,
  placedWidth,
  mounted,
  restWatching,
  scrollX,
  touching,
  scrollLocked,
  restX,
  restFrames,
  dragging,
  momentum,
  restSnaps,
  firstIndex,
  scrollRef,
  settleIfAligned,
}: {
  activeGeneration: SharedValue<number>
  generation: number
  placedWidth: SharedValue<number>
  mounted: SharedValue<boolean>
  restWatching: SharedValue<boolean>
  scrollX: SharedValue<number>
  touching: SharedValue<boolean>
  scrollLocked: SharedValue<boolean>
  restX: SharedValue<number>
  restFrames: SharedValue<number>
  dragging: SharedValue<boolean>
  momentum: SharedValue<boolean>
  restSnaps: SharedValue<number>
  firstIndex: SharedValue<number>
  scrollRef: AnimatedRef<Animated.ScrollView>
  settleIfAligned: (x: number) => void
}) {
  const restCheck = Platform.OS === "android"

  function checkRest() {
    "worklet"
    if (activeGeneration.get() !== generation) return
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

  return () => {
    "worklet"
    if (
      activeGeneration.get() !== generation ||
      !restCheck ||
      restWatching.get()
    )
      return
    restWatching.set(true)
    restX.set(Number.NaN)
    restSnaps.set(0)
    requestAnimationFrame(checkRest)
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
  reduceMotion,
  scrollLocked,
  pinchGesture,
  trackNativeTouch,
  onSettled,
  onCenterChange,
}: {
  space: PageSpace
  anchorIndex: PageIndex
  pageWidth: number
  reduceMotion: boolean
  scrollLocked: SharedValue<boolean>
  pinchGesture: GestureType
  trackNativeTouch: (axis: "horizontal", down: boolean) => void
  onSettled: (index: PageIndex) => void
  onCenterChange: (index: PageIndex) => void
}) {
  const spaceKey = `${space.mode}:${space.firstWeekday}`
  const [stored, setState] = useState(() =>
    initialPagerState(spaceKey, anchorIndex, 0),
  )
  let state = stored
  if (stored.spaceKey !== spaceKey) {
    state = initialPagerState(spaceKey, anchorIndex, stored.generation + 1)
    setState(state)
  }
  // A space key can repeat across Week → Day → Week; its generation cannot.
  const generation = state.generation
  const window = createPageWindow(state.baseIndex)
  const contentWidth = CONTENT_SLOTS * pageWidth

  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const probeRef = useAnimatedRef<Animated.View>()
  const scrollX = useSharedValue(0)
  const activeGeneration = useSharedValue(generation)
  const positioned = useSharedValue(false)
  const dragging = useSharedValue(false)
  const momentum = useSharedValue(false)
  const roundedIndex = useSharedValue(anchorIndex)
  const settledIndex = useSharedValue(anchorIndex)
  const navigationTarget = useSharedValue<PageIndex | null>(null)
  const interruptedTarget = useSharedValue<PageIndex | null>(null)
  const touchDragged = useSharedValue(false)
  const touchReleaseVisit = useSharedValue(0)
  const firstIndex = useSharedValue(window.firstIndex)
  const placedWidth = useSharedValue(0)
  const touching = useSharedValue(false)
  const nativeTouchGeneration = useSharedValue<number | null>(null)
  const tracedScrollMask = useSharedValue(0)
  const mounted = useSharedValue(true)
  const restWatching = useSharedValue(false)
  const restX = useSharedValue(0)
  const restFrames = useSharedValue(0)
  const restSnaps = useSharedValue(0)
  const appliedPlacement = useRef(0)
  const placedFor = useRef<string | null>(null)
  const laidOutFor = useRef<string | null>(null)
  const contentLaidOutFor = useRef<string | null>(null)
  const resetGeneration = useRef<number | null>(null)
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
    if (resetGeneration.current !== generation) return
    crossingStartedAt.current = pagingLog.now()
    setState((current) =>
      current.generation !== generation || current.center === index
        ? current
        : { ...current, center: index },
    )
    listeners.current.onCenterChange(index)
  }

  const onSettle = (index: PageIndex) => {
    if (resetGeneration.current !== generation) return
    reported.current = { spaceKey, index }
    pagingLog.settle(index)
    setState((current) => {
      if (current.generation !== generation) return current
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
                approachFrom: null,
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
    if (activeGeneration.get() !== generation) return false
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
      activeGeneration.get() !== generation ||
      touching.get() ||
      scrollLocked.get() ||
      dragging.get() ||
      momentum.get()
    )
      return
    const width = placedWidth.get()
    if (!(width > 0) || !Number.isFinite(x)) return
    const slot = Math.round(x / width)
    if (Math.abs(x - slot * width) > ALIGNMENT_TOLERANCE) return
    const index = firstIndex.get() + slot
    const target = navigationTarget.get()
    if (target !== null && index !== target) return
    if (target === index) navigationTarget.set(null)
    const interrupted = interruptedTarget.get()
    if (interrupted !== null) interruptedTarget.set(null)
    if (index === settledIndex.get()) {
      if (interrupted !== null) scheduleOnRN(onSettle, index)
      return
    }
    settledIndex.set(index)
    scheduleOnRN(onSettle, index)
  }

  // Android can leave the pager at rest between pages, or aligned with its
  // drag never ended: a lift that reaches the scroll view while its previous
  // post-touch snap is still pending gets no snap, because the ACTION_DOWN that
  // would cancel that snap goes to the page under the finger, and a cancelled
  // drag never snaps. Once the pager has been still for REST_FRAMES with no finger
  // on it and no pinch lock, it is snapped to the nearest page and settled.
  const watchRest = useRestWatcher({
    activeGeneration,
    generation,
    placedWidth,
    mounted,
    restWatching,
    scrollX,
    touching,
    scrollLocked,
    restX,
    restFrames,
    dragging,
    momentum,
    restSnaps,
    firstIndex,
    scrollRef,
    settleIfAligned,
  })

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const accepted = describesPlacedContent(event)
      const traceBit = accepted ? 2 : 1
      if (!(tracedScrollMask.get() & traceBit)) {
        tracedScrollMask.set(tracedScrollMask.get() | traceBit)
        scheduleOnRN(pagingLog.placement, "scroll", {
          generation,
          activeGeneration: activeGeneration.get(),
          accepted,
          x: event.contentOffset.x,
          viewportWidth: event.layoutMeasurement.width,
          contentWidth: event.contentSize.width,
          placedWidth: placedWidth.get(),
          positioned: positioned.get(),
        })
      }
      if (!accepted) return
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
      if (activeGeneration.get() !== generation) return
      touchDragged.set(true)
      const target = navigationTarget.get()
      if (target !== null) {
        interruptedTarget.set(target)
        navigationTarget.set(null)
      }
      dragging.set(true)
      momentum.set(false)
    },
    onEndDrag: (event) => {
      if (activeGeneration.get() !== generation) return
      dragging.set(false)
      if (describesPlacedContent(event)) settleIfAligned(event.contentOffset.x)
      watchRest()
    },
    // iOS sends no end-drag for a grab released without moving mid-fling;
    // the deceleration that resumes is the drag's end.
    onMomentumBegin: () => {
      if (activeGeneration.get() !== generation) return
      dragging.set(false)
      momentum.set(true)
    },
    onMomentumEnd: (event) => {
      if (activeGeneration.get() !== generation) return
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
    scheduleOnRN(pagingLog.placement, "place", {
      generation,
      activeGeneration: activeGeneration.get(),
      nativeRefReady: typeof scrollRef === "function" && Boolean(scrollRef()),
      first,
      width,
      target,
      animated,
      placedWidth: placedWidth.get(),
      observedX: scrollX.get(),
    })
    if (activeGeneration.get() !== generation) return
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
    requestAnimationFrame(() => {
      "worklet"
      if (activeGeneration.get() !== generation) return
      const viewport =
        typeof scrollRef === "function" && Boolean(scrollRef())
          ? measure(scrollRef)
          : null
      const marker =
        typeof probeRef === "function" && Boolean(probeRef())
          ? measure(probeRef)
          : null
      scheduleOnRN(pagingLog.placement, "native-position", {
        generation,
        viewportX: viewport?.pageX ?? null,
        markerX: marker?.pageX ?? null,
        observedOffset:
          viewport && marker
            ? PAGE_WINDOW_RADIUS * width - (marker.pageX - viewport.pageX)
            : null,
        requestedOffset: (position - first) * width,
      })
    })
  }

  const placeNavigation = (
    first: PageIndex,
    width: number,
    placement: Placement,
  ) => {
    "worklet"
    if (placement.approachFrom !== null)
      place(first, width, placement.approachFrom, false)
    place(first, width, placement.index, placement.animated)
  }

  useLayoutEffect(() => {
    if (resetGeneration.current === generation) return
    const releasePreviousNativeTouch = (nextGeneration: number) => {
      "worklet"
      if (activeGeneration.get() !== nextGeneration) return
      const owner = nativeTouchGeneration.get()
      if (owner === nextGeneration) return
      if (owner !== null) trackNativeTouch("horizontal", false)
      nativeTouchGeneration.set(null)
      touching.set(false)
    }
    resetGeneration.current = generation
    pagingLog.placement("reset", {
      generation,
      spaceKey,
      anchorIndex,
      pageWidth,
      placementId: state.placement.id,
    })
    placedFor.current = null
    laidOutFor.current = null
    contentLaidOutFor.current = null
    activeGeneration.set(generation)
    scheduleOnUI(releasePreviousNativeTouch, generation)
    positioned.set(false)
    placedWidth.set(0)
    dragging.set(false)
    momentum.set(false)
    touchDragged.set(false)
    restWatching.set(false)
    restFrames.set(0)
    restSnaps.set(0)
    tracedScrollMask.set(0)
    settledIndex.set(anchorIndex)
    navigationTarget.set(null)
    interruptedTarget.set(null)
    crossingStartedAt.current = 0
  }, [
    generation,
    spaceKey,
    pageWidth,
    state.placement.id,
    activeGeneration,
    anchorIndex,
    positioned,
    placedWidth,
    dragging,
    momentum,
    touchDragged,
    restWatching,
    restFrames,
    restSnaps,
    tracedScrollMask,
    settledIndex,
    navigationTarget,
    interruptedTarget,
    nativeTouchGeneration,
    trackNativeTouch,
    touching,
  ])

  useEffect(() => {
    mounted.set(true)
    return () => mounted.set(false)
  }, [mounted])

  useLayoutEffect(() => {
    const { placement } = state
    if (pageWidth <= 0 || appliedPlacement.current === placement.id) return
    if (placedFor.current !== `${generation}:${pageWidth}`) return
    pagingLog.placement("schedule-navigation", {
      generation,
      placementId: placement.id,
      firstIndex: window.firstIndex,
      pageWidth,
      target: placement.index,
    })
    appliedPlacement.current = placement.id
    scheduleOnUI(placeNavigation, window.firstIndex, pageWidth, placement)
  })

  // The content can report its size before the viewport has laid out. A
  // scrollTo issued then may clamp to zero and produce no confirming scroll.
  const placeAfterLayout = () => {
    const key = `${generation}:${pageWidth}`
    pagingLog.placement("readiness", {
      generation,
      key,
      activeGeneration: resetGeneration.current,
      placedFor: placedFor.current,
      laidOutFor: laidOutFor.current,
      contentLaidOutFor: contentLaidOutFor.current,
      placementId: state.placement.id,
    })
    if (
      resetGeneration.current !== generation ||
      placedFor.current === key ||
      laidOutFor.current !== key ||
      contentLaidOutFor.current !== key
    )
      return
    placedFor.current = key
    const { placement } = state
    const pending = appliedPlacement.current !== placement.id
    appliedPlacement.current = placement.id
    pagingLog.placement("schedule-initial", {
      generation,
      jsRefReady: scrollRef.current !== null,
      pending,
      placementId: placement.id,
      firstIndex: window.firstIndex,
      pageWidth,
      target: pending ? placement.index : state.settled,
    })
    if (pending)
      scheduleOnUI(placeNavigation, window.firstIndex, pageWidth, placement)
    else scheduleOnUI(place, window.firstIndex, pageWidth, state.settled, false)
  }

  const onPagerLayout = (width: number) => {
    pagingLog.placement("layout", {
      generation,
      jsRefReady: scrollRef.current !== null,
      activeGeneration: resetGeneration.current,
      width,
      pageWidth,
    })
    if (resetGeneration.current !== generation) return
    if (pageWidth <= 0 || Math.abs(width - pageWidth) > 1) return
    laidOutFor.current = `${generation}:${pageWidth}`
    placeAfterLayout()
  }

  const onContentSizeChange = (width: number) => {
    pagingLog.placement("content", {
      generation,
      jsRefReady: scrollRef.current !== null,
      activeGeneration: resetGeneration.current,
      width,
      contentWidth,
    })
    if (resetGeneration.current !== generation) return
    if (pageWidth <= 0 || Math.abs(width - contentWidth) > 1) return
    contentLaidOutFor.current = `${generation}:${pageWidth}`
    placeAfterLayout()
  }

  useEffect(() => {
    const last = reported.current
    reported.current = { spaceKey, index: anchorIndex }
    if (last.spaceKey !== spaceKey || last.index === anchorIndex) return
    interruptedTarget.set(null)
    navigationTarget.set(anchorIndex)
    setState((current) =>
      jumpPagerState(current, anchorIndex, !reduceMotion, generation),
    )
  }, [
    anchorIndex,
    interruptedTarget,
    generation,
    navigationTarget,
    reduceMotion,
    spaceKey,
  ])

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
      if (activeGeneration.get() !== generation) return
      if (locked) {
        const target = navigationTarget.get()
        if (target !== null) {
          interruptedTarget.set(target)
          navigationTarget.set(null)
        }
        return
      }
      if (previous !== true) return
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

  useAnimatedReaction(
    () => touchReleaseVisit.get(),
    (visit, previous) => {
      if (activeGeneration.get() !== generation) return
      if (visit !== 0 && visit !== previous) settleIfAligned(scrollX.get())
    },
  )

  const scrollProps = useScrollLockProps(scrollLocked)

  // Both native handlers are uninterruptible: the vertical ScrollView
  // activating mid-swipe would otherwise cancel this one between pages.
  const finishNativeTouch = () => {
    "worklet"
    if (nativeTouchGeneration.get() !== generation) return
    nativeTouchGeneration.set(null)
    touching.set(false)
    trackNativeTouch("horizontal", false)
    if (activeGeneration.get() !== generation) return
    if (interruptedTarget.get() !== null && !touchDragged.get()) {
      dragging.set(false)
      momentum.set(false)
    }
    touchReleaseVisit.set(touchReleaseVisit.get() + 1)
  }

  const beginNativeTouch = () => {
    "worklet"
    if (activeGeneration.get() !== generation) return
    nativeTouchGeneration.set(generation)
    touchDragged.set(false)
    touching.set(true)
    const target = navigationTarget.get()
    if (target !== null) {
      interruptedTarget.set(target)
      navigationTarget.set(null)
    }
    trackNativeTouch("horizontal", true)
  }

  const nativeGesture = Gesture.Native()
    .withTestId("owned-calendar-native-pager")
    .disallowInterruption(true)
    .simultaneousWithExternalGesture(pinchGesture)
    .onBegin(beginNativeTouch)
    .onFinalize(finishNativeTouch)

  if (Platform.OS === "android") {
    nativeGesture.onTouchesDown(beginNativeTouch)
  }

  return {
    spaceKey,
    scrollRef,
    probeRef,
    scrollHandler,
    scrollProps,
    nativeGesture,
    onContentSizeChange,
    onPagerLayout,
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
      if (resetGeneration.current !== generation) return
      navigationTarget.set(null)
      interruptedTarget.set(null)
      onCenterChange(state.settled + direction)
      setState((current) =>
        jumpPagerState(
          current,
          state.settled + direction,
          animated,
          generation,
        ),
      )
    },
  }
}
