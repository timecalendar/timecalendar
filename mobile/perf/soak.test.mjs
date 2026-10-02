import assert from "node:assert/strict"
import { test } from "node:test"
import {
  accountSettles,
  createLogCursor,
  evaluate,
  parseMemory,
  parseProcessStart,
  parseSettles,
} from "./lib/soak.mjs"

const sample = (
  views = 400,
  nativeHeapAllocKb = 100000,
  jsHeapBytes = null,
) => ({
  views,
  memory: { nativeHeapAllocKb, jsHeapBytes },
})
const frames = {
  histogram: { frames: 100, p99Ms: 25 },
  reported: { jankyPct: 2 },
}
const result = (overrides = {}) =>
  evaluate({
    mode: "soak",
    elapsedMs: 0,
    state: { page: 7, crossings: 500 },
    samples: [sample(), sample(410, 110000), sample(420, 120000)],
    frameWindows: [frames, frames],
    failures: [],
    ...overrides,
  })

test("first observed settlement is baseline, followed by 500 adjacent changes", () => {
  const lines = [
    "CALENDAR_PAGING commit center=7 ms=1",
    "CALENDAR_PAGING settle page=7",
    "CALENDAR_PAGING settle page=7",
  ]
  let state = accountSettles({ page: null, crossings: 0 }, parseSettles(lines))
  assert.deepEqual(state, { page: 7, crossings: 0 })
  for (let page = 8; page <= 507; page++)
    state = accountSettles(state, [page], 1)
  assert.deepEqual(state, { page: 507, crossings: 500 })
  assert.deepEqual(accountSettles({ page: null, crossings: 0 }, []), {
    page: null,
    crossings: 0,
  })
  assert.deepEqual(accountSettles({ page: 7, crossings: 0 }, [8, 8, 7]), {
    page: 7,
    crossings: 2,
  })
})

test("rejects skipped and wrong-direction settlements", () => {
  assert.throws(
    () => accountSettles({ page: 7, crossings: 0 }, [9]),
    /non-adjacent/,
  )
  assert.throws(
    () => accountSettles({ page: 7, crossings: 0 }, [6], 1),
    /direction/,
  )
  assert.throws(
    () => accountSettles({ page: 7, crossings: 0 }, [Number.NaN]),
    /invalid/,
  )
})

test("continuous log cursor keeps split lines and fails if capture ends", () => {
  const cursor = createLogCursor()
  cursor.feed("CALENDAR_PAGING settle page=7\nCALENDAR_PAGING settle pa")
  assert.deepEqual(cursor.take(), ["CALENDAR_PAGING settle page=7"])
  cursor.feed("ge=8\n")
  assert.deepEqual(cursor.take(), ["CALENDAR_PAGING settle page=8"])
  cursor.fail("PID-scoped logcat exited before run ended")
  assert.throws(() => cursor.take(), /lost continuity/)
  assert.throws(
    () => cursor.feed("CALENDAR_PAGING settle page=9\n"),
    /lost continuity/,
  )
})

