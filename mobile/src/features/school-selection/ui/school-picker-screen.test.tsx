import { act, fireEvent, render } from "@testing-library/react-native"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { AccessibilityInfo } from "react-native"

import { useSchools } from "@/features/school-selection/data"

import SchoolPickerScreen from "./school-picker-screen"

// Presentational (70% floor): renders rows from a mocked useSchools through the
// real theme + i18n trees; loading/error/empty/no-results states render; the
// retry triggers refetch; selecting a school navigates to the group step with
// the id (mocked router.push). The native header chrome (title + search bar)
// is asserted through the options handed to the mocked Stack.Screen — the
// search filter is driven by invoking headerSearchBarOptions.onChangeText, the
// same seam the native UISearchController/SearchView drives at runtime. The
// data sub-barrel mocks only its hook — the REAL schoolMatches helper is kept
// (requireActual) so the screen filters through it, proving the accent/code
// search wiring (the helper's own edge cases live in search.test.ts).
jest.mock("@/features/school-selection/data", () => ({
  ...jest.requireActual("@/features/school-selection/data"),
  useSchools: jest.fn(),
}))

jest.mock("expo-router", () => ({
  router: { dismiss: jest.fn(), push: jest.fn() },
  Stack: { Screen: jest.fn(() => null) },
  useLocalSearchParams: jest.fn(() => ({})),
}))

// The screen reads the bottom inset for the Android list padding; the library's
// official Jest mock supplies zero-inset metrics without a provider tree.
jest.mock(
  "react-native-safe-area-context",
  () =>
    jest.requireActual<{ default: unknown }>(
      "react-native-safe-area-context/jest/mock",
    ).default,
)

const mockUseSchools = useSchools as jest.Mock
const mockPush = router.push as jest.Mock
const mockDismiss = router.dismiss as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockStackScreen = Stack.Screen as unknown as jest.Mock

const screenOptions = () =>
  mockStackScreen.mock.lastCall?.[0].options as {
    title: string
    headerTitle: string
    headerLeft?: () => React.ReactElement
    unstable_headerLeftItems?: () => { onPress: () => void }[]
    headerSearchBarOptions: {
      placeholder: string
      onChangeText: (e: { nativeEvent: { text: string } }) => void
      onCancelButtonPress: () => void
      onClose: () => void
    }
  }

const typeSearch = async (text: string) => {
  await act(async () => {
    screenOptions().headerSearchBarOptions.onChangeText({
      nativeEvent: { text },
    })
  })
}

const ready = (
  schools: { id: string; name: string; code?: string; imageUrl: string }[],
  refetch = jest.fn(),
) => ({
  schools: schools.map((s) => ({ code: "", ...s })),
  isLoading: false,
  isError: false,
  refetch,
})

beforeEach(() => {
  mockPush.mockClear()
  mockDismiss.mockClear()
  mockUseLocalSearchParams.mockReturnValue({})
  mockStackScreen.mockClear()
})

