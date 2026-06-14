import { act, fireEvent, render } from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"

import {
  selectGroup,
  selectSchool,
  useSchoolGroups,
} from "@/features/school-selection"

import SchoolGroupPickerScreen from "./school-group-picker-screen"

// Presentational (70% floor): renders the group tree from a mocked
// useSchoolGroups; expanding a branch reveals its leaf; selecting a leaf persists
// the selection (selectSchool + selectGroup, mocked) and completes the flow
// (router.back). The schoolId comes from a mocked route param.
jest.mock("@/features/school-selection", () => ({
  useSchoolGroups: jest.fn(),
  selectSchool: jest.fn(),
  selectGroup: jest.fn(),
}))

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  router: { back: jest.fn() },
}))

const mockUseSchoolGroups = useSchoolGroups as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockSelectSchool = selectSchool as jest.Mock
const mockSelectGroup = selectGroup as jest.Mock
const mockBack = router.back as jest.Mock

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
  it("renders the localized title and a leaf node", async () => {
    mockUseSchoolGroups.mockReturnValue(
      ready([{ text: "Group A", value: "a", children: [] }]),
    )
    const { getByText, getByTestId } = await render(<SchoolGroupPickerScreen />)

    expect(getByText("Choose your group")).toBeTruthy()
    expect(getByTestId("onboarding-group-leaf-a")).toBeTruthy()
  })

  it("persists the selection and completes the flow on leaf select", async () => {
    mockUseSchoolGroups.mockReturnValue(
      ready([{ text: "Group A", value: "a", children: [] }]),
    )
    const { getByTestId } = await render(<SchoolGroupPickerScreen />)

    fireEvent.press(getByTestId("onboarding-group-leaf-a"))
    expect(mockSelectSchool).toHaveBeenCalledWith("univeiffel")
    expect(mockSelectGroup).toHaveBeenCalledWith(["a"])
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it("expands a branch to reveal and select its leaf", async () => {
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
    fireEvent.press(getByTestId("onboarding-group-leaf-a"))
    expect(mockSelectGroup).toHaveBeenCalledWith(["a"])
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
