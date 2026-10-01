#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"

import {
  HID_OVERHEAD_MS,
  pinch,
  plannedDurationMs,
  swipeChain,
  toHidScript,
  verticalScroll,
} from "./lib/gestures.mjs"
import {
  countHierarchyViews,
  parseGfxinfo,
  parseThreadTimes,
  threadDeltaMs,
} from "./lib/gfxinfo.mjs"

const { values: options } = parseArgs({
  options: {
    serial: { type: "string", default: process.env.ANDROID_SERIAL ?? "" },
    package: { type: "string", default: "fr.samuelprak.timecalendar.perf" },
    url: {
      type: "string",
      default: "timecalendar-perf://calendar?focusDate=2026-10-05",
    },
    label: { type: "string", default: "run" },
    out: { type: "string", default: "perf/out" },
    apk: { type: "string" },
    "seed-token": { type: "string" },
    "api-port": { type: "string", default: "3005" },
    probe: { type: "string" },
    logcat: { type: "string" },
    scenarios: { type: "string" },
    trace: { type: "boolean", default: false },
    "settle-ms": { type: "string", default: "2500" },
  },
})

const repeat = (count, ...directions) =>
  Array.from({ length: count }, () => directions).flat()

const SCENARIOS = {
  "swipe-forward-20": (screen) =>
    swipeChain(screen, {
      directions: repeat(20, "forward"),
      strokeMs: 150,
      gapMs: 150,
    }),
  "swipe-back-20": (screen) =>
    swipeChain(screen, {
      directions: repeat(20, "back"),
      strokeMs: 150,
      gapMs: 150,
    }),
  "fling-5": (screen) =>
    swipeChain(screen, {
      directions: repeat(5, "forward"),
      strokeMs: 150,
      gapMs: 900,
    }),
  "reversal-10": (screen) =>
    swipeChain(screen, {
      directions: repeat(10, "forward", "back"),
      strokeMs: 150,
      gapMs: 120,
    }),
  "diagonal-20": (screen) =>
    swipeChain(screen, {
      directions: repeat(20, "forward"),
      strokeMs: 150,
      gapMs: 1200,
      angleDegrees: 30,
    }),
  "vertical-scroll": (screen) =>
    verticalScroll(screen, { count: 6, strokeMs: 120, gapMs: 600 }),
  "pinch-3s": (screen) =>
    pinch(screen, { durationMs: 3000, minGap: 250, maxGap: 900 }),
}

const DEFAULT_SCENARIOS = [
  "swipe-forward-20",
  "swipe-back-20",
  "fling-5",
  "vertical-scroll",
  "pinch-3s",
]
const selected = options.scenarios?.split(",") ?? DEFAULT_SCENARIOS
const pkg = options.package
const outDir = path.resolve(options.out, options.label)
const rawDir = path.join(outDir, "raw")
fs.mkdirSync(rawDir, { recursive: true })

const adbArgs = options.serial ? ["-s", options.serial] : []
const adb = (...args) =>
  execFileSync("adb", [...adbArgs, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
const shell = (command) => adb("shell", command)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const save = (name, contents) =>
  fs.writeFileSync(path.join(rawDir, name), contents)

const screenSize = () => {
  const sizes = shell("wm size")
  const [, width, height] =
    sizes.match(/Override size: (\d+)x(\d+)/) ??
    sizes.match(/Physical size: (\d+)x(\d+)/) ??
    []
  if (!width || !height) throw new Error(`cannot read wm size: ${sizes}`)
  return { width: Number(width), height: Number(height) }
}

const deviceInfo = () => {
  const prop = (name) => shell(`getprop ${name}`).trim()
  const refresh = shell("dumpsys SurfaceFlinger").match(
    /refresh-rate\s*:\s*([\d.]+)/,
  )
  return {
    model: prop("ro.product.model"),
    android: prop("ro.build.version.release"),
    build: prop("ro.build.display.id"),
    refreshHz: refresh ? Number(refresh[1]) : null,
    size: shell("wm size").trim(),
    density: shell("wm density").trim(),
    packageVersion:
      shell(`dumpsys package ${pkg}`).match(/versionName=(\S+)/)?.[1] ?? null,
  }
}

const pidOf = () => shell(`pidof ${pkg}`).trim().split(/\s+/)[0]

const threadSnapshot = (pid) =>
  parseThreadTimes(
    shell(
      `for t in /proc/${pid}/task/*; do echo "$(cat $t/comm)|$(cat $t/schedstat)"; done 2>/dev/null`,
    ),
  )

const readProbe = () => {
  if (!options.probe) return null
  try {
    shell("uiautomator dump /data/local/tmp/perf-ui.xml >/dev/null")
    const xml = shell("cat /data/local/tmp/perf-ui.xml")
    const node = xml
      .split("<node ")
      .find((entry) => entry.includes(`resource-id="${options.probe}"`))
    if (!node) return null
    const text = node.match(/ text="([^"]*)"/)?.[1]
    const description = node.match(/content-desc="([^"]*)"/)?.[1]
    return text || description || null
  } catch {
    return null
  }
}

