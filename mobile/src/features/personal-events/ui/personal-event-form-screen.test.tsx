import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Alert } from "react-native"

import type { PersonalEvent } from "@/features/personal-events/data"
import {
  useDeleteEvent,
  useEventToEdit,
  useSaveEvent,
} from "@/features/personal-events/form"
import { usePlatform } from "@/test-support/platform"

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
  it("renders the localized create title and field labels (no uid)", async () => {
    const { getByText, queryByTestId } = await render(
      <PersonalEventFormScreen />,
    )
    expect(getByText("New event")).toBeTruthy()
    expect(getByText("Title")).toBeTruthy()
    expect(getByText("Color")).toBeTruthy()
    // No delete control in create mode.
    expect(queryByTestId("personal-event-delete")).toBeNull()
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
    const { getByTestId, getByText } = await render(<PersonalEventFormScreen />)

    expect(getByText("Edit event")).toBeTruthy()
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
