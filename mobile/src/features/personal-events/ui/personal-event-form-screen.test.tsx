import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Alert, StyleSheet } from "react-native"

import { resolveKeyboardAvoidingBehavior } from "@/components/keyboard-avoiding-behavior"
import type { PersonalEvent } from "@/features/personal-events/data"
import {
  useDeleteEvent,
  useEventToEdit,
  useSaveEvent,
} from "@/features/personal-events/form"
import { usePlatform } from "@/test-support/platform"
import { Colors, resolveResponsiveLayout, Spacing } from "@/theme"

import PersonalEventFormScreen from "./personal-event-form-screen"

// Presentational form (70% floor): renders localized labels through the real
// theme + i18n trees, drives the real validate/build logic, and asserts the
// save/delete/edit HOOKS are called (mocked — the wiring without a real DB).
// expo-router (useLocalSearchParams / router) is stubbed. The native
// DateTimePicker is mocked suite-wide (setup-expo-ui.ts) — its mock fires
// onValueChange with a fixed date so the picker→state wiring is assertable.

const mockSave = jest.fn<Promise<boolean>, [PersonalEvent]>(() =>
  Promise.resolve(true),
)
const mockRemove = jest.fn<Promise<boolean>, [string]>(() =>
  Promise.resolve(true),
)
const mockStackScreen = jest.fn((_props: unknown) => null)

jest.mock("@/features/personal-events/form", () => {
  const actual = jest.requireActual("@/features/personal-events/form")
  return {
    ...actual,
    useSaveEvent: jest.fn(),
    useDeleteEvent: jest.fn(),
    useEventToEdit: jest.fn(),
  }
})

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  router: { back: jest.fn() },
  Stack: { Screen: (props: unknown) => mockStackScreen(props) },
}))

// buildEventFromForm (real, via requireActual above) calls the @/db seam's
// newId → expo-crypto, which has no off-device JS. Mock newId deterministically
// while keeping the rest of the @/db surface (the form hooks' repository imports
// resolve their tables/operators through the suite-wide setup-db mock).
jest.mock("@/db", () => ({
  ...jest.requireActual("@/db"),
  newId: jest.fn(() => "generated-uid"),
}))

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockUseSaveEvent = useSaveEvent as jest.Mock
const mockUseDeleteEvent = useDeleteEvent as jest.Mock
const mockUseEventToEdit = useEventToEdit as jest.Mock
const mockBack = router.back as jest.Mock
let mockAlert: jest.SpiedFunction<typeof Alert.alert>

const editEvent: PersonalEvent = {
  uid: "u1",
  title: "Old",
  color: "#E91E63",
  startsAt: new Date("2030-01-01T10:00:00.000Z"),
  endsAt: new Date("2030-01-01T11:00:00.000Z"),
  exportedAt: new Date("2030-01-01T09:00:00.000Z"),
  location: "Library",
  description: "Bring notes",
}

const secondEditEvent: PersonalEvent = {
  ...editEvent,
  uid: "u2",
  title: "Second",
  location: "Lab",
  description: "Bring laptop",
}

function useEditEvent() {
  mockUseLocalSearchParams.mockReturnValue({ uid: editEvent.uid })
  mockUseEventToEdit.mockReturnValue(editEvent)
}

function latestAlert() {
  const call = mockAlert.mock.calls[mockAlert.mock.calls.length - 1]
  if (call === undefined) {
    throw new Error("Expected Alert.alert to have been called")
  }
  return { buttons: call[2] ?? [], options: call[3] }
}

beforeEach(() => {
  mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined)
  mockBack.mockReset()
  mockStackScreen.mockClear()
  mockSave.mockClear().mockResolvedValue(true)
  mockRemove.mockClear().mockResolvedValue(true)
  mockUseLocalSearchParams.mockReturnValue({})
  mockUseSaveEvent.mockReturnValue({ save: mockSave, failed: false })
  mockUseDeleteEvent.mockReturnValue({ remove: mockRemove, failed: false })
  mockUseEventToEdit.mockReturnValue(undefined)
})

