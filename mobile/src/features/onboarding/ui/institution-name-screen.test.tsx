import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"
import type { ReactNode } from "react"

import { useImportDraft } from "@/features/onboarding/draft"
import { clearSelection } from "@/features/school-selection"
import { usePlatform } from "@/test-support/platform"

import InstitutionNameScreen from "./institution-name-screen"

// Presentational (70% floor): renders through the real theme + i18n trees. Mocks
// the draft seam and the school-selection store (both proven in their own
// suites) and asserts the three things only this screen decides: the name is
// REQUIRED here, the 100-character boundary bites on the TRIMMED value, and
// entering the unlisted path clears the legacy persisted selection.
jest.mock("react-native", () => {
  const React = jest.requireActual<typeof import("react")>("react")
  const actual =
    jest.requireActual<typeof import("react-native")>("react-native")
  const transparent = (testID: string) =>
    function TransparentLayout({
      children,
      ...props
    }: {
      children?: ReactNode
      [key: string]: unknown
    }) {
      return React.createElement(actual.View, { ...props, testID }, children)
    }

  const descriptors = Object.getOwnPropertyDescriptors(actual)
  Reflect.deleteProperty(descriptors, "KeyboardAvoidingView")
  Reflect.deleteProperty(descriptors, "ScrollView")
  return Object.defineProperties(
    {
      KeyboardAvoidingView: transparent("keyboard-avoiding-layout"),
      ScrollView: transparent("keyboard-scroll-layout"),
    },
    descriptors,
  )
})
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))
jest.mock("@/features/school-selection", () => ({ clearSelection: jest.fn() }))

const mockSetUnlistedInstitution = jest.fn()
// Spread requireActual: the screen validates through the REAL normalizers, so
// stubbing the whole sub-barrel would silently remove the behaviour under test.
jest.mock("@/features/onboarding/draft", () => ({
  ...jest.requireActual("@/features/onboarding/draft"),
  useImportDraft: jest.fn(),
}))

const mockPush = router.push as jest.Mock
const mockClearSelection = clearSelection as jest.Mock
const mockUseImportDraft = useImportDraft as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockUseImportDraft.mockReturnValue({
    setUnlistedInstitution: mockSetUnlistedInstitution,
  })
})

const submitWith = async (value: string) => {
  const view = await render(<InstitutionNameScreen />)
  await act(async () => {
    fireEvent.changeText(
      view.getByTestId("onboarding-institution-input"),
      value,
    )
  })
  await act(async () => {
    fireEvent.press(view.getByTestId("onboarding-institution-continue"))
  })
  return view
}

describe("InstitutionNameScreen", () => {
  it("renders the localized title, label and action (not raw keys)", async () => {
    const { getByText } = await render(<InstitutionNameScreen />)

    expect(getByText("Which institution?")).toBeTruthy()
    expect(getByText("Institution name")).toBeTruthy()
    expect(getByText("Continue")).toBeTruthy()
  })

  it("writes the trimmed unlisted draft, clears the legacy selection, and continues", async () => {
    await submitWith("  École du Coin  ")

    expect(mockSetUnlistedInstitution).toHaveBeenCalledWith("École du Coin")
    // The legacy MMKV selection must not survive: a stale school id there is how
    // an unlisted import gets attributed to a school the student could not find.
    expect(mockClearSelection).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith("/onboarding/programme")
  })

  it.each([
    ["empty", ""],
    ["whitespace-only", "   "],
  ])(
    "rejects a %s name with accessible inline validation and no navigation",
    async (_label, value) => {
      const { getByTestId, getByText } = await submitWith(value)

      expect(getByText("Enter your institution's name.")).toBeTruthy()
      const error = getByTestId("onboarding-institution-error")
      expect(error.props.accessibilityLiveRegion).toBe("polite")
      expect(error.props.accessibilityRole).toBe("alert")
      expect(mockSetUnlistedInstitution).not.toHaveBeenCalled()
      expect(mockClearSelection).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    },
  )

  it("accepts exactly 100 characters and rejects 101, measured after trimming", async () => {
    await submitWith(`  ${"x".repeat(100)}  `)
    expect(mockSetUnlistedInstitution).toHaveBeenCalledWith("x".repeat(100))

    jest.clearAllMocks()
    const { getByText } = await submitWith("x".repeat(101))
    expect(getByText("Use 100 characters or fewer.")).toBeTruthy()
    expect(mockSetUnlistedInstitution).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("clears the validation message as soon as the field is edited", async () => {
    const { getByTestId, queryByTestId } = await submitWith("")
    expect(getByTestId("onboarding-institution-error")).toBeTruthy()

    await act(async () => {
      fireEvent.changeText(getByTestId("onboarding-institution-input"), "É")
    })
    expect(queryByTestId("onboarding-institution-error")).toBeNull()
  })

  it("accepts accents and emoji verbatim", async () => {
    await submitWith(" Université Gustave Eiffel 🎓 ")
    expect(mockSetUnlistedInstitution).toHaveBeenCalledWith(
      "Université Gustave Eiffel 🎓",
    )
  })

  describe("keyboard-safe layout", () => {
    describe("on iOS", () => {
      usePlatform("ios")

      it("lifts the tappable Continue control above the keyboard", async () => {
        const view = await render(<InstitutionNameScreen />)
        const avoiding = view.getByTestId("keyboard-avoiding-layout")
        const scroll = view.getByTestId("keyboard-scroll-layout")

        expect(avoiding.props.behavior).toBe("padding")
        expect(scroll.props.keyboardShouldPersistTaps).toBe("handled")
        expect(scroll.props.contentContainerStyle).toEqual(
          expect.objectContaining({ flexGrow: 1, justifyContent: "center" }),
        )
        expect(
          scroll.queryAll(
            (node) => node.props.testID === "onboarding-institution-continue",
          ),
        ).toHaveLength(1)
        expect(
          avoiding.queryAll(
            (node) => node.props.testID === "onboarding-institution-continue",
          ),
        ).toHaveLength(1)
      })
    })

    describe("on Android", () => {
      usePlatform("android")

      it("keeps resize-driven behavior while allowing taps through the keyboard", async () => {
        const view = await render(<InstitutionNameScreen />)
        const avoiding = view.getByTestId("keyboard-avoiding-layout")
        const scroll = view.getByTestId("keyboard-scroll-layout")

        expect(avoiding.props.behavior).toBeUndefined()
        expect(scroll.props.keyboardShouldPersistTaps).toBe("handled")
        expect(
          scroll.queryAll(
            (node) => node.props.testID === "onboarding-institution-continue",
          ),
        ).toHaveLength(1)
      })
    })
  })
})
