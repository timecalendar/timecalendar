import { render, screen, userEvent } from "@testing-library/react-native"

import {
  type ChecklistItem,
  useChecklist,
  useChecklistActions,
} from "@/features/event-checklists/data"

import { EventChecklist } from "./event-checklist"

// Presentational checklist section (70% floor): renders through the real theme +
// i18n trees. The reactive read + the write controller are mocked so the
// render/interaction wiring (add → action + focus, toggle → setChecked, edit →
// setContent, move-up/down → reorder, remove → delete, the empty state, and the
// failure surface) is provable without a SQLite/firebase dependency (the data
// layer is proven in its own tests).

jest.mock("@/features/event-checklists/data", () => ({
  useChecklist: jest.fn(),
  useChecklistActions: jest.fn(),
}))

const mockUseChecklist = useChecklist as jest.Mock
const mockUseChecklistActions = useChecklistActions as jest.Mock

const actions = {
  add: jest.fn(() => Promise.resolve("new-uuid")),
  setContent: jest.fn(),
  setChecked: jest.fn(),
  moveUp: jest.fn(),
  moveDown: jest.fn(),
  remove: jest.fn(),
  failed: false,
}

function item(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    uuid: "u-1",
    eventUid: "ev-1",
    content: "Bring the lab coat",
    isChecked: false,
    order: 1,
    createdAt: undefined,
    updatedAt: undefined,
    deletedAt: undefined,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseChecklist.mockReturnValue([])
  mockUseChecklistActions.mockReturnValue({ ...actions, failed: false })
})

describe("EventChecklist", () => {
  it("renders the section heading and the add control", async () => {
    await render(<EventChecklist eventUid="ev-1" />)
    expect(screen.getByRole("header", { name: "Checklist" })).toBeTruthy()
    expect(screen.getByLabelText("Add a checklist item")).toBeTruthy()
  })

  it("shows the empty state when there are no items", async () => {
    await render(<EventChecklist eventUid="ev-1" />)
    expect(screen.getByText("No items yet.")).toBeTruthy()
  })

  it("renders an item's content + a checkbox exposing its checked state", async () => {
    mockUseChecklist.mockReturnValue([
      item({ content: "Lab coat", isChecked: true }),
    ])
    await render(<EventChecklist eventUid="ev-1" />)
    expect(screen.getByDisplayValue("Lab coat")).toBeTruthy()
    const checkbox = screen.getByRole("checkbox")
    expect(checkbox.props.accessibilityState.checked).toBe(true)
  })

  it("calls add when the add control is pressed", async () => {
    await render(<EventChecklist eventUid="ev-1" />)
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Add a checklist item"))
    expect(actions.add).toHaveBeenCalled()
  })

  it("wires the add → new-item sequence (D6 — the live read surfaces the added item)", async () => {
    // add resolves with "new-uuid"; the live read then surfaces that item, the
    // row the component auto-focuses. CI asserts the wiring (the add fires and the
    // matching row renders); the keyboard-raise feel is the on-device pass.
    mockUseChecklist.mockReturnValue([item({ uuid: "new-uuid", content: "" })])
    await render(<EventChecklist eventUid="ev-1" />)
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Add a checklist item"))
    expect(actions.add).toHaveBeenCalled()
    expect(screen.getByTestId("checklist-input-new-uuid")).toBeTruthy()
  })

  it("toggles an item via the checkbox", async () => {
    mockUseChecklist.mockReturnValue([item({ uuid: "u-1", isChecked: false })])
    await render(<EventChecklist eventUid="ev-1" />)
    const user = userEvent.setup()
    await user.press(screen.getByTestId("checklist-check-u-1"))
    expect(actions.setChecked).toHaveBeenCalledWith("u-1", true)
  })

  it("edits an item's content via the inline input", async () => {
    mockUseChecklist.mockReturnValue([item({ uuid: "u-1", content: "" })])
    await render(<EventChecklist eventUid="ev-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByTestId("checklist-input-u-1"), "X")
    expect(actions.setContent).toHaveBeenCalledWith("u-1", "X")
  })

  it("moves an item up / down via the reorder controls", async () => {
    mockUseChecklist.mockReturnValue([
      item({ uuid: "u-1", order: 1 }),
      item({ uuid: "u-2", order: 2 }),
    ])
    await render(<EventChecklist eventUid="ev-1" />)
    const user = userEvent.setup()
    await user.press(screen.getByTestId("checklist-down-u-1"))
    expect(actions.moveDown).toHaveBeenCalledWith("u-1")
    await user.press(screen.getByTestId("checklist-up-u-2"))
    expect(actions.moveUp).toHaveBeenCalledWith("u-2")
  })

  it("disables move-up on the first item and move-down on the last", async () => {
    mockUseChecklist.mockReturnValue([
      item({ uuid: "u-1", order: 1 }),
      item({ uuid: "u-2", order: 2 }),
    ])
    await render(<EventChecklist eventUid="ev-1" />)
    expect(
      screen.getByTestId("checklist-up-u-1").props.accessibilityState.disabled,
    ).toBe(true)
    expect(
      screen.getByTestId("checklist-down-u-2").props.accessibilityState
        .disabled,
    ).toBe(true)
  })

  it("removes an item via the remove control", async () => {
    mockUseChecklist.mockReturnValue([item({ uuid: "u-1" })])
    await render(<EventChecklist eventUid="ev-1" />)
    const user = userEvent.setup()
    await user.press(screen.getByTestId("checklist-remove-u-1"))
    expect(actions.remove).toHaveBeenCalledWith("u-1")
  })

  it("surfaces an accessible failure state when a write failed", async () => {
    mockUseChecklistActions.mockReturnValue({ ...actions, failed: true })
    await render(<EventChecklist eventUid="ev-1" />)
    expect(
      screen.getByText(
        "We couldn't save your checklist change. Please try again.",
      ),
    ).toBeTruthy()
  })
})
