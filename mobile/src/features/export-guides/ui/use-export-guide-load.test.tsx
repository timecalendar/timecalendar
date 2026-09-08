import { act, renderHook, waitFor } from "@testing-library/react-native"

import {
  createExportGuideRepository,
  type ExportGuideCatalogue,
  type ExportGuideLoadFailure,
  type ExportGuideLoadOutcome,
  type ExportGuideRepository,
} from "@/features/export-guides/data"
import type { ImportJourneyState } from "@/features/onboarding/draft"

import { useExportGuideLoad } from "./use-export-guide-load"

jest.mock("@/features/export-guides/data", () => ({
  ...jest.requireActual("@/features/export-guides/data"),
  createExportGuideRepository: jest.fn(),
}))
jest.mock("./telemetry", () => ({
  attemptBucket: jest.fn(() => "1"),
  emitExportGuideEvent: jest.fn(),
}))

const mockCreateRepository = createExportGuideRepository as jest.Mock

const catalogue: ExportGuideCatalogue = {
  schemaVersion: 1,
  catalogueVersion: "v1",
  locale: "en",
  providers: [],
  rejectedProviders: {},
}

const state = (draftRevision = 1): ImportJourneyState => ({
  phase: "draft",
  draftRevision,
  gateProgress: "programme",
  draft: {
    institution: { kind: "unlisted", schoolName: "School" },
    calendarName: "",
  },
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe("useExportGuideLoad", () => {
  beforeEach(() => jest.clearAllMocks())

  it("keeps one request alive across rerenders and single-flights repeated load", async () => {
    const pending = deferred<ExportGuideLoadOutcome>()
    let signal: AbortSignal | undefined
    const repository: ExportGuideRepository = {
      load: jest.fn((request) => {
        signal = request.signal
        return pending.promise
      }),
    }
    mockCreateRepository.mockReturnValue(repository)
    const dispatch = jest.fn()
    const onCatalogue = jest.fn()
    const hook = await renderHook<
      ReturnType<typeof useExportGuideLoad>,
      { journey: ImportJourneyState; callback: jest.Mock }
    >(
      ({ journey, callback }) =>
        useExportGuideLoad({
          state: journey,
          dispatch,
          selector: { kind: "active" },
          onCatalogue: callback,
        }),
      { initialProps: { journey: state(), callback: onCatalogue } },
    )

    let firstLoad: Promise<void> | undefined
    await act(async () => {
      firstLoad = hook.result.current.load()
      expect(hook.result.current.load()).toBe(firstLoad)
      await Promise.resolve()
    })
    expect(repository.load).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(hook.result.current.busy).toBe(true))

    const latestCallback = jest.fn()
    await hook.rerender({ journey: state(), callback: latestCallback })
    expect(signal?.aborted).toBe(false)
    await act(async () => {
      pending.resolve({ source: "network", catalogue })
      await firstLoad
    })

    await waitFor(() => expect(latestCallback).toHaveBeenCalledTimes(1))
    expect(onCatalogue).not.toHaveBeenCalled()
    expect(hook.result.current.busy).toBe(false)
    expect(mockCreateRepository).toHaveBeenCalledTimes(1)
  })

  it("aborts changed identity and ignores stale and unmounted completions", async () => {
    const first = deferred<ExportGuideLoadOutcome>()
    const second = deferred<ExportGuideLoadOutcome>()
    const signals: AbortSignal[] = []
    const repository: ExportGuideRepository = {
      load: jest
        .fn()
        .mockImplementationOnce(({ signal }) => {
          signals.push(signal)
          return first.promise
        })
        .mockImplementationOnce(({ signal }) => {
          signals.push(signal)
          return second.promise
        }),
    }
    mockCreateRepository.mockReturnValue(repository)
    const onCatalogue = jest.fn()
    const hook = await renderHook<
      ReturnType<typeof useExportGuideLoad>,
      { journey: ImportJourneyState }
    >(
      ({ journey }) =>
        useExportGuideLoad({
          state: journey,
          dispatch: jest.fn(),
          selector: { kind: "active" },
          onCatalogue,
        }),
      { initialProps: { journey: state() } },
    )

    let firstLoad: Promise<void> | undefined
    await act(async () => {
      firstLoad = hook.result.current.load()
      await Promise.resolve()
    })
    await hook.rerender({ journey: state(2) })
    let secondLoad: Promise<void> | undefined
    await act(async () => {
      secondLoad = hook.result.current.load()
      await Promise.resolve()
    })
    expect(signals[0]?.aborted).toBe(true)
    await act(async () => {
      first.resolve({ source: "network", catalogue })
      await firstLoad
    })
    expect(onCatalogue).not.toHaveBeenCalled()

    await hook.unmount()
    expect(signals[1]?.aborted).toBe(true)
    await act(async () => {
      second.resolve({ source: "network", catalogue })
      await secondLoad
    })
    expect(onCatalogue).not.toHaveBeenCalled()
  })

  it.each<ExportGuideLoadFailure>([
    "network",
    "timeout",
    "caller_cancelled",
    "http",
    "empty",
    "malformed",
    "oversized",
    "unsupported_schema",
    "invalid_generic",
    "invalid_envelope",
    "language_mismatch",
    "etag_mismatch",
    "version_mismatch",
    "storage",
  ])("keeps the journey blocked for %s", async (failure) => {
    const repository: ExportGuideRepository = {
      load: jest.fn(() => Promise.resolve({ source: "none", failure })),
    }
    mockCreateRepository.mockReturnValue(repository)
    const dispatch = jest.fn()
    const hook = await renderHook(() =>
      useExportGuideLoad({
        state: state(),
        dispatch,
        selector: { kind: "active" },
        onCatalogue: jest.fn(),
      }),
    )

    await act(async () => {
      await hook.result.current.load()
    })
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "block", failure }),
      ),
    )
  })
})