test("memory labels distinguish PSS, native allocation, Dalvik allocation and missing JS heap", () => {
  const dump = `                    Pss  Private  Private  SwapPss      Heap      Heap      Heap
                  Total    Dirty    Clean    Dirty     Size     Alloc     Free
 Native Heap       1234       1       2       3     40000     12345    27655
 Dalvik Heap       2345       4       5       6     30000      6789    23211
 TOTAL             5678       7       8       9`
  assert.deepEqual(parseMemory(dump), {
    totalPssKb: 5678,
    nativePssKb: 1234,
    dalvikPssKb: 2345,
    nativeHeapAllocKb: 12345,
    dalvikHeapAllocKb: 6789,
    jsHeapBytes: null,
  })
  assert.deepEqual(
    parseMemory(" Native Heap 1234 5\n Dalvik Heap 2345 6\n TOTAL 5678 7\n"),
    {
      totalPssKb: 5678,
      nativePssKb: 1234,
      dalvikPssKb: 2345,
      nativeHeapAllocKb: null,
      dalvikHeapAllocKb: null,
      jsHeapBytes: null,
    },
  )
  const withRss = dump
    .replace(
      "Pss  Private  Private  SwapPss      Heap      Heap      Heap",
      "Pss  Private  Private  SwapPss       RSS      Heap      Heap      Heap",
    )
    .replace(
      "Total    Dirty    Clean    Dirty     Size     Alloc     Free",
      "Total    Dirty    Clean    Dirty     Total     Size     Alloc     Free",
    )
    .replace(
      "1234       1       2       3     40000",
      "1234       1       2       3      9999     40000",
    )
    .replace(
      "2345       4       5       6     30000",
      "2345       4       5       6      8888     30000",
    )
  assert.equal(parseMemory(withRss).nativeHeapAllocKb, 12345)
  assert.equal(parseMemory(withRss).dalvikHeapAllocKb, 6789)
  const truncatedWithRss = withRss.replace(
    "1234       1       2       3      9999     40000     12345    27655",
    "1234       1       2       3     40000     12345    27655",
  )
  assert.equal(parseMemory(truncatedWithRss).nativeHeapAllocKb, null)
  assert.equal(
    parseMemory("Heap Heap Heap\nSize Alloc Free\nNative Heap 1234 1 2\n")
      .nativeHeapAllocKb,
    null,
  )
  assert.equal(
    parseMemory(
      "Heap Heap Heap\nSize Alloc Free\nNative Heap 1 2 3 4 100 120 0\n",
    ).nativeHeapAllocKb,
    null,
  )
  assert.equal(
    parseProcessStart(
      `123 (app process) ${Array.from({ length: 19 }, () => "0").join(" ")} 456 0`,
    ),
    "456",
  )
})

test("empty and insufficient samples remain unknown and nonpassing", () => {
  for (const samples of [[], [sample()], [sample(), sample()]]) {
    const value = result({ samples, frameWindows: [] })
    assert.equal(value.status, "incomplete")
    assert.equal(value.checks.samples, "unknown")
    assert.equal(value.checks.viewDeviation, "unknown")
    assert.equal(value.checks.nativeAllocationObserved, "unknown")
    assert.equal(value.checks.frameMetricsObserved, "unknown")
  }
})

test("PSS alone cannot pass heap stability and poor frame data stays unknown", () => {
  const pssOnly = result({
    samples: [sample(400, null), sample(410, null), sample(420, null)],
  })
  assert.equal(pssOnly.checks.nativeAllocationObserved, "unknown")
  assert.equal(pssOnly.checks.jsHeapObserved, "unknown")
  assert.equal(pssOnly.checks.heapStability, "unknown")
  assert.equal(
    result({
      frameWindows: [
        frames,
        { histogram: { frames: 0, p99Ms: null }, reported: { jankyPct: null } },
      ],
    }).checks.frameMetricsObserved,
    "unknown",
  )
  assert.equal(
    result({
      frameWindows: [
        frames,
        { histogram: { frames: 100, p99Ms: 25 }, reported: { jankyPct: 101 } },
      ],
    }).checks.frameMetricsObserved,
    "unknown",
  )
  assert.equal(result().checks.productFrameGates, "unknown")
  assert.equal(result().status, "incomplete")
})

test("view budget and failed session reject; sustained native growth is diagnostic", () => {
  assert.equal(result({ state: { page: 7, crossings: 499 } }).status, "fail")
  assert.equal(
    result({ samples: [sample(), sample(420), sample(451)] }).checks
      .viewDeviation,
    false,
  )
  const withinBaselineBudget = result({
    samples: [sample(400), sample(350), sample(450)],
  })
  assert.equal(withinBaselineBudget.viewRange, 100)
  assert.equal(withinBaselineBudget.maxViewDeviation, 50)
  assert.equal(withinBaselineBudget.checks.viewDeviation, true)
  assert.equal(
    result({ samples: [sample(400), sample(349), sample(400)] }).checks
      .viewDeviation,
    false,
  )
  assert.equal(
    result({ failures: ["process restarted"] }).checks.processAndSettlement,
    false,
  )
  const rising = result({
    samples: [
      sample(400, 100000),
      sample(400, 120000),
      sample(400, 150000),
      sample(400, 200000),
    ],
  })
  assert.equal(
    rising.nativeAllocationDiagnostic.sustainedGrowthAboveDiagnosticBudget,
    true,
  )
  assert.equal(rising.checks.heapStability, "unknown")
  assert.equal(result({ mode: "stress", elapsedMs: 1799999 }).status, "fail")
})
