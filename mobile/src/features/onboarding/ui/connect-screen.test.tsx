import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { StyleSheet } from "react-native"

import { useImportDraft } from "@/features/onboarding/draft"
import type { SchoolListItem } from "@/features/school-selection/data"
import { Colors, resolveResponsiveLayout } from "@/theme"

import ConnectScreen from "./connect-screen"

// Presentational (70% floor). The REAL safeIntranetUrl is kept (requireActual
// spread) so the screen's link gate runs through the shipped helper — the
// javascript:/file: rows below are a security assertion about what this screen
// will hand to the browser, not a restatement of types.test.ts.
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  Stack: { Screen: () => null },
}))
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }))
jest.mock("@/features/onboarding/draft", () => ({
  ...jest.requireActual("@/features/onboarding/draft"),
  useImportDraft: jest.fn(),
}))

let mockFontScale = 1
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: mockFontScale,
  }),
}))

const mockPush = router.push as jest.Mock
const mockReplace = router.replace as jest.Mock
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
  exportGuide: {
    providerSlug: "generic",
    requireProgramme: true,
    requireConnect: true,
    catalogueVersion: "test-v1",
  },
})

const listed = (intranetUrl: string | null) => ({
  institution: { kind: "listed" as const, school: school(intranetUrl) },
  calendarName: "L3 Informatique",
})

const draftValue = (draft: ReturnType<typeof listed> | null) => ({
  draft,
  dispatch: jest.fn(),
  state:
    draft === null
      ? { phase: "empty" as const, draftRevision: 0 }
      : {
          phase: "draft" as const,
          draftRevision: 2,
          gateProgress: "programme" as const,
          draft,
        },
})

beforeEach(() => {
  jest.clearAllMocks()
  mockFontScale = 1
  mockUseImportDraft.mockReturnValue(
    draftValue(listed("https://example.com/connect")),
  )
})

const footer = ["onboarding-connect-back", "onboarding-connect-continue"]

const footerOrder = () =>
  screen
    .getAllByRole("button")
    .map((button) => button.props.testID as string)
    .filter((id) => footer.includes(id))

describe("ConnectScreen", () => {
  it("lays Back before Continue at the default text size", async () => {
    await render(<ConnectScreen />)
    expect(footerOrder()).toEqual([
      "onboarding-connect-back",
      "onboarding-connect-continue",
    ])
  })

  it("stacks Continue above Back at an accessibility text size", async () => {
    mockFontScale = 3.571
    await render(<ConnectScreen />)
    expect(footerOrder()).toEqual([
      "onboarding-connect-continue",
      "onboarding-connect-back",
    ])
  })

  it("recovers a restored Connect route that skipped required Programme", async () => {
    const draft = listed("https://example.com/connect")
    mockUseImportDraft.mockReturnValue({
      draft,
      dispatch: jest.fn(),
      state: {
        phase: "draft",
        draftRevision: 1,
        gateProgress: "institution",
        draft,
      },
    })

    const view = await render(<ConnectScreen />)
    expect(view.toJSON()).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith("/onboarding/programme")
  })

  it("keeps the step in a measured readable tablet lane", async () => {
    const { getByTestId } = await render(<ConnectScreen />)
    const owner = getByTestId("onboarding-connect-content")

    await act(() =>
      fireEvent(owner, "layout", {
        nativeEvent: { layout: { width: 1024, height: 0, x: 0, y: 0 } },
      }),
    )

    const content = owner.children[0] as unknown as {
      props: { style: unknown }
    }
    const layout = resolveResponsiveLayout(1024, "readable")
    expect(StyleSheet.flatten(content.props.style)).toMatchObject({
      maxWidth: layout.contentWidth + 2 * layout.gutter,
      paddingHorizontal: layout.gutter,
    })
  })

  it("renders the localized guidance", async () => {
    const { getByText, queryByText } = await render(<ConnectScreen />)

    expect(queryByText("Sign in to the intranet")).toBeNull()
    expect(
      getByText(
        "On your computer, or in this device's browser, sign in to your institution's site and open your timetable.",
      ),
    ).toBeTruthy()
  })

  it.each(["https://intranet.univ-eiffel.fr/", "http://ent.example.org/edt"])(
    "renders an institution-labelled link for %s and opens it",
    async (url) => {
      mockUseImportDraft.mockReturnValue(draftValue(listed(url)))
      const { getByTestId, getByText } = await render(<ConnectScreen />)

      const link = getByTestId("onboarding-connect-intranet")
      expect(getByText("Université Gustave Eiffel")).toBeTruthy()
      expect(link.props.accessibilityRole).toBe("link")
      expect(StyleSheet.flatten(link.props.style)).toMatchObject({
        alignSelf: "stretch",
        borderColor: Colors.light.outline,
      })
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
    mockUseImportDraft.mockReturnValue(draftValue(listed(intranetUrl)))
    const { queryByTestId } = await render(<ConnectScreen />)

    expect(queryByTestId("onboarding-connect-intranet")).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith("/onboarding/export-guide/0")
  })

  it("renders no link for an unlisted institution — there is no trusted URL", async () => {
    const draft = {
      institution: { kind: "unlisted" as const, schoolName: "École du Coin" },
      calendarName: "",
    }
    mockUseImportDraft.mockReturnValue({
      draft,
      dispatch: jest.fn(),
      state: {
        phase: "draft",
        draftRevision: 2,
        gateProgress: "programme",
        draft,
      },
    })
    const { queryByTestId } = await render(<ConnectScreen />)

    expect(queryByTestId("onboarding-connect-intranet")).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith(
      "/onboarding/export-guide/providers",
    )
  })

  it.each([
    ["a listed draft with a link", () => listed("https://ent.example.org")],
  ])(
    "always offers Back and Continue with %s, and Continue opens manual import",
    async (_label, makeDraft) => {
      const value = draftValue(makeDraft())
      mockUseImportDraft.mockReturnValue(value)
      const { getByTestId } = await render(<ConnectScreen />)
      expect(
        within(getByTestId("onboarding-connect-back")).getByText("Back"),
      ).toHaveStyle({ color: Colors.light.actionText })

      await act(async () =>
        fireEvent.press(getByTestId("onboarding-connect-back")),
      )
      expect(mockBack).toHaveBeenCalledTimes(1)

      await act(async () =>
        fireEvent.press(getByTestId("onboarding-connect-continue")),
      )
      // The assistant insertion point: a plain push, nothing handed forward.
      expect(mockPush).toHaveBeenCalledWith("/onboarding/export-guide/0")
      expect(value.dispatch).toHaveBeenCalledWith({
        type: "complete-connect",
      })
    },
  )
})