const readLogcat = () => {
  if (!options.logcat) return null
  const pattern = new RegExp(options.logcat)
  return adb("logcat", "-d", "-v", "time", "-s", "ReactNativeJS:*")
    .split("\n")
    .filter((line) => pattern.test(line))
}

const startTrace = (name) => {
  const config = path.join(import.meta.dirname, "perfetto.pbtx")
  const contents = fs
    .readFileSync(config, "utf8")
    .replaceAll("__PACKAGE__", pkg)
  shell(`cat > /data/misc/perfetto-configs/perf.pbtx <<'EOF'\n${contents}\nEOF`)
  return shell(
    `perfetto --background --txt -c /data/misc/perfetto-configs/perf.pbtx -o /data/misc/perfetto-traces/${name}.pftrace`,
  ).trim()
}

const stopTrace = async (pid, name) => {
  shell(`kill ${pid}`)
  await sleep(3000)
  adb(
    "pull",
    `/data/misc/perfetto-traces/${name}.pftrace`,
    path.join(rawDir, `${name}.pftrace`),
  )
}

// hid occasionally exits right after registering; a run that ends well before
// the planned gesture length did not play it, so it is played again once.
const runGesture = (frames, screen) => {
  const local = path.join(rawDir, "gesture.json")
  fs.writeFileSync(local, toHidScript(frames, screen))
  adb("push", local, "/data/local/tmp/perf-gesture.json")
  fs.rmSync(local)
  const play = () => {
    const startedAt = performance.now()
    shell("hid /data/local/tmp/perf-gesture.json >/dev/null 2>&1")
    return Math.round(performance.now() - startedAt) - HID_OVERHEAD_MS
  }
  const planned = plannedDurationMs(frames)
  const achieved = play()
  return achieved >= planned * 0.9 ? achieved : play()
}

const viewCount = () => countHierarchyViews(shell("dumpsys activity top"), pkg)

// A cold start straight into a deep link crashes current main ("Attempted to
// navigate before mounting the Root Layout component"), so the harness starts the
// launcher activity cold and opens the URL once the app is up.
const launch = async () => {
  shell("input keyevent KEYCODE_WAKEUP")
  shell(`am force-stop ${pkg}`)
  const result = shell(`am start -W -n ${pkg}/.MainActivity`)
  await sleep(7000)
  shell(`am start -a android.intent.action.VIEW -d '${options.url}' ${pkg}`)
  await sleep(5000)
  return Number(result.match(/TotalTime:\s*(\d+)/)?.[1] ?? Number.NaN)
}

const seed = async () => {
  adb("reverse", `tcp:${options["api-port"]}`, `tcp:${options["api-port"]}`)
  const scheme = options.url.split("://")[0]
  shell(`am force-stop ${pkg}`)
  shell(
    `am start -a android.intent.action.VIEW -d '${scheme}://dev-import?token=${options["seed-token"]}' ${pkg}`,
  )
  await sleep(15000)
}

