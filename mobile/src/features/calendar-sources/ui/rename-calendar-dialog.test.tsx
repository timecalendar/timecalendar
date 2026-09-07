import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { AccessibilityInfo, StyleSheet } from "react-native"

import { useRenameCalendar } from "@/features/calendar-sources/data"
import { usePlatform } from "@/test-support/platform"
import { resolveResponsiveLayout } from "@/theme"

import { RenameCalendarDialog } from "./rename-calendar-dialog"

// The controlled rename dialog (70% floor): rendered through the real theme +
// i18n trees, with only the rename seam mocked, so validation, the pending /
// failure / retry / cancel states and the "local state changes only after a
// successful response" rule are provable without a network or a SQLite mock.
// `effectiveCalendarName` is spread back in from the real module — it is the
// display rule under test, and stubbing it would destroy the fallback oracle.
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual<object>(
    "@/features/calendar-sources/data/effective-name",
  ),
  useRenameCalendar: jest.fn(),
}))

const mockUseRenameCalendar = useRenameCalendar as jest.Mock

const rename = jest.fn()
const onClose = jest.fn()

const calendar = {
  id: "cal-1",
  token: "tok-1",
  name: "  ENSEEIHT  ",
  schoolName: "Toulouse INP",
  schoolId: "sch-1",
  lastUpdatedAt: new Date(),
  createdAt: new Date(),
  visible: true,
}

function mockSeam(overrides: Record<string, unknown> = {}) {
  mockUseRenameCalendar.mockReturnValue({
    rename,
    isPending: false,
    isError: false,
    reset: jest.fn(),
    ...overrides,
  })
}

// The repo's RNTL idiom: a state update driven by fireEvent settles inside act,
// so anything asserted against the rendered output is read after it.
async function type(value: string) {
  await act(async () => {
    fireEvent.changeText(
      screen.getByTestId("user-calendar-rename-input"),
      value,
    )
  })
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID))
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  rename.mockResolvedValue(undefined)
  mockSeam()
})

