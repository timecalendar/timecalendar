import { useNavigation } from "expo-router"
import { useEffect } from "react"

const STORY_ROUTE = "developer/gallery/[story]"
const INDEX_ROUTE = "developer/gallery"

type StackRoute = { name: string; key: string }

type StackState = { index: number; routes: readonly StackRoute[] }

export function withGalleryIndexBeneath<State extends StackState>(
  state: State | undefined,
): (State & { routes: StackRoute[] }) | undefined {
  if (!state) return undefined
  const { index, routes } = state
  const story = routes[index]
  if (story?.name !== STORY_ROUTE) return undefined
  if (routes[index - 1]?.name === INDEX_ROUTE) return undefined
  return {
    ...state,
    index: index + 1,
    routes: [
      ...routes.slice(0, index),
      { name: INDEX_ROUTE, key: `${INDEX_ROUTE}-anchor-${story.key}` },
      ...routes.slice(index),
    ],
  }
}

// A deep link opens the story with (tabs) or another screen beneath it; the
// index is inserted under the story so Back walks story → index → app. On a
// cold link the container commits its initial state after the first reset and
// reverts it, so the anchor is re-applied on every state change until it holds.
export function useGalleryIndexAnchor(enabled: boolean) {
  const navigation = useNavigation()
  useEffect(() => {
    if (!enabled) return
    const anchor = () => {
      const anchored = withGalleryIndexBeneath(navigation.getState())
      if (anchored) {
        navigation.reset(anchored as Parameters<typeof navigation.reset>[0])
      }
    }
    anchor()
    return navigation.addListener("state", anchor)
  }, [enabled, navigation])
}
