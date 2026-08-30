import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"

import { useImportDraft } from "@/features/onboarding/draft"
import type { SchoolListItem } from "@/features/school-selection/data"

import ConnectScreen from "./connect-screen"

// Presentational (70% floor). The REAL safeIntranetUrl is kept (requireActual
// spread) so the screen's link gate runs through the shipped helper — the
// javascript:/file: rows below are a security assertion about what this screen
// will hand to the browser, not a restatement of types.test.ts.
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
}))
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }))
jest.mock("@/features/onboarding/draft", () => ({
  ...jest.requireActual("@/features/onboarding/draft"),
  useImportDraft: jest.fn(),
}))

const mockPush = router.push as jest.Mock
const mockBack = router.back as jest.Mock
const mockOpenBrowser = WebBrowser.openBrowserAsync as jest.Mock
const mockUseImportDraft = useImportDraft as jest.Mock

const school = (intranetUrl: string | null): SchoolListItem => ({
  id: "univeiffel",
  name: "Université Gustave Eiffel",
  code: "UPEM",
  imageUrl: "",
  imageUrlDark: null,
  intranetUrl,
})

const listed = (intranetUrl: string | null) => ({
  institution: { kind: "listed" as const, school: school(intranetUrl) },
  calendarName: "L3 Informatique",
})

beforeEach(() => {
  jest.clearAllMocks()
  mockUseImportDraft.mockReturnValue({ draft: listed(null) })
})

describe("ConnectScreen", () => {
  it("renders the localized guidance", async () => {
    const { getByText } = await render(<ConnectScreen />)

    expect(getByText("Sign in to your intranet")).toBeTruthy()
    expect(
      getByText(
        "On your computer, or in this device's browser, sign in to your institution's site and open your timetable.",
      ),
    ).toBeTruthy()
  })

  it.each(["https://intranet.univ-eiffel.fr/", "http://ent.example.org/edt"])(
    "renders an institution-labelled link for %s and opens it",
    async (url) => {
      mockUseImportDraft.mockReturnValue({ draft: listed(url) })
      const { getByTestId, getByText } = await render(<ConnectScreen />)

      const link = getByTestId("onboarding-connect-intranet")
      expect(getByText("Université Gustave Eiffel")).toBeTruthy()
      expect(link.props.accessibilityRole).toBe("link")
      // The label says the action AND the destination, so a screen-reader user
      // knows the tap leaves the app.
      expect(link.props.accessibilityLabel).toBe(
        "Open Université Gustave Eiffel's site in the browser",
      )

      await act(async () => fireEvent.press(link))
      expect(mockOpenBrowser).toHaveBeenCalledWith(url)
    },
  )

  it.each([
    ["null", null],
    ["empty", ""],
    ["whitespace", "   "],
    ["a javascript: scheme", "javascript:alert(1)"],
    ["a file: scheme", "file:///etc/passwd"],
    ["an unparseable value", "univ-eiffel.fr"],
  ])("renders no link for %s", async (_label, intranetUrl) => {
    mockUseImportDraft.mockReturnValue({ draft: listed(intranetUrl) })
    const { queryByTestId } = await render(<ConnectScreen />)

    expect(queryByTestId("onboarding-connect-intranet")).toBeNull()
  })

  it("renders no link for an unlisted institution — there is no trusted URL", async () => {
    mockUseImportDraft.mockReturnValue({
      draft: {
        institution: { kind: "unlisted", schoolName: "École du Coin" },
        calendarName: "",
      },
    })
    const { queryByTestId } = await render(<ConnectScreen />)

    expect(queryByTestId("onboarding-connect-intranet")).toBeNull()
  })

  it.each([
    ["a listed draft with a link", () => listed("https://ent.example.org")],
    ["a listed draft without one", () => listed(null)],
    ["no draft at all", () => null],
  ])(
    "always offers Back and Continue with %s, and Continue opens manual import",
    async (_label, makeDraft) => {
      mockUseImportDraft.mockReturnValue({ draft: makeDraft() })
      const { getByTestId } = await render(<ConnectScreen />)

      await act(async () =>
        fireEvent.press(getByTestId("onboarding-connect-back")),
      )
      expect(mockBack).toHaveBeenCalledTimes(1)

      await act(async () =>
        fireEvent.press(getByTestId("onboarding-connect-continue")),
      )
      // The assistant insertion point: a plain push, nothing handed forward.
      expect(mockPush).toHaveBeenCalledWith("/onboarding/import")
    },
  )
})
