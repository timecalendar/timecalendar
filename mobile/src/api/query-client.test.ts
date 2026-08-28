import { mmkvQueryStorage, STORAGE_KEYS } from "@/storage"

import { cancelInFlightApiRequests } from "./mutator"
import {
  clearQueryRuntime,
  queryClient,
  quiesceQueryRuntime,
} from "./query-client"

jest.mock("./mutator", () => ({
  cancelInFlightApiRequests: jest.fn(),
}))

beforeEach(() => {
  queryClient.clear()
  jest.clearAllMocks()
})

afterEach(() => {
  queryClient.clear()
  jest.restoreAllMocks()
})

it("cancels request/query work before a reset", async () => {
  const cancelQueries = jest.spyOn(queryClient, "cancelQueries")
  await quiesceQueryRuntime()
  expect(cancelInFlightApiRequests).toHaveBeenCalledTimes(1)
  expect(cancelQueries).toHaveBeenCalledTimes(1)
})

it("removes persisted data and clears query and mutation caches", () => {
  mmkvQueryStorage.setItem(
    STORAGE_KEYS.persistedSchoolSelectionQuery,
    "persisted",
  )
  queryClient.setQueryData(["school"], { id: "school-1" })
  queryClient.getMutationCache().build(queryClient, {
    gcTime: Number.POSITIVE_INFINITY,
    mutationFn: async () => undefined,
  })

  clearQueryRuntime()

  expect(
    mmkvQueryStorage.getItem(STORAGE_KEYS.persistedSchoolSelectionQuery),
  ).toBeNull()
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
})
