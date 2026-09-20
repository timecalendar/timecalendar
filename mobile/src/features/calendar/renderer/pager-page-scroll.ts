import { useLayoutEffect } from "react"
import PagerView from "react-native-pager-view"
import {
  createAnimatedComponent,
  type SharedValue,
  useAnimatedStyle,
  useEvent,
  useHandler,
  useSharedValue,
} from "react-native-reanimated"

export const CENTER_PAGE = 1

type PageScrollEvent = {
  eventName?: string
  position: number
  offset: number
}

type PageScrollHandlers = {
  onPageScroll?: (
    event: PageScrollEvent,
    context: Record<string, unknown>,
  ) => void
}

function usePageScrollHandler(
  handlers: PageScrollHandlers,
  dependencies: unknown[],
) {
  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies)

  return useEvent<PageScrollEvent, Record<string, unknown>>(
    (event) => {
      "worklet"
      if (
        handlers.onPageScroll &&
        (!event.eventName || event.eventName.endsWith("onPageScroll"))
      ) {
        handlers.onPageScroll(event, context)
      }
    },
    ["onPageScroll"],
    doDependenciesDiffer,
  )
}

export const AnimatedPagerView = createAnimatedComponent(PagerView)

export function usePagerPageScroll(
  laneWidth: number,
  contextKey: string,
  callbacksBlocked: SharedValue<boolean>,
) {
  const position = useSharedValue(CENTER_PAGE)
  const offset = useSharedValue(0)
  const activeContextKey = useSharedValue(contextKey)
  const settledContextKey = useSharedValue<string | null>(null)

  useLayoutEffect(() => {
    activeContextKey.set(contextKey)
    position.set(CENTER_PAGE)
    offset.set(0)
  }, [activeContextKey, contextKey, offset, position])

  const onPageScroll = usePageScrollHandler(
    {
      onPageScroll: (event) => {
        "worklet"
        if (callbacksBlocked.get()) return
        if (activeContextKey.get() !== contextKey) return
        if (settledContextKey.get() === contextKey) return
        position.set(event.position)
        offset.set(event.offset)
      },
    },
    [
      activeContextKey,
      callbacksBlocked,
      contextKey,
      offset,
      position,
      settledContextKey,
    ],
  )

  const headerStripStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: (CENTER_PAGE - (position.get() + offset.get())) * laneWidth,
      },
    ],
  }))

  const settleHeaderProgress = (page: number) => {
    // Keep the accepted edge visible until React replaces the dated pages.
    settledContextKey.set(contextKey)
    position.set(page)
    offset.set(0)
  }

  return {
    headerStripStyle,
    offset,
    onPageScroll,
    position,
    settleHeaderProgress,
  }
}
