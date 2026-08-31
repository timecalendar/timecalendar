import { act, fireEvent, render } from "@testing-library/react-native"
import { router, Stack } from "expo-router"
import type { ReactElement, ReactNode } from "react"

import { useImportDraft } from "@/features/onboarding/draft"
import { usePlatform } from "@/test-support/platform"

import ProgrammeScreen from "./programme-screen"

// Presentational (70% floor). The in-body field and Continue are asserted
// directly; the Skip action is native header chrome, so it is asserted through
// the options handed to the mocked Stack.Screen — the same seam the navigator
// reads at runtime. Both platforms are exercised through usePlatform (an inline
// jest.replaceProperty leaks into later tests — TIM-273).
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: jest.fn(() => null) },
}))
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

const mockSetCalendarName = jest.fn()
jest.mock("@/features/onboarding/draft", () => ({
  ...jest.requireActual("@/features/onboarding/draft"),
  useImportDraft: jest.fn(),
}))

const mockPush = router.push as jest.Mock
const mockUseImportDraft = useImportDraft as jest.Mock
const mockStackScreen = Stack.Screen as unknown as jest.Mock

const screenOptions = () =>
  mockStackScreen.mock.lastCall?.[0].options as {
    headerShown: boolean
    headerRight?: () => ReactElement
    unstable_headerRightItems?: () => {
      label: string
      accessibilityLabel: string
      onPress: () => void
    }[]
  }

beforeEach(() => {
  jest.clearAllMocks()
  mockUseImportDraft.mockReturnValue({ setCalendarName: mockSetCalendarName })
})

const typeAndSubmit = async (value: string) => {
  const view = await render(<ProgrammeScreen />)
  await act(async () => {
    fireEvent.changeText(view.getByTestId("onboarding-programme-input"), value)
  })
  await act(async () => {
    fireEvent.press(view.getByTestId("onboarding-programme-continue"))
  })
  return view
}

describe("ProgrammeScreen", () => {
  it("renders the localized copy, the field label and the example placeholder", async () => {
    const { getByText, getByTestId } = await render(<ProgrammeScreen />)

    expect(getByText("Your programme")).toBeTruthy()
    expect(getByText("Programme name")).toBeTruthy()
    // The example is a placeholder prop only — it can never reach the draft.
    expect(getByTestId("onboarding-programme-input").props.placeholder).toBe(
      "L3 Informatique",
    )
    expect(mockSetCalendarName).not.toHaveBeenCalled()
  })

  it("stores the trimmed value and continues to Connect", async () => {
    await typeAndSubmit("  L3 Informatique  ")

    expect(mockSetCalendarName).toHaveBeenCalledWith("L3 Informatique")
    expect(mockPush).toHaveBeenCalledWith("/onboarding/connect")
  })

  it.each([
    ["accents", " Licence Économie "],
    ["non-Latin script", " 情報工学 "],
    ["emoji", " L3 Info 🎓 "],
  ])("accepts %s verbatim", async (_label, value) => {
    await typeAndSubmit(value)
    expect(mockSetCalendarName).toHaveBeenCalledWith(value.trim())
  })

  it("accepts exactly 100 characters and rejects 101, measured after trimming", async () => {
    await typeAndSubmit(`  ${"x".repeat(100)}  `)
    expect(mockSetCalendarName).toHaveBeenCalledWith("x".repeat(100))
    expect(mockPush).toHaveBeenCalledWith("/onboarding/connect")

    jest.clearAllMocks()
    const { getByTestId, getByText } = await typeAndSubmit("x".repeat(101))
    expect(getByText("Use 100 characters or fewer.")).toBeTruthy()
    const error = getByTestId("onboarding-programme-error")
    expect(error.props.accessibilityLiveRegion).toBe("polite")
    expect(error.props.accessibilityRole).toBe("alert")
    expect(mockSetCalendarName).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  // Skip is the ONLY route to an empty name — with Continue disabled on empty,
  // the app never invents one.
  it("disables Continue while the field is empty or whitespace", async () => {
    const { getByTestId } = await render(<ProgrammeScreen />)
    const cta = getByTestId("onboarding-programme-continue")

    expect(cta.props.accessibilityState.disabled).toBe(true)
    await act(async () => {
      fireEvent.changeText(getByTestId("onboarding-programme-input"), "   ")
    })
    expect(cta.props.accessibilityState.disabled).toBe(true)
    await act(async () => fireEvent.press(cta))
    expect(mockSetCalendarName).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.changeText(getByTestId("onboarding-programme-input"), "L3")
    })
    expect(
      getByTestId("onboarding-programme-continue").props.accessibilityState
        .disabled,
    ).toBe(false)
  })

  describe("on iOS", () => {
    usePlatform("ios")

    it("lifts the tappable Continue control above the keyboard", async () => {
      const view = await render(<ProgrammeScreen />)
      const avoiding = view.getByTestId("keyboard-avoiding-layout")
      const scroll = view.getByTestId("keyboard-scroll-layout")

      expect(avoiding.props.behavior).toBe("padding")
      expect(scroll.props.keyboardShouldPersistTaps).toBe("handled")
      expect(scroll.props.contentContainerStyle).toEqual(
        expect.objectContaining({ flexGrow: 1, justifyContent: "center" }),
      )
      expect(
        scroll.queryAll(
          (node) => node.props.testID === "onboarding-programme-continue",
        ),
      ).toHaveLength(1)
    })

    it("offers Skip as a trailing native header item that stores an empty name", async () => {
      await render(<ProgrammeScreen />)
      const options = screenOptions()

      expect(options.headerShown).toBe(true)
      expect(options.headerRight).toBeUndefined()
      const [item] = options.unstable_headerRightItems?.() ?? []
      expect(item?.label).toBe("Skip")
      expect(item?.accessibilityLabel).toBe("Skip naming your programme")

      await act(async () => item?.onPress())
      expect(mockSetCalendarName).toHaveBeenCalledWith("")
      expect(mockPush).toHaveBeenCalledWith("/onboarding/connect")
    })
  })

  describe("on Android", () => {
    usePlatform("android")

    it("keeps resize-driven behavior while allowing taps through the keyboard", async () => {
      const view = await render(<ProgrammeScreen />)
      const avoiding = view.getByTestId("keyboard-avoiding-layout")
      const scroll = view.getByTestId("keyboard-scroll-layout")

      expect(avoiding.props.behavior).toBeUndefined()
      expect(scroll.props.keyboardShouldPersistTaps).toBe("handled")
      expect(
        scroll.queryAll(
          (node) => node.props.testID === "onboarding-programme-continue",
        ),
      ).toHaveLength(1)
    })

    it("offers Skip as a headerRight control meeting the 48dp target", async () => {
      await render(<ProgrammeScreen />)
      const options = screenOptions()

      expect(options.unstable_headerRightItems).toBeUndefined()
      const { getByTestId } = await render(
        options.headerRight?.() as ReactElement,
      )
      const skip = getByTestId("onboarding-programme-skip")

      expect(skip.props.accessibilityRole).toBe("button")
      expect(skip.props.accessibilityLabel).toBe("Skip naming your programme")
      expect(skip.props.style).toEqual(
        expect.objectContaining({ minWidth: 48, minHeight: 48 }),
      )

      await act(async () => fireEvent.press(skip))
      expect(mockSetCalendarName).toHaveBeenCalledWith("")
      expect(mockPush).toHaveBeenCalledWith("/onboarding/connect")
    })
  })
})
