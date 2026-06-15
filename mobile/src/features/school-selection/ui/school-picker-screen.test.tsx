import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import { useSchools } from "@/features/school-selection/data"

import SchoolPickerScreen from "./school-picker-screen"

// Presentational (70% floor): renders rows from a mocked useSchools through the
// real theme + i18n trees; loading/error/empty states render; the retry triggers
// refetch; selecting a school navigates to the group step with the id (mocked
// router.push). The data sub-barrel is mocked at its hook (the screen consumes the
// sub-barrel, not the generated hooks — the queries.test mocks the mutator seam).
jest.mock("@/features/school-selection/data", () => ({ useSchools: jest.fn() }))

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

const mockUseSchools = useSchools as jest.Mock
const mockPush = router.push as jest.Mock

const ready = (
  schools: { id: string; name: string; imageUrl: string }[],
  refetch = jest.fn(),
) => ({ schools, isLoading: false, isError: false, refetch })

beforeEach(() => {
  mockPush.mockClear()
})

describe("SchoolPickerScreen", () => {
  it("renders the localized title and a row per school", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        { id: "univeiffel", name: "Université Gustave Eiffel", imageUrl: "" },
      ]),
    )
    const { getByText, getByTestId } = await render(<SchoolPickerScreen />)

    expect(getByText("Choose your school")).toBeTruthy()
    expect(getByText("Université Gustave Eiffel")).toBeTruthy()
    const row = getByTestId("onboarding-school-row-univeiffel")
    // The label is the bare school name (matchable cross-platform); the select
    // affordance is the hint.
    expect(row.props.accessibilityLabel).toBe("Université Gustave Eiffel")
    expect(row.props.accessibilityHint).toBe("Opens this school's groups")
  })

  it("shows the loading state", async () => {
    mockUseSchools.mockReturnValue({
      schools: [],
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    })
    const { getByText } = await render(<SchoolPickerScreen />)
    expect(getByText("Loading schools…")).toBeTruthy()
  })

  it("shows the empty state when there are no schools", async () => {
    mockUseSchools.mockReturnValue(ready([]))
    const { getByText } = await render(<SchoolPickerScreen />)
    expect(getByText("No schools available.")).toBeTruthy()
  })

  it("shows the error state with an accessible retry that refetches", async () => {
    const refetch = jest.fn()
    mockUseSchools.mockReturnValue({
      schools: [],
      isLoading: false,
      isError: true,
      refetch,
    })
    const { getByText, getByTestId } = await render(<SchoolPickerScreen />)

    expect(getByText("Could not load schools.")).toBeTruthy()
    fireEvent.press(getByTestId("onboarding-school-retry"))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it("navigates to the group step with the school id on select", async () => {
    mockUseSchools.mockReturnValue(
      ready([{ id: "univeiffel", name: "Eiffel", imageUrl: "" }]),
    )
    const { getByTestId } = await render(<SchoolPickerScreen />)

    fireEvent.press(getByTestId("onboarding-school-row-univeiffel"))
    expect(mockPush).toHaveBeenCalledWith(
      "/onboarding/groups?schoolId=univeiffel",
    )
  })

  it("filters the list by the text input", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        { id: "a", name: "Alpha University", imageUrl: "" },
        { id: "b", name: "Beta College", imageUrl: "" },
      ]),
    )
    const { getByTestId, queryByText } = await render(<SchoolPickerScreen />)

    await act(async () => {
      fireEvent.changeText(getByTestId("onboarding-school-filter"), "beta")
    })
    expect(queryByText("Alpha University")).toBeNull()
    expect(queryByText("Beta College")).toBeTruthy()
  })
})
