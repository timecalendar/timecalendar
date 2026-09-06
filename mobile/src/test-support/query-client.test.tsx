import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { useMutation, useQuery } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react-native"

import { createTestQueryClient } from "./query-client"

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.test\.tsx?$/.test(entry.name) ? [path] : []
  })
}

it("owns timer-free query and mutation caches through teardown", async () => {
  const harness = createTestQueryClient()
  const query = await renderHook(
    () => useQuery({ queryKey: ["proof"], queryFn: async () => "ready" }),
    { wrapper: harness.wrapper },
  )
  const mutation = await renderHook(
    () => useMutation({ mutationFn: async () => "saved" }),
    { wrapper: harness.wrapper },
  )

  await waitFor(() => expect(query.result.current.data).toBe("ready"))
  await act(async () => {
    await mutation.result.current.mutateAsync()
  })

  expect(harness.client.getDefaultOptions()).toMatchObject({
    queries: { retry: false, gcTime: Infinity },
    mutations: { retry: false, gcTime: Infinity },
  })
  expect(harness.client.getQueryCache().getAll()).toHaveLength(1)
  expect(harness.client.getMutationCache().getAll()).toHaveLength(1)

  await query.unmount()
  await mutation.unmount()
  harness.clear()

  expect(harness.client.getQueryCache().getAll()).toHaveLength(0)
  expect(harness.client.getMutationCache().getAll()).toHaveLength(0)
})

it("keeps direct test QueryClient construction at the owned seam", () => {
  const root = join(process.cwd(), "src")
  const directConstruction = ["new", "QueryClient("].join(" ")
  const offenders = sourceFiles(root)
    .filter((path) => readFileSync(path, "utf8").includes(directConstruction))
    .map((path) => relative(process.cwd(), path))

  expect(offenders).toEqual([])
})
