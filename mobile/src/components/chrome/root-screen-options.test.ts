import { Colors } from "@/theme"

import { buildCompactRootScreenOptions } from "./root-screen-options"

describe("buildCompactRootScreenOptions", () => {
  it.each([Colors.light.background, Colors.dark.background])(
    "returns compact visible chrome on %s",
    (backgroundColor) => {
      expect(buildCompactRootScreenOptions(backgroundColor)).toEqual({
        headerShown: true,
        headerLargeTitle: false,
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor },
      })
    },
  )
})
