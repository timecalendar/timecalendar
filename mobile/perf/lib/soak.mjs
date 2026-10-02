export const SOAK_TARGET = 500
export const STRESS_DURATION_MS = 30 * 60 * 1000
export const VIEW_TOLERANCE = 50
export const MAX_HEAP_GROWTH_BYTES = 32 * 1024 * 1024
export const MAX_HEAP_GROWTH_RATIO = 0.2
export const MAX_JANKY_PCT = 5
export const MAX_P99_MS = 33

export const parseInitialPage = (lines) => {
  const pages = parseSettles(lines)
  if (pages.length) return pages.at(-1)
  const centers = lines.flatMap((line) => {
    const match = line.match(/CALENDAR_PAGING commit center=(-?\d+)/)
    return match ? [Number(match[1])] : []
  })
  return centers.at(-1) ?? null
}

export const bootstrapFirstCrossing = (state, lines) => {
  if (state.page !== null) return accountSettles(state, parseSettles(lines))
  const settled = parseSettles(lines)
  const committed = lines.flatMap((line) => {
    const match = line.match(/CALENDAR_PAGING commit center=(-?\d+)/)
    return match ? [Number(match[1])] : []
  })
  if (settled.length !== 1 || !committed.includes(settled[0]))
    throw new Error("first crossing lacks matching commit and settle evidence")
  return { page: settled[0], crossings: state.crossings + 1 }
}

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

export const parseMemory = (text) => {
  const totalPssKb = Number(text.match(/^\s*TOTAL\s+(\d+)\s+/m)?.[1])
  const nativeHeapKb = Number(text.match(/^\s*Native Heap\s+(\d+)\s+/m)?.[1])
  const javaHeapKb = Number(text.match(/^\s*Dalvik Heap\s+(\d+)\s+/m)?.[1])
  return {
    totalPssKb: totalPssKb || null,
    nativeHeapKb: nativeHeapKb || null,
    javaHeapKb: javaHeapKb || null,
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

export const evaluate = ({
  mode,
  elapsedMs,
  state,
  samples,
  frameWindows,
  failures,
}) => {
  const initial = samples[0]
  const knownViews = samples.every((sample) => Number.isFinite(sample.views))
  const knownHeap = samples.every((sample) =>
    Number.isFinite(sample.memory.nativeHeapKb),
  )
  const knownFrames =
    frameWindows.length > 0 &&
    frameWindows.every(
      (window) =>
        Number.isFinite(window.histogram.frames) &&
        window.histogram.frames > 0 &&
        Number.isFinite(window.reported.jankyPct) &&
        Number.isFinite(window.histogram.p99Ms),
    )
  const viewRange = knownViews
    ? Math.max(...samples.map((s) => s.views)) -
      Math.min(...samples.map((s) => s.views))
    : null
  const heapGrowthBytes = knownHeap
    ? (Math.max(...samples.map((s) => s.memory.nativeHeapKb)) -
        initial.memory.nativeHeapKb) *
      1024
    : null
  const heapLimitBytes = knownHeap
    ? Math.max(
        MAX_HEAP_GROWTH_BYTES,
        initial.memory.nativeHeapKb * 1024 * MAX_HEAP_GROWTH_RATIO,
      )
    : null
  const checks = {
    durationOrCrossings:
      mode === "soak"
        ? state.crossings >= SOAK_TARGET
        : elapsedMs >= STRESS_DURATION_MS,
    viewRange: viewRange === null ? "unknown" : viewRange <= VIEW_TOLERANCE,
    heapGrowth:
      heapGrowthBytes === null ? "unknown" : heapGrowthBytes <= heapLimitBytes,
    frameMetrics: knownFrames
      ? frameWindows.every(
          (window) =>
            window.reported.jankyPct <= MAX_JANKY_PCT &&
            window.histogram.p99Ms <= MAX_P99_MS,
        )
      : "unknown",
    processAndSettlement: failures.length === 0,
  }
  return {
    status: Object.values(checks).every((value) => value === true)
      ? "pass"
      : "fail",
    checks,
    viewRange,
    heapGrowthBytes,
    heapLimitBytes,
  }
}
