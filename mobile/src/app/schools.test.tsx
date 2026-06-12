import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { customFetch } from "@/api/mutator"
import type {
  FindSchoolsRepDto,
  SchoolForList,
} from "@/api/generated/timeCalendar.schemas"

import SchoolsScreen from "./schools"

// Mock the single designed fetch seam: the screen renders through the real
// generated hook + a real QueryClient, with only the network boundary stubbed.
jest.mock("@/api/mutator", () => ({
  customFetch: jest.fn(),
}))

const mockedFetch = customFetch as jest.MockedFunction<typeof customFetch>

// Seeded school names recorded from
// server/src/modules/school/fixtures/school.fixtures.yml — the same set the
// e2e harness asserts against. Keep in sync if the fixtures change. Only the
// fields the screen reads (id, name) are supplied; the rest of the shape is
// irrelevant to the render.
const seededResponse: FindSchoolsRepDto = {
  schools: [
    { id: "mygamingacademia", name: "My Gaming Academia" },
    { id: "univeiffel", name: "Université Gustave Eiffel" },
  ] as SchoolForList[],
}

// Named component (not an inline arrow) to satisfy react/display-name.
const wrapper = (client: QueryClient) =>
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

// Retry disabled so the error case resolves immediately instead of backing off.
const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } })

beforeEach(() => {
  mockedFetch.mockReset()
})

describe("SchoolsScreen", () => {
  it("renders the seeded schools fetched through the query layer", async () => {
    mockedFetch.mockResolvedValueOnce(seededResponse)

    const { findByText } = await render(<SchoolsScreen />, {
      wrapper: wrapper(makeQueryClient()),
    })

    expect(await findByText("My Gaming Academia")).toBeTruthy()
    expect(await findByText("Université Gustave Eiffel")).toBeTruthy()
    expect(mockedFetch).toHaveBeenCalledWith(
      "/schools",
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("shows the error state when the fetch fails", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("boom"))

    const { findByText } = await render(<SchoolsScreen />, {
      wrapper: wrapper(makeQueryClient()),
    })

    expect(await findByText("Could not load schools.")).toBeTruthy()
  })
})