describe("SchoolPickerScreen", () => {
  it("puts the localized title and search field in the native header", async () => {
    mockUseSchools.mockReturnValue(ready([]))
    const { queryByRole } = await render(<SchoolPickerScreen />)

    expect(screenOptions().title).toBe("Select your school")
    expect(screenOptions().headerTitle).toBe("")
    expect(queryByRole("header")).toBeNull()
    expect(screenOptions().headerSearchBarOptions.placeholder).toBe(
      "Search schools",
    )
  })

  it("returns to calendar management from its scoped add-school flow", async () => {
    mockUseLocalSearchParams.mockReturnValue({ source: "calendar-management" })
    mockUseSchools.mockReturnValue(ready([]))
    await render(<SchoolPickerScreen />)

    const headerItems = screenOptions().unstable_headerLeftItems
    expect(headerItems).toBeDefined()
    headerItems!()[0]!.onPress()
    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })

  it("renders a row per school with the subtitle context line", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        { id: "univeiffel", name: "Université Gustave Eiffel", imageUrl: "" },
      ]),
    )
    const { getByText, getByTestId } = await render(<SchoolPickerScreen />)

    expect(getByText("Select your school").props.accessibilityRole).toBe(
      "header",
    )
    expect(getByText("Université Gustave Eiffel")).toBeTruthy()
    expect(getByText("Your timetable comes from your school.")).toBeTruthy()
    const row = getByTestId("onboarding-school-row-univeiffel")
    // The label is the bare school name (matchable cross-platform); the select
    // affordance is the hint.
    expect(row.props.accessibilityLabel).toBe("Université Gustave Eiffel")
    expect(row.props.accessibilityHint).toBe("Opens this school's groups")
  })

  it("offers the manual calendar path before searching", async () => {
    mockUseSchools.mockReturnValue(
      ready([{ id: "a", name: "Alpha University", imageUrl: "" }]),
    )
    const { getAllByRole, getByTestId, getByText } = await render(
      <SchoolPickerScreen />,
    )

    expect(getByText("I can't find my school")).toBeTruthy()
    expect(
      getAllByRole("button").map((button) => button.props.accessibilityLabel),
    ).toEqual(["Alpha University", "I can't find my school"])
    const action = getByTestId("onboarding-school-missing")
    expect(action.props.accessibilityHint).toBe(
      "Add your timetable using a calendar URL",
    )
    fireEvent.press(action)
    expect(mockPush).toHaveBeenCalledWith("/onboarding/ical-url")
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
    expect(getByText("I can't find my school")).toBeTruthy()
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

  it("filters the list from the header search bar", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        { id: "a", name: "Alpha University", imageUrl: "" },
        { id: "b", name: "Beta College", imageUrl: "" },
      ]),
    )
    const { queryByText } = await render(<SchoolPickerScreen />)

    await typeSearch("beta")
    expect(queryByText("Alpha University")).toBeNull()
    expect(queryByText("Beta College")).toBeTruthy()
  })

  it("filters accent-insensitively through the search helper", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        { id: "e", name: "Université Gustave Eiffel", imageUrl: "" },
        { id: "b", name: "Beta College", imageUrl: "" },
      ]),
    )
    const { queryByText } = await render(<SchoolPickerScreen />)

    await typeSearch("eiffel")
    expect(queryByText("Université Gustave Eiffel")).toBeTruthy()
    expect(queryByText("Beta College")).toBeNull()
  })

  it("filters by a code-only needle through the search helper", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        {
          id: "e",
          name: "Université Gustave Eiffel",
          code: "UPEM",
          imageUrl: "",
        },
        { id: "b", name: "Beta College", code: "BC", imageUrl: "" },
      ]),
    )
    const { queryByText } = await render(<SchoolPickerScreen />)

    await typeSearch("upem")
    expect(queryByText("Université Gustave Eiffel")).toBeTruthy()
    expect(queryByText("Beta College")).toBeNull()
  })

  it("shows the no-results state naming the query, hiding the subtitle", async () => {
    mockUseSchools.mockReturnValue(
      ready([{ id: "a", name: "Alpha University", imageUrl: "" }]),
    )
    const { queryByText, getByText } = await render(<SchoolPickerScreen />)

    await typeSearch("zzz")
    expect(queryByText("Alpha University")).toBeNull()
    expect(getByText("No results for “zzz”")).toBeTruthy()
    expect(getByText("I can't find my school")).toBeTruthy()
    expect(queryByText("Your timetable comes from your school.")).toBeNull()
    fireEvent.press(getByText("I can't find my school"))
    expect(mockPush).toHaveBeenCalledWith("/onboarding/ical-url")
  })

  it("restores the full list when the iOS search is cancelled", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        { id: "a", name: "Alpha University", imageUrl: "" },
        { id: "b", name: "Beta College", imageUrl: "" },
      ]),
    )
    const { queryByText } = await render(<SchoolPickerScreen />)

    await typeSearch("beta")
    expect(queryByText("Alpha University")).toBeNull()
    await act(async () => {
      screenOptions().headerSearchBarOptions.onCancelButtonPress()
    })
    expect(queryByText("Alpha University")).toBeTruthy()
  })

  it("restores the full list when the Android search view closes", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        { id: "a", name: "Alpha University", imageUrl: "" },
        { id: "b", name: "Beta College", imageUrl: "" },
      ]),
    )
    const { queryByText } = await render(<SchoolPickerScreen />)

    await typeSearch("beta")
    expect(queryByText("Alpha University")).toBeNull()
    await act(async () => {
      screenOptions().headerSearchBarOptions.onClose()
    })
    expect(queryByText("Alpha University")).toBeTruthy()
  })

  it("renders the logo image when the school has one", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        { id: "a", name: "Alpha", imageUrl: "https://cdn.example/a.png" },
      ]),
    )
    const { getByTestId, queryByTestId } = await render(<SchoolPickerScreen />)

    expect(getByTestId("onboarding-school-logo-a")).toBeTruthy()
    expect(queryByTestId("onboarding-school-monogram-a")).toBeNull()
  })

  it("falls back to the monogram when there is no logo url", async () => {
    mockUseSchools.mockReturnValue(
      ready([{ id: "b", name: "beta college", imageUrl: "" }]),
    )
    const { getByTestId, getByText } = await render(<SchoolPickerScreen />)

    expect(getByTestId("onboarding-school-monogram-b")).toBeTruthy()
    expect(getByText("B")).toBeTruthy()
  })

  it("announces the status to VoiceOver once per state kind, not per query", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => undefined)
    mockUseSchools.mockReturnValue(
      ready([{ id: "a", name: "Alpha University", imageUrl: "" }]),
    )
    await render(<SchoolPickerScreen />)

    await typeSearch("z")
    expect(announce).toHaveBeenCalledWith("No results for “z”")
    announce.mockClear()
    await typeSearch("zz")
    expect(announce).not.toHaveBeenCalled()
    announce.mockRestore()
  })

  it("falls back to the monogram when the logo fails to load", async () => {
    mockUseSchools.mockReturnValue(
      ready([
        { id: "a", name: "Alpha", imageUrl: "https://cdn.example/a.png" },
      ]),
    )
    const { getByTestId } = await render(<SchoolPickerScreen />)

    await act(async () => {
      fireEvent(getByTestId("onboarding-school-logo-a"), "error", {
        nativeEvent: { error: "load failed" },
      })
    })
    expect(getByTestId("onboarding-school-monogram-a")).toBeTruthy()
  })
})
