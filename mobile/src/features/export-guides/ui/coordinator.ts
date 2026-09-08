import {
  type ExportGuideLoadOutcome,
  type ExportGuideLocale,
  type ExportGuideRepository,
  type ExportGuideSelector,
} from "@/features/export-guides/data"

export interface ExportGuideJourneyRequest {
  readonly draftRevision: number
  readonly locale: ExportGuideLocale
  readonly selector: ExportGuideSelector
}

export interface ExportGuideJourneyResult {
  readonly request: ExportGuideJourneyRequest
  readonly outcome: ExportGuideLoadOutcome
}

export interface ExportGuideJourneyCoordinator {
  load(request: ExportGuideJourneyRequest): Promise<ExportGuideJourneyResult>
  cancel(): void
}

const requestKey = (request: ExportGuideJourneyRequest): string =>
  `${request.draftRevision}:${request.locale}:${request.selector.kind}:${request.selector.kind === "exact" ? request.selector.catalogueVersion : "active"}`

export function createExportGuideJourneyCoordinator(
  repository: ExportGuideRepository,
): ExportGuideJourneyCoordinator {
  let generation = 0
  let inFlight:
    | Readonly<{
        key: string
        promise: Promise<ExportGuideJourneyResult>
        controller: AbortController
      }>
    | undefined

  return {
    load(request) {
      const key = requestKey(request)
      if (inFlight?.key === key) return inFlight.promise
      inFlight?.controller.abort()
      const controller = new AbortController()
      const startedGeneration = ++generation
      const promise = repository
        .load({
          locale: request.locale,
          selector: request.selector,
          signal: controller.signal,
        })
        .then((outcome) => ({ request, outcome }))
        .finally(() => {
          if (generation === startedGeneration) inFlight = undefined
        })
      inFlight = { key, promise, controller }
      return promise
    },
    cancel() {
      generation += 1
      inFlight?.controller.abort()
      inFlight = undefined
    },
  }
}
