import type { ExportGuideRepository } from "@/features/export-guides/data"

import { createExportGuideJourneyCoordinator } from "./coordinator"

describe("export-guide journey coordinator", () => {
  it("returns one promise for repeated identical requests", async () => {
    let resolve!: (value: { source: "none"; failure: "network" }) => void
    const repository: ExportGuideRepository = {
      load: jest.fn(
        () =>
          new Promise((done) => {
            resolve = done
          }),
      ),
    }
    const coordinator = createExportGuideJourneyCoordinator(repository)
    const request = {
      draftRevision: 1,
      locale: "en" as const,
      selector: { kind: "active" as const },
    }
    const first = coordinator.load(request)
    const second = coordinator.load(request)
    expect(first).toBe(second)
    expect(repository.load).toHaveBeenCalledTimes(1)
    resolve({ source: "none", failure: "network" })
    await expect(first).resolves.toMatchObject({ request })
  })

  it("aborts an older request when identity changes or navigation cancels", () => {
    const signals: AbortSignal[] = []
    const repository: ExportGuideRepository = {
      load: jest.fn(({ signal }) => {
        signals.push(signal!)
        return new Promise(() => undefined)
      }),
    }
    const coordinator = createExportGuideJourneyCoordinator(repository)
    void coordinator.load({
      draftRevision: 1,
      locale: "en",
      selector: { kind: "active" },
    })
    void coordinator.load({
      draftRevision: 2,
      locale: "fr",
      selector: { kind: "active" },
    })
    expect(signals[0]?.aborted).toBe(true)
    coordinator.cancel()
    expect(signals[1]?.aborted).toBe(true)
  })
})
