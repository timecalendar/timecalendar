import { fireEvent, render } from "@testing-library/react-native"
import * as Linking from "expo-linking"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { AccessibilityInfo } from "react-native"

import { usePlatform } from "@/test-support/platform"

import { AboutScreen } from "./about-screen"

const mockAnnounce = jest.spyOn(AccessibilityInfo, "announceForAccessibility")

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}))
jest.mock("expo-linking", () => ({ openURL: jest.fn() }))
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }))
jest.mock("@/features/about/data", () => ({
  readApplicationInfo: () => ({
    kind: "versionAndBuild",
    version: "4.0.0",
    build: "135",
  }),
}))

beforeEach(() => {
  jest.mocked(router.push).mockReset()
  jest.mocked(Linking.openURL).mockReset()
  jest.mocked(WebBrowser.openBrowserAsync).mockReset()
  mockAnnounce.mockClear()
})

describe.each(["ios", "android"] as const)("AboutScreen on %s", (platform) => {
  usePlatform(platform)

  it("renders the brand header and action and navigation rows in one native host", async () => {
    const view = await render(<AboutScreen />)
    expect(
      view.getAllByTestId(
        platform === "ios"
          ? "swiftui-form-scroll-owner"
          : "compose-lazy-column-scroll-owner",
      ),
    ).toHaveLength(1)
    expect(view.getByRole("header", { name: "TimeCalendar" })).toBeOnTheScreen()
    expect(view.getByTestId("about-version")).toHaveTextContent(
      "Version 4.0.0 · Build 135",
    )
    expect(
      view.getByText(
        "With TimeCalendar, easily access your university schedule.",
      ),
    ).toBeOnTheScreen()
    expect(
      view.getByText(
        "This app was created to make student life simpler, with schedules always close at hand.",
      ),
    ).toBeOnTheScreen()
    await fireEvent.press(view.getByTestId("about-changelog"))
    expect(router.push).toHaveBeenCalledWith("/changelog")
    await fireEvent.press(view.getByTestId("about-privacy"))
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalled()
  })
})

it("keeps localized failure feedback when an action rejects", async () => {
  jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error("offline"))
  const queued = jest
    .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
    .mockImplementation(() => undefined)
  const view = await render(<AboutScreen />)
  await fireEvent.press(view.getByTestId("about-contact"))
  expect(await view.findByTestId("about-link-error")).toBeOnTheScreen()
  expect(queued).toHaveBeenCalledWith(
    expect.stringContaining("We couldn’t open this link. Please try again."),
    { queue: true },
  )
  expect(mockAnnounce).not.toHaveBeenCalled()
  queued.mockRestore()
})