const main = async () => {
  if (options.apk) adb("install", "-r", options.apk)
  if (options["seed-token"]) await seed()

  const screen = screenSize()
  const info = deviceInfo()
  const launchMs = await launch()
  const pid = pidOf()
  if (!pid) throw new Error(`${pkg} is not running after launch`)

  save("meminfo-before.txt", shell(`dumpsys meminfo ${pkg}`))
  const viewsBefore = viewCount()

  const results = {}
  for (const name of selected) {
    const build = SCENARIOS[name]
    if (!build) throw new Error(`unknown scenario ${name}`)
    const frames = build(screen)
    const probeBefore = readProbe()
    if (options.logcat) adb("logcat", "-c")
    shell(`dumpsys gfxinfo ${pkg} reset >/dev/null`)
    const threadsBefore = threadSnapshot(pid)
    const tracePid = options.trace ? startTrace(name) : null
    const gestureMs = runGesture(frames, screen)
    await sleep(Number(options["settle-ms"]))
    const threadsAfter = threadSnapshot(pid)
    const gfxinfo = shell(`dumpsys gfxinfo ${pkg} framestats`)
    if (tracePid) await stopTrace(tracePid, name)
    save(`${name}-gfxinfo.txt`, gfxinfo)
    const logLines = readLogcat()
    if (logLines) save(`${name}-logcat.txt`, logLines.join("\n"))
    results[name] = {
      plannedGestureMs: Math.round(plannedDurationMs(frames)),
      achievedGestureMs: gestureMs,
      probeBefore,
      probeAfter: readProbe(),
      ...parseGfxinfo(gfxinfo),
      threadCpuMs: threadDeltaMs(threadsBefore, threadsAfter),
      ...(logLines ? { logcatMatches: logLines.length } : {}),
    }
    process.stdout.write(
      `${name}: ${JSON.stringify(results[name].histogram)}\n`,
    )
  }

  save("meminfo-after.txt", shell(`dumpsys meminfo ${pkg}`))
  const viewsAfter = viewCount()

  const summary = {
    label: options.label,
    url: options.url,
    package: pkg,
    recordedAt: new Date().toISOString(),
    device: info,
    launchTotalTimeMs: launchMs,
    viewsBefore,
    viewsAfter,
    scenarios: results,
  }
  fs.writeFileSync(
    path.join(outDir, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  )
  fs.writeFileSync(path.join(outDir, "summary.md"), renderMarkdown(summary))
  process.stdout.write(`\nwrote ${outDir}\n`)
}

const topThreads = (threads) =>
  Object.entries(threads)
    .slice(0, 4)
    .map(([name, ms]) => `${name} ${ms}`)
    .join(", ")

const renderMarkdown = (summary) => {
  const rows = Object.entries(summary.scenarios).map(([name, result]) => {
    const h = result.histogram
    return `| ${name} | ${h.frames} | ${h.p50Ms} | ${h.p95Ms} | ${h.p99Ms} | ${h.maxMs} | ${h.withinDeadlinePct}% | ${h.framesOver33Ms} | ${result.reported.jankyPct}% | ${result.achievedGestureMs}/${result.plannedGestureMs} | ${result.probeBefore ?? "–"} → ${result.probeAfter ?? "–"} | ${topThreads(result.threadCpuMs)} |`
  })
  return [
    `# ${summary.label}`,
    "",
    `- Device: ${summary.device.model}, Android ${summary.device.android}, ${summary.device.refreshHz} Hz, ${summary.device.size}, ${summary.device.density}`,
    `- Package: ${summary.package} ${summary.device.packageVersion ?? ""}`,
    `- URL: ${summary.url}`,
    `- Recorded: ${summary.recordedAt}`,
    `- Cold launch TotalTime: ${summary.launchTotalTimeMs} ms`,
    `- Android views in the activity: ${summary.viewsBefore} after launch, ${summary.viewsAfter} after all scenarios`,
    "",
    "| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n")
}

await main()
