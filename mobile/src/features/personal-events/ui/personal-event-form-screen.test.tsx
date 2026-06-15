import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import { useLocalSearchParams } from "expo-router"

import type { PersonalEvent } from "@/features/personal-events/data"
import {
  useDeleteEvent,
  useEventToEdit,
  useSaveEvent,
} from "@/features/personal-events/form"

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

// buildEventFromForm (real, via requireActual above) calls the data barrel's
// newEventId → expo-crypto, which has no off-device JS. Mock it deterministically.
jest.mock("@/features/personal-events/data", () => ({
  newEventId: jest.fn(() => "generated-uid"),
}))

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockUseSaveEvent = useSaveEvent as jest.Mock
const mockUseDeleteEvent = useDeleteEvent as jest.Mock
const mockUseEventToEdit = useEventToEdit as jest.Mock

beforeEach(() => {
  mockSave.mockClear().mockResolvedValue(true)
  mockRemove.mockClear().mockResolvedValue(true)
  mockUseLocalSearchParams.mockReturnValue({})
  mockUseSaveEvent.mockReturnValue({ save: mockSave, failed: false })
  mockUseDeleteEvent.mockReturnValue({ remove: mockRemove, failed: false })
  mockUseEventToEdit.mockReturnValue(undefined)
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

  it("shows delete in edit mode and triggers the delete hook", async () => {
    mockUseLocalSearchParams.mockReturnValue({ uid: "u1" })
    mockUseEventToEdit.mockReturnValue({
      uid: "u1",
      title: "Old",
      color: "#E91E63",
      startsAt: new Date("2030-01-01T10:00:00.000Z"),
      endsAt: new Date("2030-01-01T11:00:00.000Z"),
      exportedAt: new Date("2030-01-01T09:00:00.000Z"),
      location: undefined,
      description: undefined,
    })
    const { getByTestId, getByText } = await render(<PersonalEventFormScreen />)

    expect(getByText("Edit event")).toBeTruthy()
    await act(async () => {
      fireEvent.press(getByTestId("personal-event-delete"))
    })
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith("u1"))
  })
})
