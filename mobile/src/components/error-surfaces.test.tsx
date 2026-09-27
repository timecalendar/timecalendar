import { fireEvent, render } from "@testing-library/react-native"
import { AccessibilityInfo } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { usePlatform } from "@/test-support/platform"
import { Colors, Spacing } from "@/theme"

import {
  ErrorNotice,
  ErrorState,
  ErrorTextAction,
  FieldError,
} from "./error-surfaces"
import { useErrorAnnouncement } from "./use-error-announcement"

jest.mock("@/hooks/use-color-scheme", () => ({ useColorScheme: jest.fn() }))
const scheme = jest.mocked(useColorScheme)

beforeEach(() => {
  jest.clearAllMocks()
  scheme.mockReturnValue("light")
  jest
    .spyOn(AccessibilityInfo, "announceForAccessibility")
    .mockImplementation(() => {})
  jest
    .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
    .mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

function NativeMessage({ message }: { message?: string }) {
  useErrorAnnouncement(message, { native: true })
  return null
}

describe.each(["ios" as const, "android" as const])(
  "Error surfaces on %s",
  (platform) => {
    usePlatform(platform)

    it("announces a field error once and announces changed messages", async () => {
      const view = await render(
        <FieldError
          message="Enter a URL"
          nativeID="url-error"
          testID="field-error"
        />,
      )
      const error = view.getByRole("alert", { name: "Enter a URL" })
      expect(error).toHaveProp("nativeID", "url-error")
      expect(error.props.accessibilityLiveRegion).toBe(
        platform === "android" ? "polite" : undefined,
      )
      expect(error).toHaveStyle({ color: Colors.light.error })
      await view.rerender(
        <FieldError
          message="Enter a URL"
          nativeID="url-error"
          testID="field-error"
        />,
      )
      if (platform === "ios") {
        expect(
          AccessibilityInfo.announceForAccessibilityWithOptions,
        ).toHaveBeenCalledTimes(1)
        expect(
          AccessibilityInfo.announceForAccessibilityWithOptions,
        ).toHaveBeenCalledWith("Enter a URL", { queue: true })
      } else {
        expect(
          AccessibilityInfo.announceForAccessibility,
        ).not.toHaveBeenCalled()
        expect(
          AccessibilityInfo.announceForAccessibilityWithOptions,
        ).not.toHaveBeenCalled()
      }
      await view.rerender(<FieldError message="Use an https URL" />)
      if (platform === "ios")
        expect(
          AccessibilityInfo.announceForAccessibilityWithOptions,
        ).toHaveBeenCalledTimes(2)
      expect(view.getByRole("alert", { name: "Use an https URL" })).toBeTruthy()
    })

    it("announces native host errors explicitly without speaking absent messages", async () => {
      const view = await render(<NativeMessage />)
      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled()
      expect(
        AccessibilityInfo.announceForAccessibilityWithOptions,
      ).not.toHaveBeenCalled()
      await view.rerender(<NativeMessage message="Save failed" />)
      const announce =
        platform === "ios"
          ? AccessibilityInfo.announceForAccessibilityWithOptions
          : AccessibilityInfo.announceForAccessibility
      expect(announce).toHaveBeenCalledTimes(1)
      await view.rerender(<NativeMessage message="Save failed" />)
      expect(announce).toHaveBeenCalledTimes(1)
    })

    it("keeps an inline notice separate from its one recovery action", async () => {
      const retry = jest.fn()
      const view = await render(
        <ErrorNotice
          title="Could not refresh"
          message="Your saved events are still available."
          action={{ label: "Retry", onPress: retry, testID: "retry" }}
          testID="notice"
        />,
      )
      expect(
        view.getByRole("header", { name: "Could not refresh" }),
      ).toBeTruthy()
      expect(
        view.getByRole("alert", {
          name: /Could not refresh.*Your saved events are still available\./,
        }),
      ).toBeTruthy()
      expect(view.getAllByRole("button")).toHaveLength(1)
      expect(view.getByTestId("notice")).toHaveStyle({
        backgroundColor: Colors.light.backgroundElement,
        padding: Spacing.three,
      })
      expect(view.getByTestId("retry")).toHaveStyle({
        minHeight: platform === "ios" ? 44 : 48,
      })
      await fireEvent.press(view.getByTestId("retry"))
      expect(retry).toHaveBeenCalledTimes(1)
      if (platform === "ios")
        expect(
          AccessibilityInfo.announceForAccessibilityWithOptions,
        ).toHaveBeenCalledWith(
          "Could not refresh. Your saved events are still available.",
          { queue: true },
        )
    })

    it("renders a full error with one filled primary and a quiet secondary", async () => {
      const retry = jest.fn()
      const change = jest.fn()
      const view = await render(
        <ErrorState
          title="Import failed"
          message="Try again or choose another method."
          primaryAction={{ label: "Retry", onPress: retry, testID: "retry" }}
          secondaryAction={{
            label: "Change method",
            onPress: change,
            testID: "change",
          }}
        />,
      )
      expect(view.getAllByRole("button")).toHaveLength(2)
      expect(view.getByTestId("retry")).toHaveStyle({
        backgroundColor: Colors.light.primaryStrong,
      })
      expect(view.getByTestId("change")).not.toHaveStyle({
        backgroundColor: Colors.light.primaryStrong,
      })
      await fireEvent.press(view.getByTestId("retry"))
      await fireEvent.press(view.getByTestId("change"))
      expect(retry).toHaveBeenCalledTimes(1)
      expect(change).toHaveBeenCalledTimes(1)
    })

    it.each([{ busy: true }, { disabled: true }])(
      "blocks recovery with state %j",
      async (state) => {
        const press = jest.fn()
        const view = await render(
          <ErrorTextAction
            label="Retry"
            onPress={press}
            testID="retry"
            {...state}
          />,
        )
        expect(view.getByTestId("retry")).toBeDisabled()
        await fireEvent.press(view.getByTestId("retry"))
        expect(press).not.toHaveBeenCalled()
      },
    )

    it("supports a quiet report link and descriptive accessible label", async () => {
      const report = jest.fn()
      const view = await render(
        <ErrorTextAction
          role="link"
          label="Report"
          accessibilityLabel="Report this failed import"
          onPress={report}
        />,
      )
      await fireEvent.press(
        view.getByRole("link", { name: "Report this failed import" }),
      )
      expect(report).toHaveBeenCalledTimes(1)
    })

    it("keeps long messages and actions scalable with dark semantic colors", async () => {
      scheme.mockReturnValue("dark")
      const message =
        "An explanatory error message that may wrap across many lines. ".repeat(
          5,
        )
      const view = await render(
        <ErrorNotice compact message={message} testID="notice" />,
      )
      expect(view.getByTestId("notice")).toHaveStyle({
        backgroundColor: Colors.dark.backgroundElement,
        padding: Spacing.two,
      })
      expect(view.getByText(message)).not.toHaveProp("numberOfLines")
      expect(view.getByText(message).props.allowFontScaling).not.toBe(false)
      expect(view.queryAllByRole("button")).toHaveLength(0)
      await view.rerender(<FieldError message={message} />)
      expect(view.getByText(message)).toHaveStyle({ color: Colors.dark.error })
      await view.rerender(<ErrorState title="Unavailable" message={message} />)
      expect(view.queryAllByRole("button")).toHaveLength(0)
    })
  },
)