describe("RenameCalendarDialog", () => {
  it("bounds dialog content to the measured readable tablet lane", async () => {
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)
    const owner = screen.getByTestId("native-text-entry-dialog-content")

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

  it("seeds the input from the TRIMMED current name and labels it", async () => {
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)
    const input = screen.getByTestId("user-calendar-rename-input")
    expect(input.props.value).toBe("ENSEEIHT")
    expect(input.props.accessibilityLabel).toBe("Calendar name")
    // The dialog title is deliberately NOT the menu's "Rename" action string:
    // two live elements sharing one anchored selector broke Maestro in TIM-264.
    expect(screen.getByText("Rename calendar")).toBeTruthy()
    expect(screen.queryByText("Rename")).toBeNull()
  })

  it("shows the localized fallback as the placeholder for an empty name", async () => {
    await render(
      <RenameCalendarDialog
        calendar={{ ...calendar, name: "   " }}
        onClose={onClose}
      />,
    )
    const input = screen.getByTestId("user-calendar-rename-input")
    expect(input.props.value).toBe("")
    expect(input.props.placeholder).toBe("My timetable")
  })

  it("sends the entered value on save and closes only after it resolves", async () => {
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)
    await type("L3 Informatique")
    expect(onClose).not.toHaveBeenCalled()

    await press("user-calendar-rename-save")

    expect(rename).toHaveBeenCalledWith({
      id: "cal-1",
      token: "tok-1",
      name: "L3 Informatique",
    })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it("blocks save and issues no request when the trimmed value exceeds 100 characters", async () => {
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)
    await type("x".repeat(101))

    const save = screen.getByTestId("user-calendar-rename-save")
    expect(save.props.accessibilityState.disabled).toBe(true)
    expect(screen.getByText("Use 100 characters or fewer.")).toBeTruthy()
    expect(screen.getByTestId("user-calendar-rename-input").props.value).toBe(
      "x".repeat(101),
    )

    await press("user-calendar-rename-save")
    expect(rename).not.toHaveBeenCalled()
  })

  it("accepts exactly 100 characters and an emptied field", async () => {
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)

    await type("x".repeat(100))
    expect(
      screen.getByTestId("user-calendar-rename-save").props.accessibilityState
        .disabled,
    ).toBe(false)
    expect(screen.queryByText("Use 100 characters or fewer.")).toBeNull()

    // An empty name is legal — it renders as the fallback, it is not an error.
    await type("   ")
    await press("user-calendar-rename-save")
    expect(rename).toHaveBeenCalledWith(
      expect.objectContaining({ name: "   " }),
    )
  })

  it("keeps the dialog, the entered text and the local name when the save fails", async () => {
    rename.mockRejectedValue(new Error("offline"))
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)
    await type("L3 Informatique")
    await press("user-calendar-rename-save")

    expect(rename).toHaveBeenCalledTimes(1)
    // Still open, still holding what the user typed, and never dismissed — the
    // Error-behavior table's requirement that an offline save keeps the input.
    expect(screen.getByTestId("user-calendar-rename-dialog")).toBeTruthy()
    expect(screen.getByTestId("user-calendar-rename-input").props.value).toBe(
      "L3 Informatique",
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it("offers Retry after a failure and reissues the same request", async () => {
    mockSeam({ isError: true })
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)

    const save = screen.getByTestId("user-calendar-rename-save")
    expect(save.props.accessibilityLabel).toBe("Retry")
    expect(
      screen.getByText("We couldn't rename this calendar. Please try again."),
    ).toBeTruthy()

    await press("user-calendar-rename-save")
    expect(rename).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ENSEEIHT" }),
    )
  })

  it("disables save while the request is in flight but keeps the text visible", async () => {
    mockSeam({ isPending: true })
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)

    expect(
      screen.getByTestId("user-calendar-rename-save").props.accessibilityState
        .disabled,
    ).toBe(true)
    const input = screen.getByTestId("user-calendar-rename-input")
    expect(input.props.value).toBe("ENSEEIHT")
    expect(input.props.editable).toBe(false)
  })

  it("keeps submission single-flight before pending state rerenders", async () => {
    let resolveRename!: () => void
    rename.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRename = resolve
      }),
    )
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)

    await press("user-calendar-rename-save")
    await press("user-calendar-rename-save")
    expect(rename).toHaveBeenCalledTimes(1)

    await act(async () => resolveRename())
  })

  it("cancels without writing from the native Cancel button", async () => {
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)
    await press("user-calendar-rename-cancel")
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(rename).not.toHaveBeenCalled()
  })

  it("suppresses close and success announcement after cancel wins an in-flight race", async () => {
    let resolveRename!: () => void
    rename.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRename = resolve
      }),
    )
    const announceSpy = jest.spyOn(
      AccessibilityInfo,
      "announceForAccessibility",
    )
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)
    await type("L3 Informatique")
    await press("user-calendar-rename-save")
    await press("user-calendar-rename-cancel")

    await act(async () => {
      resolveRename()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(announceSpy).not.toHaveBeenCalledWith(
      "Calendar renamed to L3 Informatique",
    )
  })

  it("announces the rename once the write has resolved", async () => {
    const announceSpy = jest.spyOn(
      AccessibilityInfo,
      "announceForAccessibility",
    )
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)
    await type("L3 Informatique")
    await press("user-calendar-rename-save")

    await waitFor(() =>
      expect(announceSpy).toHaveBeenCalledWith(
        "Calendar renamed to L3 Informatique",
      ),
    )
  })
})

describe("RenameCalendarDialog on Android", () => {
  usePlatform("android")

  it("maps hardware Back to explicit cancel without writing", async () => {
    await render(<RenameCalendarDialog calendar={calendar} onClose={onClose} />)
    await act(async () => {
      fireEvent(
        screen.getByTestId("user-calendar-rename-dialog"),
        "dismissRequest",
      )
    })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(rename).not.toHaveBeenCalled()
  })
})
