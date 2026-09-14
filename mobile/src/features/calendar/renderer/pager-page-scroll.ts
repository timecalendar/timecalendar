import { useLayoutEffect } from "react"
import PagerView from "react-native-pager-view"
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useEvent,
  useHandler,
  useSharedValue,
} from "react-native-reanimated"

const CENTER_PAGE = 1

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

export function usePagerPageScroll(laneWidth: number, contextKey: string) {
  const position = useSharedValue(CENTER_PAGE)
  const offset = useSharedValue(0)
  const activeContextKey = useSharedValue(contextKey)

  useLayoutEffect(() => {
    activeContextKey.set(contextKey)
    position.set(CENTER_PAGE)
    offset.set(0)
  }, [activeContextKey, contextKey, offset, position])

  const onPageScroll = usePageScrollHandler(
    {
      onPageScroll: (event) => {
        "worklet"
        if (activeContextKey.get() !== contextKey) {
          position.set(CENTER_PAGE)
          offset.set(0)
          return
        }
        position.set(event.position)
        offset.set(event.offset)
      },
    },
    [activeContextKey, contextKey, offset, position],
  )

  const headerStripStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: (CENTER_PAGE - (position.get() + offset.get())) * laneWidth,
      },
    ],
  }))

  return { headerStripStyle, offset, onPageScroll, position }
}
