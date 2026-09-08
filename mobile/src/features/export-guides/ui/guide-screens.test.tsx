import { fireEvent, render } from "@testing-library/react-native"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { AccessibilityInfo, StyleSheet } from "react-native"

import type {
  ExportGuideCatalogue,
  ExportGuidePinnedSnapshot,
} from "@/features/export-guides/data"
import { useImportDraft } from "@/features/onboarding/draft"
import i18n from "@/i18n"
import { Colors } from "@/theme"

import GuidePageScreen from "./guide-page-screen"
import ProviderSelectionScreen from "./provider-selection-screen"

const mockLoad = jest.fn()
const mockRetry = jest.fn()
let mockBusy = false
let mockScheme: "light" | "dark" = "light"
let mockFontScale = 1

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  Stack: { Screen: jest.fn(() => null) },
  useLocalSearchParams: jest.fn(() => ({ pageIndex: "0" })),
}))
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockScheme,
}))
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 320,
    height: 480,
    scale: 2,
    fontScale: mockFontScale,
  }),
}))
jest.mock("@/features/onboarding/draft", () => ({
  ...jest.requireActual("@/features/onboarding/draft"),
  useImportDraft: jest.fn(),
}))
jest.mock("./use-export-guide-load", () => ({
  exportGuideLocale: () => "en",
  useExportGuideLoad: () => ({
    locale: "en",
    busy: mockBusy,
    load: mockLoad,
    retry: mockRetry,
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
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockStackScreen = Stack.Screen as unknown as jest.Mock
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

beforeEach(async () => {
  jest.clearAllMocks()
  mockBusy = false
  mockScheme = "light"
  mockFontScale = 1
  mockUseLocalSearchParams.mockReturnValue({ pageIndex: "0" })
  await i18n.changeLanguage("en")
  jest
    .spyOn(AccessibilityInfo, "setAccessibilityFocus")
    .mockImplementation(() => undefined)
})

afterEach(() => jest.restoreAllMocks())

describe("GuidePageScreen", () => {
  it("recovers page zero to an incomplete listed Connect gate", async () => {
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "draft",
        draft: {
          institution: {
            kind: "listed",
            school: {
              intranetUrl: "https://example.com/connect",
              exportGuide: {
                providerSlug: "future-provider",
                requireProgramme: false,
                requireConnect: true,
                catalogueVersion: "v1",
              },
            },
          },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
      },
      dispatch,
    })

    const view = await render(<GuidePageScreen />)
    expect(view.getByText("Loading the export guide…")).toBeTruthy()
    expect(mockLoad).not.toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith("/onboarding/connect")
  })

  it("renders server strings inertly with localized progress and advances by push", async () => {
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "guide",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
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
    expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledTimes(1)
    expect(
      StyleSheet.flatten(view.getByTestId("export-guide-next").props.style),
    ).toEqual(expect.objectContaining({ minHeight: expect.any(Number) }))
    await fireEvent.press(view.getByTestId("export-guide-next"))
    expect(dispatch).toHaveBeenCalledWith({ type: "visit-page", pageIndex: 1 })
    expect(router.push).toHaveBeenCalledWith("/onboarding/export-guide/1")
  })

  it("renders the complete French shell for a French pinned page", async () => {
    await i18n.changeLanguage("fr")
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "guide",
        draft: {
          institution: { kind: "unlisted", schoolName: "Établissement" },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
        snapshot: { ...snapshot, locale: "fr" },
        visitedThrough: 0,
      },
      dispatch,
    })
    const view = await render(<GuidePageScreen />)

    expect(
      view.getByTestId("export-guide-progress").props.accessibilityLabel,
    ).toBe("Page 1 sur 2")
    expect(view.getByText("Suivant")).toBeTruthy()
    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          title: "Exportez votre emploi du temps",
        }),
      }),
      undefined,
    )
  })

  it("uses dark tokens without replacing native Stack chrome", async () => {
    mockScheme = "dark"
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "guide",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
        snapshot,
        visitedThrough: 0,
      },
      dispatch,
    })
    const view = await render(<GuidePageScreen />)

    expect(
      StyleSheet.flatten(view.getByTestId("export-guide-page").props.style),
    ).toEqual(
      expect.objectContaining({ backgroundColor: Colors.dark.background }),
    )
    expect(
      StyleSheet.flatten(
        view.getByTestId("export-guide-visible-back").props.style,
      ),
    ).toEqual(expect.objectContaining({ borderColor: Colors.dark.primary }))
    expect(mockStackScreen).toHaveBeenCalled()
  })

  it("keeps the largest text layout scrollable with reachable actions", async () => {
    mockFontScale = 3
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "guide",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
        snapshot,
        visitedThrough: 0,
      },
      dispatch,
    })
    const view = await render(<GuidePageScreen />)

    expect(view.getByTestId("export-guide-page-scroll")).toBeTruthy()
    expect(view.getByTestId("export-guide-next")).toBeEnabled()
    expect(view.getByTestId("export-guide-visible-back")).toBeEnabled()
  })

  it("keeps native Stack Back enabled and makes visible Back pop once", async () => {
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "guide",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
        snapshot,
        visitedThrough: 0,
      },
      dispatch,
    })
    const view = await render(<GuidePageScreen />)

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.not.objectContaining({ gestureEnabled: false }),
      }),
      undefined,
    )
    await fireEvent.press(view.getByTestId("export-guide-visible-back"))
    expect(router.back).toHaveBeenCalledTimes(1)
  })

  it("degrades a failed image to one accessible text-only meaning", async () => {
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "guide",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
        snapshot,
        visitedThrough: 0,
      },
      dispatch,
    })
    const view = await render(<GuidePageScreen />)

    await fireEvent(view.getByTestId("export-guide-page-image"), "error")
    const placeholder = view.getByTestId("export-guide-page-image-placeholder")
    expect(placeholder.props.accessibilityRole).toBe("image")
    expect(placeholder.props.accessibilityLabel).toBe("Open the export menu")
    expect(view.getByText("The menu is beside Settings")).toBeTruthy()
    expect(view.getAllByLabelText("Open the export menu")).toHaveLength(1)
    expect(view.getByTestId("export-guide-next")).toBeEnabled()
  })

  it("completes only the visited final page and pushes manual import", async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({ pageIndex: "1" })
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "guide",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
        snapshot,
        visitedThrough: 1,
      },
      dispatch,
    })
    const view = await render(<GuidePageScreen />)

    await fireEvent.press(view.getByTestId("export-guide-next"))
    expect(dispatch).toHaveBeenCalledWith({
      type: "complete-guide",
      pageIndex: 1,
    })
    expect(router.push).toHaveBeenCalledWith("/onboarding/import")
  })

  it("renders the completed final page restored by Back from manual import", async () => {
    mockUseLocalSearchParams.mockReturnValue({ pageIndex: "1" })
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "completed",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
        snapshot,
        visitedThrough: 1,
        manualHandoff: "none",
      },
      dispatch,
    })
    const view = await render(<GuidePageScreen />)

    expect(view.getByText("Second")).toBeTruthy()
    expect(view.getByTestId("export-guide-next")).toBeDisabled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it("renders blocking recovery with single retry and ordinary Back", async () => {
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "blocked",
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        draftRevision: 2,
        gateProgress: "programme",
        locale: "en",
        selector: { kind: "active" },
        failure: "network",
        attempt: 1,
      },
      dispatch,
    })
    const view = await render(<GuidePageScreen />)

    expect(
      view.getByText(
        "The guide is required before you can import your timetable.",
      ).parent?.props.accessibilityRole,
    ).toBe("alert")
    await fireEvent.press(view.getByTestId("export-guide-retry"))
    await fireEvent.press(view.getByTestId("export-guide-back"))
    expect(mockRetry).toHaveBeenCalledTimes(1)
    expect(router.back).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["malformed", "1x", 1],
    ["negative", "-1", 1],
    ["out of range", "2", 1],
    ["ahead of contiguous progress", "1", 0],
  ])(
    "does not clamp a %s page index",
    async (_case, pageIndex, visitedThrough) => {
      mockUseLocalSearchParams.mockReturnValue({ pageIndex })
      mockUseImportDraft.mockReturnValue({
        state: {
          phase: "guide",
          draft: {
            institution: { kind: "unlisted", schoolName: "School" },
            calendarName: "",
          },
          draftRevision: 1,
          gateProgress: "programme",
          snapshot,
          visitedThrough,
        },
        dispatch,
      })
      await render(<GuidePageScreen />)
      expect(router.replace).toHaveBeenCalledWith("/onboarding/export-guide/0")
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "complete-guide" }),
      )
    },
  )
})

describe("ProviderSelectionScreen", () => {
  it("recovers a listed direct entry instead of loading forever", async () => {
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "draft",
        draft: {
          institution: {
            kind: "listed",
            school: {
              intranetUrl: null,
              exportGuide: {
                providerSlug: "future-provider",
                requireProgramme: false,
                requireConnect: false,
                catalogueVersion: "v1",
              },
            },
          },
          calendarName: "",
        },
        draftRevision: 1,
        gateProgress: "programme",
      },
      dispatch,
    })

    const view = await render(<ProviderSelectionScreen />)
    expect(view.toJSON()).toBeNull()
    expect(router.replace).toHaveBeenCalledWith("/onboarding/export-guide/0")
  })

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
        gateProgress: "programme",
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
    await fireEvent.press(
      view.getByTestId("export-guide-provider-future-provider"),
    )
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "start-guide" }),
    )
    expect(router.push).toHaveBeenCalledWith("/onboarding/export-guide/0")
  })
})
