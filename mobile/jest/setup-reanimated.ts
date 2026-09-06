import { setUpTests } from "react-native-reanimated"

jest.mock("react-native-worklets", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("react-native-worklets/src/mock"),
)
jest.mock("react-native-reanimated", () => {
  // Keep the package's supported Jest implementation; wrapping these two
  // lifecycle functions makes scheduling and cancellation directly assertable.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const reanimated = require("react-native-reanimated/mock")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useRef } = require("react") as typeof import("react")
  return {
    ...reanimated,
    cancelAnimation: jest.fn(reanimated.cancelAnimation),
    // The package mock recreates shared values and returns an empty animated
    // style on rerender. Preserve the value like the native hook and evaluate
    // its updater so rendered end states remain observable in component tests.
    useAnimatedStyle: jest.fn((updater: () => Record<string, unknown>) =>
      updater(),
    ),
    useSharedValue: jest.fn(
      <Value>(initial: Value) =>
        useRef(reanimated.useSharedValue(initial)).current,
    ),
    withTiming: jest.fn(reanimated.withTiming),
  }
})

setUpTests()
