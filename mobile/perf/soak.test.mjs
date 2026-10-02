import assert from "node:assert/strict"
import { test } from "node:test"
import {
  accountSettles,
  bootstrapFirstCrossing,
  evaluate,
  parseInitialPage,
  parseMemory,
  parseProcessStart,
  parseSettles,
} from "./lib/soak.mjs"

const sample = (views = 400, nativeHeapKb = 100000) => ({
  views,
  memory: { nativeHeapKb },
})
const frames = {
  histogram: { frames: 100, p99Ms: 25 },
  reported: { jankyPct: 2 },
}
const result = (overrides = {}) =>
  evaluate({
    mode: "soak",
    elapsedMs: 0,
    state: { crossings: 500 },
    samples: [sample(), sample(420, 110000)],
    frameWindows: [frames],
    failures: [],
    ...overrides,
  })

test("counts observed adjacent settlements, including reversal, not attempts or duplicate logs", () => {
  const lines = [
    "x CALENDAR_PAGING settle page=7",
    "x CALENDAR_PAGING settle page=7",
    "x CALENDAR_PAGING settle page=8",
    "x CALENDAR_PAGING settle page=7",
  ]
  assert.deepEqual(
    accountSettles({ page: 7, crossings: 0 }, parseSettles(lines)),
    { page: 7, crossings: 2 },
  )
  assert.equal(parseInitialPage(["CALENDAR_PAGING commit center=7 ms=1.0"]), 7)
  assert.equal(parseInitialPage([]), null)
})

test("first crossing needs a matching commit and settle when startup has no page log", () => {
  assert.deepEqual(
    bootstrapFirstCrossing({ page: null, crossings: 0 }, [
      "CALENDAR_PAGING commit center=123 ms=2",
      "CALENDAR_PAGING settle page=123",
    ]),
    { page: 123, crossings: 1 },
  )
  assert.throws(
    () =>
      bootstrapFirstCrossing({ page: null, crossings: 0 }, [
        "CALENDAR_PAGING settle page=123",
      ]),
    /matching commit/,
  )
})

test("rejects jumps and wrong-direction settlements", () => {
  assert.throws(
    () => accountSettles({ page: 7, crossings: 0 }, [9]),
    /non-adjacent/,
  )
  assert.throws(
    () => accountSettles({ page: 7, crossings: 0 }, [6], 1),
    /direction/,
  )
})

test("parses memory and process start and leaves missing measures unknown", () => {
  assert.deepEqual(
    parseMemory(
      " Native Heap  1234  5\n Dalvik Heap  2345  5\n TOTAL  5678  5",
    ),
    { totalPssKb: 5678, nativeHeapKb: 1234, javaHeapKb: 2345 },
  )
  assert.equal(
    parseProcessStart(
      `123 (app process) ${Array.from({ length: 19 }, () => "0").join(" ")} 456 0`,
    ),
    "456",
  )
  assert.equal(
    result({ samples: [sample(), sample(null)] }).checks.viewRange,
    "unknown",
  )
  assert.equal(result({ frameWindows: [] }).checks.frameMetrics, "unknown")
  assert.equal(
    result({
      frameWindows: [
        { histogram: { frames: 100, p99Ms: null }, reported: { jankyPct: 2 } },
      ],
    }).checks.frameMetrics,
    "unknown",
  )
  assert.equal(
    result({ samples: [sample(), sample(400, null)] }).checks.heapGrowth,
    "unknown",
  )
})

test("requires duration/crossings, stable views and heap, frames, and no errors", () => {
  assert.equal(result().status, "pass")
  assert.equal(result({ state: { crossings: 499 } }).status, "fail")
  assert.equal(
    result({ samples: [sample(), sample(451)] }).checks.viewRange,
    false,
  )
  assert.equal(
    result({ samples: [sample(), sample(400, 140000)] }).checks.heapGrowth,
    false,
  )
  assert.equal(
    result({ failures: ["restart"] }).checks.processAndSettlement,
    false,
  )
  assert.equal(
    result({
      frameWindows: [
        { histogram: { frames: 100, p99Ms: 34 }, reported: { jankyPct: 2 } },
      ],
    }).checks.frameMetrics,
    false,
  )
  assert.equal(result({ mode: "stress", elapsedMs: 1799999 }).status, "fail")
})
