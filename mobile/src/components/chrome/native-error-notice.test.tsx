import { render } from "@testing-library/react-native"
import { AccessibilityInfo } from "react-native"

import { usePlatform } from "@/test-support/platform"

import { NativeErrorNotice } from "./native-error-notice"

describe.each(["ios", "android"] as const)(
  "NativeErrorNotice on %s",
  (platform) => {
    usePlatform(platform)

    it("shows native title and message and announces a changed failure only once", async () => {
      const announce = jest
        .spyOn(AccessibilityInfo, "announceForAccessibility")
        .mockImplementation(() => undefined)
      const queued = jest
        .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
        .mockImplementation(() => undefined)
      const view = await render(
        <NativeErrorNotice
          title="Could not save"
          message="Try again."
          testID="native-error"
        />,
      )
      expect(view.getByText("Could not save")).toBeOnTheScreen()
      expect(view.getByTestId("native-error")).toHaveTextContent("Try again.")
      await view.rerender(
        <NativeErrorNotice
          title="Could not save"
          message="Try again."
          testID="native-error"
        />,
      )
      const owner = platform === "ios" ? queued : announce
      expect(owner).toHaveBeenCalledTimes(1)
      await view.rerender(
        <NativeErrorNotice
          title="Could not save"
          message="Check connection."
          testID="native-error"
        />,
      )
      expect(owner).toHaveBeenCalledTimes(2)
      expect(platform === "ios" ? announce : queued).not.toHaveBeenCalled()
      announce.mockRestore()
      queued.mockRestore()
    })
  },
)