afterEach(() => {
  try {
    mockAlert.mockRestore()
  } finally {
    mockBack.mockReset()
  }
})

describe("PersonalEventFormScreen", () => {
  describe.each([
    ["ios" as const, "height", 44],
    ["android" as const, "height", 48],
  ])("shared editor contract on %s", (platform, behavior, minimumTarget) => {
    usePlatform(platform)

    it("keeps semantic Save and ordered errors/actions beside the sole scroll body", async () => {
      useEditEvent()
      mockUseSaveEvent.mockReturnValue({ save: mockSave, failed: true })
      const view = await render(<PersonalEventFormScreen />)
      await waitFor(() => expect(view.getByDisplayValue("Old")).toBeTruthy())

      const owner = view.getByTestId("personal-event-form-responsive-owner")
      const body = view.getByTestId(
        "personal-event-form-responsive-owner-content",
      )
      const actions = view.getByTestId(
        "personal-event-form-responsive-owner-actions",
      )
      const save = view.getByTestId("personal-event-save")
      const remove = view.getByTestId("personal-event-delete")
      const error = view.getByText("Could not save the event.")

      expect(resolveKeyboardAvoidingBehavior(platform)).toBe(behavior)
      expect(body).toContainElement(
        view.getByTestId("personal-event-title-input"),
      )
      expect(body).not.toContainElement(save)
      expect(actions).toContainElement(error)
      expect(actions).toContainElement(save)
      expect(actions).toContainElement(remove)
      expect(within(actions).getAllByRole("button")).toEqual([save, remove])
      expect(StyleSheet.flatten(save.props.style)).toMatchObject({
        minHeight: minimumTarget,
        backgroundColor: Colors.light.primaryStrong,
      })
      expect(save.props.accessibilityState).toEqual({
        disabled: false,
        busy: false,
      })
      expect(owner).toBeOnTheScreen()
    })
  })

  it("starts create mode with blank fields and a one-hour default range", async () => {
    const { getByTestId, queryByTestId } = await render(
      <PersonalEventFormScreen />,
    )

    expect(getByTestId("personal-event-title-input")).toHaveProp("value", "")
    expect(getByTestId("personal-event-location-input")).toHaveProp("value", "")
    expect(getByTestId("personal-event-description-input")).toHaveProp(
      "value",
      "",
    )
    expect(queryByTestId("personal-event-delete")).toBeNull()

    await fireEvent.changeText(
      getByTestId("personal-event-title-input"),
      "Valid",
    )
    await fireEvent.press(getByTestId("personal-event-save"))
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1))
    const saved = mockSave.mock.calls[0]?.[0]
    expect(saved).toBeDefined()
    expect(saved!.endsAt.getTime() - saved!.startsAt.getTime()).toBe(
      60 * 60 * 1000,
    )
    expect(saved).toEqual(
      expect.objectContaining({
        color: "#E91E63",
        location: undefined,
        description: undefined,
      }),
    )
  })

  it("prefills edit mode when the event resolves after the first render", async () => {
    mockUseLocalSearchParams.mockReturnValue({ uid: editEvent.uid })
    const view = await render(<PersonalEventFormScreen />)
    expect(view.getByTestId("personal-event-title-input")).toHaveProp(
      "value",
      "",
    )

    mockUseEventToEdit.mockReturnValue(editEvent)
    await view.rerender(<PersonalEventFormScreen />)

    await waitFor(() => expect(view.getByDisplayValue("Old")).toBeTruthy())
    expect(view.getByDisplayValue("Library")).toBeTruthy()
    expect(view.getByDisplayValue("Bring notes")).toBeTruthy()
  })

  it("preserves typed values across unrelated rerenders", async () => {
    useEditEvent()
    const view = await render(<PersonalEventFormScreen />)
    await waitFor(() => expect(view.getByDisplayValue("Old")).toBeTruthy())

    await fireEvent.changeText(
      view.getByTestId("personal-event-title-input"),
      "Typed value",
    )
    await view.rerender(<PersonalEventFormScreen />)

    expect(view.getByDisplayValue("Typed value")).toBeTruthy()
  })

  it("does not let a stale event overwrite a changed route uid", async () => {
    useEditEvent()
    const view = await render(<PersonalEventFormScreen />)
    await waitFor(() => expect(view.getByDisplayValue("Old")).toBeTruthy())

    mockUseLocalSearchParams.mockReturnValue({ uid: secondEditEvent.uid })
    mockUseEventToEdit.mockReturnValue(editEvent)
    await view.rerender(<PersonalEventFormScreen />)
    expect(view.queryByDisplayValue("Old")).toBeNull()

    mockUseEventToEdit.mockReturnValue(secondEditEvent)
    await view.rerender(<PersonalEventFormScreen />)
    expect(view.getByDisplayValue("Second")).toBeTruthy()
  })

  it("returns to blank create defaults when the route drops uid", async () => {
    useEditEvent()
    const view = await render(<PersonalEventFormScreen />)
    await waitFor(() => expect(view.getByDisplayValue("Old")).toBeTruthy())

    mockUseLocalSearchParams.mockReturnValue({})
    mockUseEventToEdit.mockReturnValue(editEvent)
    await view.rerender(<PersonalEventFormScreen />)

    expect(view.getByTestId("personal-event-title-input")).toHaveProp(
      "value",
      "",
    )
    expect(view.queryByTestId("personal-event-delete")).toBeNull()
  })

  it("places the localized create title in native chrome without duplicating it", async () => {
    const { getByText, queryByText, queryByTestId } = await render(
      <PersonalEventFormScreen />,
    )
    expect(mockStackScreen).toHaveBeenLastCalledWith(
      expect.objectContaining({ options: { title: "New event" } }),
    )
    expect(queryByText("New event")).toBeNull()
    expect(getByText("Title")).toBeTruthy()
    expect(getByText("Color")).toBeTruthy()
    // No delete control in create mode.
    expect(queryByTestId("personal-event-delete")).toBeNull()
  })

  it("retains editor selectors and keeps sticky actions outside field scrolling", async () => {
    useEditEvent()
    const view = await render(<PersonalEventFormScreen />)
    await waitFor(() => expect(view.getByDisplayValue("Old")).toBeTruthy())

    expect(view.getByTestId("personal-event-title-input")).toHaveProp(
      "accessibilityLabel",
      "Title",
    )
    expect(view.getByTestId("personal-event-title-input")).toHaveProp(
      "returnKeyType",
      "done",
    )
    expect(view.getByTestId("personal-event-title-input")).toHaveProp(
      "onSubmitEditing",
      expect.any(Function),
    )
    expect(view.getByTestId("personal-event-start-picker")).toBeTruthy()
    expect(view.getByTestId("personal-event-end-picker")).toBeTruthy()
    expect(view.getByTestId("personal-event-location-input")).toHaveProp(
      "accessibilityLabel",
      "Location",
    )
    expect(view.getByTestId("personal-event-description-input")).toHaveProp(
      "accessibilityLabel",
      "Description",
    )
    expect(view.getByTestId("personal-event-save")).toHaveProp(
      "accessibilityLabel",
      "Save",
    )
    expect(view.getByTestId("personal-event-delete")).toHaveProp(
      "accessibilityLabel",
      "Delete",
    )

    const scrollView = view.container.queryAll(
      (instance) => instance.props.keyboardShouldPersistTaps === "handled",
    )[0]
    if (scrollView === undefined) {
      throw new Error("Expected the editor fields to render in a ScrollView")
    }
    expect(within(scrollView).queryByTestId("personal-event-save")).toBeNull()
    expect(within(scrollView).queryByTestId("personal-event-delete")).toBeNull()
    expect(
      view.queryByTestId("personal-event-form-layout-owner-lane"),
    ).toBeNull()
    expect(
      StyleSheet.flatten(
        view.getByTestId("personal-event-form-layout-owner").props.style,
      ),
    ).toMatchObject({ paddingTop: Spacing.four })
    expect(
      StyleSheet.flatten(scrollView.props.contentContainerStyle).paddingTop,
    ).toBeUndefined()

    const owner = view.getByTestId(
      "personal-event-form-responsive-owner-window-owner",
    )
    for (const width of [390, 600, 768, 800, 834, 1024]) {
      await fireEvent(owner, "layout", {
        persist: jest.fn(),
        nativeEvent: { layout: { width, height: 0, x: 0, y: 0 } },
      })
      const metrics = resolveResponsiveLayout(width, "readable")
      const bodyStyle = StyleSheet.flatten(
        scrollView.props.contentContainerStyle,
      )
      const actionsStyle = StyleSheet.flatten(
        view.getByTestId("personal-event-form-responsive-owner-actions").props
          .style,
      )
      const expectedMaxWidth =
        (metrics.maxContentWidth ?? 0) + 2 * metrics.gutter
      expect(bodyStyle.maxWidth).toBe(expectedMaxWidth)
      expect(actionsStyle.maxWidth).toBe(expectedMaxWidth)
      expect(bodyStyle.paddingHorizontal).toBe(metrics.gutter)
      expect(actionsStyle.paddingHorizontal).toBe(metrics.gutter)
    }
  })

  it("saves a valid create through the save hook with a built event", async () => {
    const { getByTestId } = await render(<PersonalEventFormScreen />)
    await act(async () => {
      fireEvent.changeText(getByTestId("personal-event-title-input"), "Lunch")
    })
    await act(async () => {
      fireEvent.press(getByTestId("personal-event-save"))
    })

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1))
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Lunch" }),
    )
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it("saves a valid create from the title keyboard action", async () => {
    const { getByTestId } = await render(<PersonalEventFormScreen />)
    await fireEvent.changeText(
      getByTestId("personal-event-title-input"),
      "Keyboard save",
    )
    await fireEvent(getByTestId("personal-event-title-input"), "submitEditing")

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1))
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Keyboard save" }),
    )
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it("exposes one busy Save action and blocks a duplicate submission", async () => {
    let resolveSave: ((saved: boolean) => void) | undefined
    mockSave.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSave = resolve
        }),
    )
    const view = await render(<PersonalEventFormScreen />)
    await fireEvent.changeText(
      view.getByTestId("personal-event-title-input"),
      "Lunch",
    )
    const firstPress = fireEvent.press(view.getByTestId("personal-event-save"))

    await waitFor(() =>
      expect(view.getByTestId("personal-event-save")).toBeDisabled(),
    )
    const saveButton = view.getByTestId("personal-event-save")
    expect(saveButton).toBeDisabled()
    expect(saveButton).toHaveProp("accessibilityState", {
      disabled: true,
      busy: true,
    })
    await fireEvent.press(saveButton)
    expect(mockSave).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSave?.(true)
      await Promise.resolve()
    })
    await firstPress
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it("saves the selected swatch value unchanged", async () => {
    const { getByTestId } = await render(<PersonalEventFormScreen />)
    await fireEvent.changeText(
      getByTestId("personal-event-title-input"),
      "Lunch",
    )
    await fireEvent.press(getByTestId("color-swatch-#3F51B5"))
    await fireEvent.press(getByTestId("personal-event-save"))

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1))
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ color: "#3F51B5" }),
    )
  })

  it("keeps the editor open and shows a visible save failure", async () => {
    mockSave.mockResolvedValueOnce(false)
    const view = await render(<PersonalEventFormScreen />)
    await fireEvent.changeText(
      view.getByTestId("personal-event-title-input"),
      "Lunch",
    )
    await fireEvent.press(view.getByTestId("personal-event-save"))
    expect(mockBack).not.toHaveBeenCalled()

    mockUseSaveEvent.mockReturnValue({ save: mockSave, failed: true })
    await view.rerender(<PersonalEventFormScreen />)
    expect(view.getByText("Could not save the event.")).toBeTruthy()
    expect(view.getByDisplayValue("Lunch")).toBeTruthy()
  })

  it("blocks save with an empty title and shows the localized validation error", async () => {
    const { getByTestId, getByText } = await render(<PersonalEventFormScreen />)
    await act(async () => {
      fireEvent.press(getByTestId("personal-event-save"))
    })

    await waitFor(() => expect(getByText("A title is required.")).toBeTruthy())
    expect(mockSave).not.toHaveBeenCalled()
  })

  it("updates the start state when the date control fires onValueChange", async () => {
    const { getByTestId } = await render(<PersonalEventFormScreen />)
    // The mock DateTimePicker (setup-expo-ui.ts) renders value.toISOString() as
    // text and fires onValueChange with 2030-01-02T03:04Z on press. Driving it
    // must flow into the form's startsAt state (the picker→state wiring).
    await act(async () => {
      fireEvent.press(getByTestId("personal-event-start-picker"))
    })

    expect(getByTestId("personal-event-start-picker")).toHaveTextContent(
      "2030-01-02T03:04:00.000Z",
    )
  })

  it("opens a localized native confirmation without deleting or navigating", async () => {
    useEditEvent()
    const { getByTestId } = await render(<PersonalEventFormScreen />)

    expect(mockStackScreen).toHaveBeenLastCalledWith(
      expect.objectContaining({ options: { title: "Edit event" } }),
    )
    await fireEvent.press(getByTestId("personal-event-delete"))

    expect(mockAlert).toHaveBeenCalledWith(
      "Delete event?",
      "This event will be permanently deleted.",
      expect.any(Array),
      undefined,
    )
    const { buttons } = latestAlert()
    expect(buttons).toEqual([
      expect.objectContaining({ text: "Cancel", style: "cancel" }),
      expect.objectContaining({ text: "Delete", style: "destructive" }),
    ])
    expect(mockRemove).not.toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it("cancel is inert, preserves the form, and allows the prompt to reopen", async () => {
    useEditEvent()
    const { getByDisplayValue, getByTestId } = await render(
      <PersonalEventFormScreen />,
    )
    await waitFor(() => expect(getByDisplayValue("Old")).toBeTruthy())
    await fireEvent.press(getByTestId("personal-event-delete"))

    await act(async () => {
      latestAlert().buttons[0]?.onPress?.()
    })

    expect(getByDisplayValue("Old")).toBeTruthy()
    expect(getByDisplayValue("Library")).toBeTruthy()
    expect(mockRemove).not.toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
    await fireEvent.press(getByTestId("personal-event-delete"))
    expect(mockAlert).toHaveBeenCalledTimes(2)
  })

  describe("on Android", () => {
    usePlatform("android")

    it("native dismissal is inert and allows the prompt to reopen", async () => {
      useEditEvent()
      const { getByDisplayValue, getByTestId } = await render(
        <PersonalEventFormScreen />,
      )
      await waitFor(() => expect(getByDisplayValue("Old")).toBeTruthy())
      await fireEvent.press(getByTestId("personal-event-delete"))

      await act(async () => {
        latestAlert().options?.onDismiss?.()
      })

      expect(getByDisplayValue("Old")).toBeTruthy()
      expect(mockRemove).not.toHaveBeenCalled()
      expect(mockBack).not.toHaveBeenCalled()
      await fireEvent.press(getByTestId("personal-event-delete"))
      expect(mockAlert).toHaveBeenCalledTimes(2)
    })
  })

  describe("on iOS", () => {
    usePlatform("ios")

    beforeEach(() => jest.useFakeTimers())

    afterEach(() => {
      try {
        jest.runOnlyPendingTimers()
      } finally {
        jest.useRealTimers()
      }
    })

    it("reopens after accessibility escape without an onDismiss callback", async () => {
      useEditEvent()
      const { getByDisplayValue, getByTestId } = await render(
        <PersonalEventFormScreen />,
      )
      await waitFor(() => expect(getByDisplayValue("Old")).toBeTruthy())
      const deleteButton = getByTestId("personal-event-delete")

      await fireEvent.press(deleteButton)
      await fireEvent.press(deleteButton)
      expect(mockAlert).toHaveBeenCalledTimes(1)
      expect(latestAlert().options).toBeUndefined()

      // React Native installs no iOS dismiss callback. Let the presentation
      // microtask settle, representing the native alert having owned focus;
      // after VoiceOver escape, the underlying Delete action can reopen it.
      await act(async () => {
        jest.runAllTicks()
        await Promise.resolve()
      })
      await fireEvent.press(deleteButton)

      expect(mockAlert).toHaveBeenCalledTimes(2)
      expect(getByDisplayValue("Old")).toBeTruthy()
      expect(mockRemove).not.toHaveBeenCalled()
      expect(mockBack).not.toHaveBeenCalled()
    })
  })

  it("admits one removal while pending and exposes disabled accessibility state", async () => {
    let resolveRemoval: ((removed: boolean) => void) | undefined
    mockRemove.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveRemoval = resolve
        }),
    )
    useEditEvent()
    const { getByTestId } = await render(<PersonalEventFormScreen />)
    const deleteButton = getByTestId("personal-event-delete")
    await fireEvent.press(deleteButton)
    const confirm = latestAlert().buttons[1]

    await act(async () => {
      confirm?.onPress?.()
      await Promise.resolve()
    })
    expect(deleteButton).toBeDisabled()
    expect(deleteButton).toHaveProp("accessibilityState", { disabled: true })

    await act(async () => {
      confirm?.onPress?.()
      confirm?.onPress?.()
    })
    await fireEvent.press(deleteButton)
    expect(mockRemove).toHaveBeenCalledTimes(1)
    expect(mockAlert).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRemoval?.(false)
      await Promise.resolve()
    })
  })

  it("removes the edited uid and navigates back exactly once on success", async () => {
    useEditEvent()
    const { getByTestId } = await render(<PersonalEventFormScreen />)
    await fireEvent.press(getByTestId("personal-event-delete"))
    const confirm = latestAlert().buttons[1]

    await act(async () => {
      confirm?.onPress?.()
      confirm?.onPress?.()
      await Promise.resolve()
    })

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith("u1"))
    expect(mockRemove).toHaveBeenCalledTimes(1)
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it("keeps populated values and the error visible after failure, then permits retry", async () => {
    mockRemove.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    useEditEvent()
    const view = await render(<PersonalEventFormScreen />)
    await waitFor(() => expect(view.getByDisplayValue("Old")).toBeTruthy())
    await fireEvent.press(view.getByTestId("personal-event-delete"))

    await act(async () => {
      latestAlert().buttons[1]?.onPress?.()
      await Promise.resolve()
    })
    await waitFor(() => expect(mockRemove).toHaveBeenCalledTimes(1))
    expect(mockBack).not.toHaveBeenCalled()

    mockUseDeleteEvent.mockReturnValue({ remove: mockRemove, failed: true })
    await view.rerender(<PersonalEventFormScreen />)
    expect(view.getByText("Could not delete the event.")).toBeTruthy()
    expect(view.getByDisplayValue("Old")).toBeTruthy()
    expect(view.getByDisplayValue("Library")).toBeTruthy()
    expect(view.getByDisplayValue("Bring notes")).toBeTruthy()

    await fireEvent.press(view.getByTestId("personal-event-delete"))
    await act(async () => {
      latestAlert().buttons[1]?.onPress?.()
      await Promise.resolve()
    })
    await waitFor(() => expect(mockRemove).toHaveBeenCalledTimes(2))
    expect(mockBack).toHaveBeenCalledTimes(1)
  })
})
