export const SOAK_TARGET = 500
export const STRESS_DURATION_MS = 30 * 60 * 1000
export const VIEW_TOLERANCE = 50
export const DIAGNOSTIC_HEAP_GROWTH_BYTES = 32 * 1024 * 1024
export const DIAGNOSTIC_HEAP_GROWTH_RATIO = 0.2

export const parseSettles = (lines) =>
  lines.flatMap((line) => {
    const match = line.match(/CALENDAR_PAGING settle page=(-?\d+)/)
    return match ? [Number(match[1])] : []
  })

export const accountSettles = (state, pages, expectedDirection = null) => {
  const next = { ...state }
  for (const page of pages) {
    if (!Number.isSafeInteger(page))
      throw new Error(`invalid settled page: ${page}`)
    if (next.page === null) {
      next.page = page
      continue
    }
    const delta = page - next.page
    if (delta === 0) continue
    if (Math.abs(delta) !== 1)
      throw new Error(`non-adjacent settle: ${next.page} → ${page}`)
    if (expectedDirection !== null && delta !== expectedDirection)
      throw new Error(`unexpected settle direction: ${next.page} → ${page}`)
    next.crossings += 1
    next.page = page
  }
  return next
}

export const createLogCursor = () => {
  let pending = ""
  let lines = []
  let failure = null
  return {
    feed(chunk) {
      if (failure) throw failure
      pending += chunk
      const parts = pending.split("\n")
      pending = parts.pop()
      lines.push(...parts.filter(Boolean))
    },
    fail(reason) {
      failure = new Error(`log capture lost continuity: ${reason}`)
    },
    take() {
      if (failure) throw failure
      const result = lines
      lines = []
      return result
    },
  }
}

export const parseMemory = (text) => {
  const values = (label) =>
    text
      .match(new RegExp(`^\\s*${label}\\s+((?:\\d+\\s+)+)`, "m"))?.[1]
      ?.trim()
      .split(/\s+/)
      .map(Number) ?? []
  const native = values("Native Heap")
  const dalvik = values("Dalvik Heap")
  const total = values("TOTAL")
  const heapHeader = text
    .split("\n")
    .find((line) => /\bPss\b/i.test(line) && /Heap\s+Heap\s+Heap/.test(line))
  const expectedColumns = heapHeader
    ? /\bRSS\b/i.test(heapHeader)
      ? 8
      : 7
    : null
  const validAllocation = (row) =>
    row.length === expectedColumns &&
    row.at(-3) >= row.at(-2) &&
    row.at(-3) >= row.at(-1)
  const hasHeapColumns =
    heapHeader !== undefined && /Size\s+Alloc\s+Free/.test(text)
  return {
    totalPssKb: total[0] ?? null,
    nativePssKb: native[0] ?? null,
    dalvikPssKb: dalvik[0] ?? null,
    nativeHeapAllocKb:
      hasHeapColumns && validAllocation(native) ? native.at(-2) : null,
    dalvikHeapAllocKb:
      hasHeapColumns && validAllocation(dalvik) ? dalvik.at(-2) : null,
    jsHeapBytes: null,
  }
}

export const parseProcessStart = (stat) => {
  const tail = stat
    .slice(stat.lastIndexOf(")") + 2)
    .trim()
    .split(/\s+/)
  const start = tail[19]
  return /^\d+$/.test(start ?? "") ? start : null
}

const known = (value) => Number.isFinite(value) && value >= 0

export const evaluate = ({
  mode,
  elapsedMs,
  state,
  samples = [],
  frameWindows = [],
  failures = [],
}) => {
  const enoughSamples = samples.length >= 3
  const viewsKnown =
    enoughSamples && samples.every((sample) => known(sample.views))
  const nativeKnown =
    enoughSamples &&
    samples.every((sample) => known(sample.memory?.nativeHeapAllocKb))
  const jsKnown =
    enoughSamples &&
    samples.every((sample) => known(sample.memory?.jsHeapBytes))
  const framesKnown =
    frameWindows.length >= 2 &&
    frameWindows.every(
      (window) =>
        Number.isSafeInteger(window.histogram?.frames) &&
        window.histogram.frames > 0 &&
        known(window.histogram?.p99Ms) &&
        window.histogram.p99Ms > 0 &&
        known(window.reported?.jankyPct) &&
        window.reported.jankyPct <= 100,
    )
  const viewRange = viewsKnown
    ? Math.max(...samples.map((s) => s.views)) -
      Math.min(...samples.map((s) => s.views))
    : null
  const alloc = nativeKnown
    ? samples.map((s) => s.memory.nativeHeapAllocKb * 1024)
    : null
  const diagnosticLimitBytes = alloc
    ? Math.max(
        DIAGNOSTIC_HEAP_GROWTH_BYTES,
        alloc[0] * DIAGNOSTIC_HEAP_GROWTH_RATIO,
      )
    : null
  const tail = alloc?.slice(-3)
  const nativeAllocationDiagnostic = alloc
    ? {
        peakGrowthBytes: Math.max(...alloc) - alloc[0],
        endGrowthBytes: alloc.at(-1) - alloc[0],
        diagnosticLimitBytes,
        sustainedGrowthAboveDiagnosticBudget:
          tail.every(
            (value, index) => index === 0 || value > tail[index - 1],
          ) &&
          tail[0] > alloc[0] &&
          alloc.at(-1) - alloc[0] > diagnosticLimitBytes,
      }
    : null
  const frameDiagnostic = framesKnown
    ? {
        maxJankyPct: Math.max(
          ...frameWindows.map((window) => window.reported.jankyPct),
        ),
        maxP99Ms: Math.max(
          ...frameWindows.map((window) => window.histogram.p99Ms),
        ),
      }
    : null
  const checks = {
    durationOrCrossings:
      mode === "soak"
        ? Number.isSafeInteger(state?.crossings)
          ? state.crossings >= SOAK_TARGET
          : "unknown"
        : mode === "stress"
          ? known(elapsedMs)
            ? elapsedMs >= STRESS_DURATION_MS
            : "unknown"
          : "unknown",
    samples: enoughSamples ? true : "unknown",
    viewRange: viewRange === null ? "unknown" : viewRange <= VIEW_TOLERANCE,
    nativeAllocationObserved: nativeKnown ? true : "unknown",
    jsHeapObserved: jsKnown ? true : "unknown",
    heapStability: "unknown",
    frameMetricsObserved: framesKnown ? true : "unknown",
    productFrameGates: "unknown",
    processAndSettlement:
      !enoughSamples || state?.page === null || state?.page === undefined
        ? "unknown"
        : failures.length === 0,
  }
  const values = Object.values(checks)
  return {
    status: values.includes(false)
      ? "fail"
      : values.every((value) => value === true)
        ? "pass"
        : "incomplete",
    checks,
    viewRange,
    nativeAllocationDiagnostic,
    frameDiagnostic,
  }
}
