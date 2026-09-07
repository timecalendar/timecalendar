import { act, renderHook } from "@testing-library/react-native"
import type { BarcodeScanningResult } from "expo-camera"

import type { CalendarImportFields } from "@/features/calendar-sources/data"

import {
  type QrImportController,
  useQrImportController,
} from "./use-qr-import-controller"

function scan(data: string): BarcodeScanningResult {
  return { data, type: "qr" } as BarcodeScanningResult
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

const addCalendarFromUrl = jest.fn<Promise<void>, [string, unknown]>()
const clearDraft = jest.fn()
const leaveJourney = jest.fn((clear: () => void) => clear())
const openManualUrl = jest.fn()
const recordError = jest.fn()

type ScanningController = Extract<QrImportController, { phase: "scanning" }>
const scanningHasNoRetry: "retry" extends keyof ScanningController
  ? never
  : true = true

beforeEach(() => {
  jest.clearAllMocks()
})

function renderController(
  fields: CalendarImportFields = { name: "L3", schoolId: "school-1" },
) {
  return renderHook<
    QrImportController,
    { currentFields: CalendarImportFields }
  >(
    ({ currentFields }) =>
      useQrImportController({
        fields: currentFields,
        addCalendarFromUrl,
        clearDraft,
        leaveJourney,
        openManualUrl,
        recordError,
      }),
    { initialProps: { currentFields: fields } },
  )
}

describe("useQrImportController", () => {
  it("captures one normalized attempt and completes exactly once", async () => {
    expect(scanningHasNoRetry).toBe(true)
    const invocation = deferred<void>()
    addCalendarFromUrl.mockReturnValueOnce(invocation.promise)
    const { result } = await renderController()

    await act(async () => {
      result.current.handleBarcode(scan("webcal://example.com/cal.ics"))
      result.current.handleBarcode(scan("https://other.example/ignored.ics"))
    })

    expect(result.current).toMatchObject({
      phase: "importing",
      attempt: {
        url: "https://example.com/cal.ics",
        fields: { name: "L3", schoolId: "school-1" },
      },
    })
    expect(addCalendarFromUrl).toHaveBeenCalledTimes(1)

    await act(async () => invocation.resolve())

    expect(result.current.phase).toBe("completed")
    expect(clearDraft).toHaveBeenCalledTimes(1)
    expect(leaveJourney).toHaveBeenCalledTimes(1)
    result.current.handleBarcode(scan("https://other.example/late.ics"))
    expect(addCalendarFromUrl).toHaveBeenCalledTimes(1)
  })

  it("re-arms immediately after invalid input without recording", async () => {
    addCalendarFromUrl.mockResolvedValueOnce(undefined)
    const { result } = await renderController()

    await act(async () => {
      result.current.handleBarcode(scan("BEGIN:VCARD"))
    })
    expect(result.current).toMatchObject({
      phase: "scanning",
      invalidPayload: true,
    })
    expect(addCalendarFromUrl).not.toHaveBeenCalled()
    expect(recordError).not.toHaveBeenCalled()

    await act(async () => {
      result.current.handleBarcode(scan("https://example.com/valid.ics"))
    })
    expect(addCalendarFromUrl).toHaveBeenCalledTimes(1)
  })

  it("records every failed invocation and excludes rapid retry and scan inputs", async () => {
    const initial = deferred<void>()
    const retry = deferred<void>()
    addCalendarFromUrl
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(retry.promise)
    const { result } = await renderController()

    await act(async () => {
      result.current.handleBarcode(scan("https://example.com/cal.ics"))
      initial.reject(new Error("initial"))
    })
    expect(result.current.phase).toBe("failed")
    expect(recordError).toHaveBeenCalledTimes(1)

    if (result.current.phase !== "failed") throw new Error("expected failure")
    const failedController = result.current
    await act(async () => {
      failedController.retry()
      failedController.retry()
      failedController.handleBarcode(scan("https://other.example/ignored.ics"))
    })
    expect(addCalendarFromUrl).toHaveBeenCalledTimes(2)

    await act(async () => retry.reject(new Error("retry")))
    expect(result.current.phase).toBe("failed")
    expect(recordError).toHaveBeenCalledTimes(2)
    expect(clearDraft).not.toHaveBeenCalled()
  })

  it("retries captured fields, preserves failure for manual entry, and resets only for scan another", async () => {
    addCalendarFromUrl
      .mockRejectedValueOnce(new Error("initial"))
      .mockRejectedValueOnce(new Error("retry"))
      .mockResolvedValueOnce(undefined)
    const { result, rerender } = await renderController()

    await act(async () => {
      result.current.handleBarcode(scan("webcal://example.com/original.ics"))
    })
    await rerender({
      currentFields: { name: "Changed", schoolId: "school-2" },
    })

    if (result.current.phase !== "failed") throw new Error("expected failure")
    const initialFailure = result.current
    await act(async () => {
      initialFailure.handleBarcode(scan("https://other.example/ignored.ics"))
      initialFailure.enterManualUrl()
    })
    expect(openManualUrl).toHaveBeenCalledTimes(1)
    expect(addCalendarFromUrl).toHaveBeenCalledTimes(1)
    expect(clearDraft).not.toHaveBeenCalled()

    if (result.current.phase !== "failed") throw new Error("expected failure")
    const retryableFailure = result.current
    await act(async () => retryableFailure.retry())
    expect(addCalendarFromUrl).toHaveBeenLastCalledWith(
      "https://example.com/original.ics",
      { name: "L3", schoolId: "school-1" },
    )

    if (result.current.phase !== "failed") throw new Error("expected failure")
    const finalFailure = result.current
    await act(async () => {
      finalFailure.scanAnother()
      finalFailure.scanAnother()
    })
    expect(result.current).toMatchObject({
      phase: "scanning",
      invalidPayload: false,
    })
    await act(async () => {
      result.current.handleBarcode(scan("https://other.example/new.ics"))
    })
    expect(addCalendarFromUrl).toHaveBeenLastCalledWith(
      "https://other.example/new.ics",
      { name: "Changed", schoolId: "school-2" },
    )
  })

  it.each(["resolve", "reject"] as const)(
    "makes a late %s inert after disposal",
    async (settlement) => {
      const invocation = deferred<void>()
      addCalendarFromUrl.mockReturnValueOnce(invocation.promise)
      const consoleError = jest.spyOn(console, "error").mockImplementation()
      try {
        const { result, unmount } = await renderController()
        await act(async () => {
          result.current.handleBarcode(scan("https://example.com/cal.ics"))
        })
        await unmount()

        await act(async () => {
          if (settlement === "resolve") invocation.resolve()
          else invocation.reject(new Error("late"))
        })

        expect(clearDraft).not.toHaveBeenCalled()
        expect(leaveJourney).not.toHaveBeenCalled()
        expect(openManualUrl).not.toHaveBeenCalled()
        expect(recordError).not.toHaveBeenCalled()
        expect(consoleError).not.toHaveBeenCalled()
      } finally {
        consoleError.mockRestore()
      }
    },
  )
})
