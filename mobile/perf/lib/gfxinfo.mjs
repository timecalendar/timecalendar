const PERCENTILES = [50, 90, 95, 99]

const numberAfter = (text, label) => {
  const match = text.match(new RegExp(`^${label}:\\s*(\\d+)`, "m"))
  return match ? Number(match[1]) : null
}

export const parseHistogram = (text) => {
  const match = text.match(/^HISTOGRAM:(.*)$/m)
  if (!match) return []
  return match[1]
    .trim()
    .split(/\s+/)
    .map((entry) => entry.match(/^(\d+)ms=(\d+)$/))
    .filter(Boolean)
    .map(([, ms, count]) => ({ ms: Number(ms), count: Number(count) }))
}

const histogramPercentile = (histogram, total, percentile) => {
  const target = (total * percentile) / 100
  let seen = 0
  for (const bucket of histogram) {
    seen += bucket.count
    if (seen >= target) return bucket.ms
  }
  return null
}

// HWUI buckets truncate to whole milliseconds, so the 16 ms bucket holds frames
// in [16, 17): "≤16 ms" stands for the 16.7 ms deadline at 60 Hz, and buckets
// from 34 ms up are the frames over two vsyncs.
const summarise = (histogram) => {
  const total = histogram.reduce((sum, bucket) => sum + bucket.count, 0)
  const countWhere = (predicate) =>
    histogram
      .filter((bucket) => predicate(bucket.ms))
      .reduce((sum, bucket) => sum + bucket.count, 0)
  const over16 = countWhere((ms) => ms > 16)
  return {
    frames: total,
    p50Ms: histogramPercentile(histogram, total, 50),
    p90Ms: histogramPercentile(histogram, total, 90),
    p95Ms: histogramPercentile(histogram, total, 95),
    p99Ms: histogramPercentile(histogram, total, 99),
    maxMs: histogram.findLast((bucket) => bucket.count > 0)?.ms ?? null,
    framesOver16Ms: over16,
    framesOver33Ms: countWhere((ms) => ms > 33),
    withinDeadlinePct: total === 0 ? null : round(100 - (100 * over16) / total),
  }
}

const round = (value, digits = 1) =>
  Math.round(value * 10 ** digits) / 10 ** digits

const parseProfileData = (text) => {
  const rows = []
  const blocks = text.split("---PROFILEDATA---")
  for (let index = 1; index < blocks.length; index += 2) {
    const lines = blocks[index].trim().split("\n")
    const header = lines.shift()?.split(",") ?? []
    const column = (name) => header.indexOf(name)
    for (const line of lines) {
      const cells = line.split(",").map(Number)
      if (cells[column("Flags")] !== 0) continue
      const intended = cells[column("IntendedVsync")]
      const completed = cells[column("FrameCompleted")]
      const handleInput = cells[column("HandleInputStart")]
      const animation = cells[column("AnimationStart")]
      const traversals = cells[column("PerformTraversalsStart")]
      const draw = cells[column("DrawStart")]
      const syncQueued = cells[column("SyncQueued")]
      rows.push({
        intendedVsync: intended,
        totalMs: (completed - intended) / 1e6,
        inputMs: (animation - handleInput) / 1e6,
        animationMs: (traversals - animation) / 1e6,
        traversalMs: (draw - traversals) / 1e6,
        drawMs: (syncQueued - draw) / 1e6,
        renderThreadMs: (completed - syncQueued) / 1e6,
      })
    }
  }
  return rows
}

const rowPercentiles = (rows, key) => {
  const sorted = rows.map((row) => row[key]).sort((a, b) => a - b)
  return Object.fromEntries(
    PERCENTILES.map((percentile) => [
      `p${percentile}Ms`,
      sorted.length === 0
        ? null
        : round(
            sorted[
              Math.min(
                sorted.length - 1,
                Math.ceil((percentile / 100) * sorted.length) - 1,
              )
            ],
          ),
    ]),
  )
}

export const parseGfxinfo = (text) => {
  const histogram = parseHistogram(text)
  const rows = parseProfileData(text)
  const jankyMatch = text.match(/^Janky frames:\s*(\d+)\s*\(([\d.]+)%\)/m)
  return {
    reported: {
      totalFrames: numberAfter(text, "Total frames rendered"),
      jankyFrames: jankyMatch ? Number(jankyMatch[1]) : null,
      jankyPct: jankyMatch ? Number(jankyMatch[2]) : null,
      missedVsync: numberAfter(text, "Number Missed Vsync"),
      slowUiThread: numberAfter(text, "Number Slow UI thread"),
      slowIssueDrawCommands: numberAfter(
        text,
        "Number Slow issue draw commands",
      ),
      frameDeadlineMissed: numberAfter(text, "Number Frame deadline missed"),
    },
    histogram: summarise(histogram),
    lastFrames: {
      count: rows.length,
      total: rowPercentiles(rows, "totalMs"),
      uiThreadTraversal: rowPercentiles(rows, "traversalMs"),
      renderThread: rowPercentiles(rows, "renderThreadMs"),
    },
  }
}

// `dumpsys activity top` prints each resumed activity's view hierarchy, one
// line per android.view.View. meminfo's "Views:" relies on instance counting,
// which only works in debuggable apps.
export const hierarchyViewClasses = (dump, pkg) => {
  const section = dump
    .split(/^TASK /m)
    .find((task) => task.includes(`ACTIVITY ${pkg}/`))
  const hierarchy = section?.split("View Hierarchy:")[1]
  if (!hierarchy) return null
  const classes = {}
  for (const line of hierarchy.split("\n")) {
    const match = line.match(/^\s+([\w.$]+)\{[0-9a-f]+ [VIG.]/)
    if (match) classes[match[1]] = (classes[match[1]] ?? 0) + 1
  }
  return classes
}

export const countHierarchyViews = (dump, pkg) => {
  const classes = hierarchyViewClasses(dump, pkg)
  return classes === null
    ? null
    : Object.values(classes).reduce((total, count) => total + count, 0)
}

// /proc/<pid>/task/*/schedstat gives each thread's on-CPU nanoseconds.
export const parseThreadTimes = (text) => {
  const threads = new Map()
  for (const line of text.trim().split("\n")) {
    const [name, schedstat] = line.split("|")
    if (!name || !schedstat) continue
    const runNs = Number(schedstat.trim().split(/\s+/)[0])
    threads.set(name.trim(), (threads.get(name.trim()) ?? 0) + runNs)
  }
  return threads
}

export const threadDeltaMs = (before, after) => {
  const deltas = []
  for (const [name, ns] of after) {
    const ms = round((ns - (before.get(name) ?? 0)) / 1e6)
    if (ms >= 1) deltas.push([name, ms])
  }
  return Object.fromEntries(deltas.sort(([, a], [, b]) => b - a))
}
