import { setUpTests } from "react-native-reanimated"

type MockScrollHandlerKey =
  | "onScroll"
  | "onBeginDrag"
  | "onEndDrag"
  | "onMomentumBegin"
  | "onMomentumEnd"
type MockScrollHandler = (
  event: Record<string, unknown>,
  context: Record<string, unknown>,
) => void

jest.mock("react-native-worklets", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("react-native-worklets/src/mock"),
)
jest.mock("react-native-reanimated", () => {
  // Keep the package's supported Jest implementation; wrapping these two
  // lifecycle functions makes scheduling and cancellation directly assertable.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const reanimated = require("react-native-reanimated/mock")
  const implementation = reanimated.default ?? reanimated
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useRef } = require("react") as typeof import("react")
  // Native event name suffix → `useAnimatedScrollHandler` key.
  const SCROLL_HANDLER_KEYS: Record<string, MockScrollHandlerKey> = {
    onScrollBeginDrag: "onBeginDrag",
    onScrollEndDrag: "onEndDrag",
    onMomentumScrollBegin: "onMomentumBegin",
    onMomentumScrollEnd: "onMomentumEnd",
    onScroll: "onScroll",
  }
  return {
    ...reanimated,
    ...implementation,
    cancelAnimation: jest.fn(reanimated.cancelAnimation),
    // The package mock recreates shared values and returns an empty animated
    // style on rerender. Preserve the value like the native hook and evaluate
    // its updater so rendered end states remain observable in component tests.
    useAnimatedStyle: jest.fn((updater: () => Record<string, unknown>) =>
      updater(),
    ),
    // Like the native handler, one processed handler serves every scroll
    // event: a payload's `eventName` (the native name ends with it) routes it
    // to its handler key with one context per handler. A payload without a
    // name is RNTL's `fireEvent.scroll`; an unknown name is a test bug that
    // would otherwise reach no handler and pass silently.
    useAnimatedScrollHandler: jest.fn(
      (
        handlers:
          | MockScrollHandler
          | Partial<Record<MockScrollHandlerKey, MockScrollHandler>>,
      ) => {
        const byKey =
          typeof handlers === "function" ? { onScroll: handlers } : handlers
        const context: Record<string, unknown> = {}
        return (event: { nativeEvent?: Record<string, unknown> }) => {
          const payload: Record<string, unknown> = event.nativeEvent ?? event
          const name = payload.eventName ?? "onScroll"
          const route = Object.entries(SCROLL_HANDLER_KEYS).find(
            ([suffix]) => typeof name === "string" && name.endsWith(suffix),
          )
          if (route === undefined)
            throw new Error(`Unknown scroll event name: ${String(name)}`)
          byKey[route[1]]?.(payload, context)
        }
      },
    ),
    // The supported mock leaves useEvent inert. Preserve its handler shape so
    // Gesture Handler's Jest utility can deliver nativeEvent payloads through
    // the same production event seam.
    useEvent: jest.fn(
      <Event extends object>(handler: (event: Event) => void) =>
        (event: Event | { nativeEvent: Event }) =>
          handler("nativeEvent" in event ? event.nativeEvent : event),
    ),
    useHandler: jest.fn(() => ({
      context: {},
      doDependenciesDiffer: true,
    })),
    useReducedMotion: jest.fn(() => false),
    useSharedValue: jest.fn(
      <Value>(initial: Value) =>
        useRef(reanimated.useSharedValue(initial)).current,
    ),
    withTiming: jest.fn(reanimated.withTiming),
  }
})

setUpTests()
