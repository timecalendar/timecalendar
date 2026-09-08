import { act, renderHook, waitFor } from "@testing-library/react-native"

import type {
  FindSchoolGroupsRepDto,
  FindSchoolsRepDto,
  SchoolForList,
} from "@/api/generated/timeCalendar.schemas"
import { customFetch } from "@/api/mutator"
import { createTestQueryClient } from "@/test-support/query-client"

import { useSchoolGroups, useSchools } from "./queries"

// Mock the single designed fetch seam: the hooks drive the REAL generated hook +
// a real QueryClient, only the network boundary stubbed (the established posture,
// from the retired schools-screen.test.tsx). Asserts the feature layer maps the
// rep DTOs to the domain shapes and exposes the TanStack state flags.
jest.mock("@/api/mutator", () => ({ customFetch: jest.fn() }))

const mockedFetch = customFetch as jest.MockedFunction<typeof customFetch>

const schoolsResponse: FindSchoolsRepDto = {
  schools: [
    {
      id: "mygamingacademia",
      name: "My Gaming Academia",
      code: "MGA",
      imageUrl: "a.png",
      imageUrlDark: "a-dark.png",
      intranetUrl: "https://intranet.mga.example/",
      exportGuide: {
        providerSlug: "future-provider",
        requireProgramme: false,
        requireConnect: true,
        catalogueVersion: "2026-09-07.1",
      },
    },
    {
      id: "univeiffel",
      name: "Université Gustave Eiffel",
      code: "UPEM",
      imageUrl: "b.png",
      imageUrlDark: null,
      intranetUrl: null,
      exportGuide: {
        providerSlug: "generic",
        requireProgramme: true,
        requireConnect: false,
        catalogueVersion: "2026-09-07.1",
      },
    },
  ] as SchoolForList[],
}

const groupsResponse: FindSchoolGroupsRepDto = {
  groups: [
    {
      text: "L1",
      value: "l1",
      children: [{ text: "Group A", value: "a", children: [] }],
    },
  ],
}

const queryHarness = createTestQueryClient()

beforeEach(() => mockedFetch.mockReset())
afterEach(() => queryHarness.clear())

describe("useSchools", () => {
  it("maps the success response to SchoolListItem and exposes flags", async () => {
    mockedFetch.mockResolvedValueOnce(schoolsResponse)

    const { result } = await renderHook(() => useSchools(), {
      wrapper: queryHarness.wrapper,
    })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.schools.length).toBe(2))

    expect(result.current.schools[0]).toEqual({
      id: "mygamingacademia",
      name: "My Gaming Academia",
      code: "MGA",
      imageUrl: "a.png",
      imageUrlDark: "a-dark.png",
      intranetUrl: "https://intranet.mga.example/",
      exportGuide: {
        providerSlug: "future-provider",
        requireProgramme: false,
        requireConnect: true,
        catalogueVersion: "2026-09-07.1",
      },
    })
    // The Connect step reads intranetUrl off the draft's SchoolListItem, so the
    // nullable case must survive the projection as null, not be dropped.
    expect(result.current.schools[1]?.intranetUrl).toBeNull()
    expect(result.current.isError).toBe(false)
    expect(typeof result.current.refetch).toBe("function")
    expect(mockedFetch).toHaveBeenCalledWith(
      "/schools",
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("surfaces the error branch with an empty list", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("boom"))

    const { result } = await renderHook(() => useSchools(), {
      wrapper: queryHarness.wrapper,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.schools).toEqual([])
    mockedFetch.mockResolvedValueOnce(schoolsResponse)
    await act(() => result.current.refetch())
    await waitFor(() => expect(result.current.schools).toHaveLength(2))
  })
})

describe("useSchoolGroups", () => {
  it("maps the group tree to SchoolGroupNode", async () => {
    mockedFetch.mockResolvedValueOnce(groupsResponse)

    const { result } = await renderHook(() => useSchoolGroups("univeiffel"), {
      wrapper: queryHarness.wrapper,
    })

    await waitFor(() => expect(result.current.groups.length).toBe(1))
    expect(result.current.groups[0]).toEqual({
      text: "L1",
      value: "l1",
      children: [{ text: "Group A", value: "a", children: [] }],
    })
    expect(mockedFetch).toHaveBeenCalledWith(
      "/schools/univeiffel/school-group",
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("surfaces the error branch with an empty list", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("boom"))

    const { result } = await renderHook(() => useSchoolGroups("univeiffel"), {
      wrapper: queryHarness.wrapper,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.groups).toEqual([])
    mockedFetch.mockResolvedValueOnce(groupsResponse)
    await act(() => result.current.refetch())
    await waitFor(() => expect(result.current.groups).toHaveLength(1))
  })
})
