import { fireEvent, render } from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"
import { AccessibilityInfo } from "react-native"

import type {
  ExportGuideCatalogue,
  ExportGuidePinnedSnapshot,
} from "@/features/export-guides/data"
import { useImportDraft } from "@/features/onboarding/draft"

import GuidePageScreen from "./guide-page-screen"
import ProviderSelectionScreen from "./provider-selection-screen"

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: jest.fn(() => ({ pageIndex: "0" })),
}))
jest.mock("@/features/onboarding/draft", () => ({
  ...jest.requireActual("@/features/onboarding/draft"),
  useImportDraft: jest.fn(),
}))
jest.mock("./use-export-guide-load", () => ({
  exportGuideLocale: () => "en",
  useExportGuideLoad: () => ({
    locale: "en",
    busy: false,
    load: jest.fn(),
    retry: jest.fn(),
  }),
}))
jest.mock("./telemetry", () => ({
  emitExportGuideEvent: jest.fn(),
  recordExportGuideInvariant: jest.fn(),
}))
jest.mock("expo-image", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native")
  return { Image: View }
})

const mockUseImportDraft = useImportDraft as jest.Mock
const dispatch = jest.fn()

const snapshot: ExportGuidePinnedSnapshot = {
  locale: "en",
  catalogueVersion: "v1",
  providerSlug: "future-provider",
  providerLabel: "Future Provider",
  reason: "exact",
  pages: [
    {
      title: "<b>Literal heading</b>",
      description: "[Not a link](javascript:alert(1))",
      image: {
        url: "https://assets.example.com/page.png",
        mimeType: "image/png",
        byteSize: 10,
        width: 100,
        height: 100,
        altText: "Open the export menu",
        caption: "The menu is beside Settings",
      },
    },
    { title: "Second", description: "Finish" },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  jest
    .spyOn(AccessibilityInfo, "setAccessibilityFocus")
    .mockImplementation(() => undefined)
})

afterEach(() => jest.restoreAllMocks())

describe("GuidePageScreen", () => {
  it("renders server strings inertly with localized progress and advances by push", async () => {
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "guide",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        snapshot,
        visitedThrough: 0,
      },
      dispatch,
    })
    const view = await render(<GuidePageScreen />)

    expect(view.getByText("<b>Literal heading</b>")).toBeTruthy()
    expect(view.getByText("[Not a link](javascript:alert(1))")).toBeTruthy()
    expect(view.queryByRole("link")).toBeNull()
    expect(
      view.getByTestId("export-guide-progress").props.accessibilityLabel,
    ).toBe("Page 1 of 2")
    fireEvent.press(view.getByTestId("export-guide-next"))
    expect(dispatch).toHaveBeenCalledWith({ type: "visit-page", pageIndex: 1 })
    expect(router.push).toHaveBeenCalledWith("/onboarding/export-guide/1")
  })

  it("does not clamp a malformed page index", async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({ pageIndex: "1x" })
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "guide",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        snapshot,
        visitedThrough: 1,
      },
      dispatch,
    })
    await render(<GuidePageScreen />)
    expect(router.replace).toHaveBeenCalledWith("/onboarding/export-guide/0")
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "complete-guide" }),
    )
  })
})

describe("ProviderSelectionScreen", () => {
  it("renders every ordered selectable provider without a client allowlist", async () => {
    const provider = {
      slug: "future-provider",
      label: "Future Provider",
      kind: "pages" as const,
      selectable: true,
      compatibility: { minClientSchema: 1, maxClientSchema: 1 },
      pages: snapshot.pages,
    }
    const generic = { ...provider, slug: "generic", label: "Generic" }
    const catalogue: ExportGuideCatalogue = {
      schemaVersion: 1,
      catalogueVersion: "v1",
      locale: "en",
      providers: [provider, generic],
      rejectedProviders: {},
    }
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "selecting-provider",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        locale: "en",
        catalogue,
        providers: [provider, generic],
      },
      dispatch,
    })
    const view = await render(<ProviderSelectionScreen />)
    expect(
      view.getAllByRole("button").map((node) => node.props.accessibilityLabel),
    ).toEqual(["Future Provider", "Generic"])
    fireEvent.press(view.getByTestId("export-guide-provider-future-provider"))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "start-guide" }),
    )
    expect(router.push).toHaveBeenCalledWith("/onboarding/export-guide/0")
  })
})
