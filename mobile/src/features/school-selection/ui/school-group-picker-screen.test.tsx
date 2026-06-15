import { act, fireEvent, render } from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"

import { useSchoolGroups } from "@/features/school-selection/data"
import { selectGroup, selectSchool } from "@/features/school-selection/store"

import SchoolGroupPickerScreen from "./school-group-picker-screen"

// Presentational (70% floor): renders the group tree from a mocked
// useSchoolGroups; a leaf is a TOGGLE (tap selects, tap again de-selects) with an
// accessible selected state; a branch expands/collapses without selecting; the
// confirm control commits the whole set (selectSchool + selectGroup, mocked) and
// dismisses the onboarding Stack (router.dismissTo, mocked); confirming nothing is
// guarded (no commit). The schoolId comes from a mocked route param.
jest.mock("@/features/school-selection/data", () => ({
  useSchoolGroups: jest.fn(),
}))

jest.mock("@/features/school-selection/store", () => ({
  selectSchool: jest.fn(),
  selectGroup: jest.fn(),
}))

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  router: { back: jest.fn(), dismissTo: jest.fn() },
}))

const mockUseSchoolGroups = useSchoolGroups as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockSelectSchool = selectSchool as jest.Mock
const mockSelectGroup = selectGroup as jest.Mock
const mockDismissTo = router.dismissTo as jest.Mock

const ready = (groups: unknown[], refetch = jest.fn()) => ({
  groups,
  isLoading: false,
  isError: false,
  refetch,
})

beforeEach(() => {
  jest.clearAllMocks()
  mockUseLocalSearchParams.mockReturnValue({ schoolId: "univeiffel" })
})

describe("SchoolGroupPickerScreen", () => {
  it("renders the localized title, a leaf node, and the confirm control", async () => {
    mockUseSchoolGroups.mockReturnValue(
      ready([{ text: "Group A", value: "a", children: [] }]),
    )
    const { getByText, getByTestId } = await render(<SchoolGroupPickerScreen />)

    expect(getByText("Choose your group")).toBeTruthy()
    expect(getByTestId("onboarding-group-leaf-a")).toBeTruthy()
    const confirm = getByTestId("onboarding-group-confirm")
    expect(confirm.props.accessibilityLabel).toBe(
      "Confirm your group selection",
    )
  })

  it("toggles a leaf's selected state on tap and de-selects on second tap", async () => {
    mockUseSchoolGroups.mockReturnValue(
      ready([{ text: "Group A", value: "a", children: [] }]),
    )
    const { getByTestId } = await render(<SchoolGroupPickerScreen />)

    expect(
      getByTestId("onboarding-group-leaf-a").props.accessibilityState,
    ).toMatchObject({ selected: false })

    await act(async () => {
      fireEvent.press(getByTestId("onboarding-group-leaf-a"))
    })
    expect(
      getByTestId("onboarding-group-leaf-a").props.accessibilityState,
    ).toMatchObject({ selected: true })

    await act(async () => {
      fireEvent.press(getByTestId("onboarding-group-leaf-a"))
    })
    expect(
      getByTestId("onboarding-group-leaf-a").props.accessibilityState,
    ).toMatchObject({ selected: false })
  })

  it("expands a branch to reveal a leaf without selecting it", async () => {
    mockUseSchoolGroups.mockReturnValue(
      ready([
        {
          text: "L1",
          value: "l1",
          children: [{ text: "Group A", value: "a", children: [] }],
        },
      ]),
    )
    const { getByTestId, queryByTestId } = await render(
      <SchoolGroupPickerScreen />,
    )

    expect(queryByTestId("onboarding-group-leaf-a")).toBeNull()
    await act(async () => {
      fireEvent.press(getByTestId("onboarding-group-branch-l1"))
    })
    expect(getByTestId("onboarding-group-leaf-a")).toBeTruthy()
    // Expanding selected nothing — the leaf is unselected.
    expect(
      getByTestId("onboarding-group-leaf-a").props.accessibilityState,
    ).toMatchObject({ selected: false })
    expect(mockSelectGroup).not.toHaveBeenCalled()
  })

  it("commits the full selected set and dismisses the stack on confirm", async () => {
    mockUseSchoolGroups.mockReturnValue(
      ready([
        { text: "Group A", value: "a", children: [] },
        { text: "Group B", value: "b", children: [] },
      ]),
    )
    const { getByTestId } = await render(<SchoolGroupPickerScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("onboarding-group-leaf-a"))
    })
    await act(async () => {
      fireEvent.press(getByTestId("onboarding-group-leaf-b"))
    })
    await act(async () => {
      fireEvent.press(getByTestId("onboarding-group-confirm"))
    })

    expect(mockSelectSchool).toHaveBeenCalledWith("univeiffel")
    expect(mockSelectGroup).toHaveBeenCalledWith(["a", "b"])
    expect(mockDismissTo).toHaveBeenCalledWith("/onboarding")
  })

  it("guards an empty confirm — shows the message and does not commit or dismiss", async () => {
    mockUseSchoolGroups.mockReturnValue(
      ready([{ text: "Group A", value: "a", children: [] }]),
    )
    const { getByTestId, getByText } = await render(<SchoolGroupPickerScreen />)

    await act(async () => {
      fireEvent.press(getByTestId("onboarding-group-confirm"))
    })

    expect(getByText("Select at least one group.")).toBeTruthy()
    expect(mockSelectGroup).not.toHaveBeenCalled()
    expect(mockDismissTo).not.toHaveBeenCalled()
  })

  it("shows the loading state", async () => {
    mockUseSchoolGroups.mockReturnValue({
      groups: [],
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    })
    const { getByText } = await render(<SchoolGroupPickerScreen />)
    expect(getByText("Loading groups…")).toBeTruthy()
  })

  it("shows the empty state", async () => {
    mockUseSchoolGroups.mockReturnValue(ready([]))
    const { getByText } = await render(<SchoolGroupPickerScreen />)
    expect(getByText("No groups available.")).toBeTruthy()
  })

  it("shows the error state with a retry that refetches", async () => {
    const refetch = jest.fn()
    mockUseSchoolGroups.mockReturnValue({
      groups: [],
      isLoading: false,
      isError: true,
      refetch,
    })
    const { getByText, getByTestId } = await render(<SchoolGroupPickerScreen />)

    expect(getByText("Could not load groups.")).toBeTruthy()
    fireEvent.press(getByTestId("onboarding-group-retry"))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
