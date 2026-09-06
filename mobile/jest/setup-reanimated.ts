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
  return {
    ...reanimated,
    cancelAnimation: jest.fn(reanimated.cancelAnimation),
    withTiming: jest.fn(reanimated.withTiming),
  }
})

setUpTests()
