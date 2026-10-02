#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { countHierarchyViews, parseGfxinfo } from "./lib/gfxinfo.mjs"
import {
  HID_OVERHEAD_MS,
  pinch,
  plannedDurationMs,
  swipeChain,
  toHidScript,
  verticalScroll,
} from "./lib/gestures.mjs"
import {
  accountSettles,
  createLogCursor,
  evaluate,
  parseMemory,
  parseProcessStart,
  parseSettles,
  SOAK_TARGET,
  STRESS_DURATION_MS,
  VIEW_TOLERANCE,
  DIAGNOSTIC_HEAP_GROWTH_BYTES,
  DIAGNOSTIC_HEAP_GROWTH_RATIO,
} from "./lib/soak.mjs"

const { values: options } = parseArgs({
  options: {
    help: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    mode: { type: "string", default: "soak" },
    serial: { type: "string", default: process.env.ANDROID_SERIAL ?? "" },
    package: { type: "string", default: "fr.samuelprak.timecalendar.perf" },
    url: {
      type: "string",
      default: "timecalendar-perf://calendar?focusDate=2026-10-05",
    },
    apk: { type: "string" },
    revision: { type: "string" },
    out: { type: "string", default: "perf/out" },
    label: { type: "string", default: "soak" },
    "settle-ms": { type: "string", default: "700" },
  },
})
const usage = `Usage: node perf/soak.mjs --mode soak|stress --revision <full git SHA> --apk <built APK> [--serial SERIAL] [--out DIR] [--label LABEL] [--dry-run]
soak: 500 observed adjacent page crossings in one app process (maximum 1000 swipes).
stress: 30 minutes of paging, vertical scrolling, and pinch in one app process.
Neither --help nor --dry-run contacts a device or inspects the APK.\n`
if (options.help) {
  process.stdout.write(usage)
  process.exit(0)
}
if (!["soak", "stress"].includes(options.mode))
  throw new Error("mode must be soak or stress")
if (!/^[0-9a-f]{40}$/.test(options.revision ?? ""))
  throw new Error("--revision must be a full git SHA")
if (!options.apk) throw new Error("--apk is required for exact build identity")
if (!/^[a-zA-Z0-9._]+$/.test(options.package))
  throw new Error("invalid package")
if (!/^[\w.-]+$/.test(options.label) || !/^[\w.-]*$/.test(options.serial))
  throw new Error("invalid label or serial")
const settleMs = Number(options["settle-ms"])
if (!Number.isInteger(settleMs) || settleMs < 100 || settleMs > 10000)
  throw new Error("invalid settle-ms")
if (options["dry-run"]) {
  process.stdout.write(
    JSON.stringify(
      {
        mode: options.mode,
        target:
          options.mode === "soak"
            ? `${SOAK_TARGET} observed crossings`
            : `${STRESS_DURATION_MS / 60000} minutes`,
        revision: options.revision,
        apk: options.apk,
        package: options.package,
        serial: options.serial || null,
        output: path.join(options.out, options.label),
      },
      null,
      2,
    ) + "\n",
  )
  process.exit(0)
}
const checkoutRevision = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim()
if (checkoutRevision !== options.revision)
  throw new Error(
    `checkout ${checkoutRevision} differs from --revision ${options.revision}`,
  )
const apkSha256 = createHash("sha256")
  .update(fs.readFileSync(options.apk))
  .digest("hex")
const outDir = path.resolve(options.out, options.label)
const rawDir = path.join(outDir, "raw")
fs.mkdirSync(rawDir, { recursive: true })
const adb = (...args) =>
  execFileSync(
    "adb",
    [...(options.serial ? ["-s", options.serial] : []), ...args],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  )
const shell = (...args) => adb("shell", ...args)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const save = (name, text) => fs.writeFileSync(path.join(rawDir, name), text)
const pkg = options.package
const screenText = shell("wm", "size")
const screenMatch = screenText.match(/(?:Override|Physical) size: (\d+)x(\d+)/)
if (!screenMatch) throw new Error("cannot read screen size")
const screen = { width: Number(screenMatch[1]), height: Number(screenMatch[2]) }
const device = {
  model: shell("getprop", "ro.product.model").trim(),
  android: shell("getprop", "ro.build.version.release").trim(),
  build: shell("getprop", "ro.build.display.id").trim(),
  serial: options.serial || adb("get-serialno").trim(),
  refreshHz:
    Number(
      shell("dumpsys", "SurfaceFlinger").match(
        /refresh-rate\s*:\s*([\d.]+)/,
      )?.[1],
    ) || null,
}
const packageDump = shell("dumpsys", "package", pkg)
save("package-before.txt", packageDump)
const packageVersion = packageDump.match(/versionName=(\S+)/)?.[1] ?? null
const packageCode = packageDump.match(/versionCode=(\d+)/)?.[1] ?? null
const installedApkPaths = shell("pm", "path", pkg)
save("installed-apk-paths.txt", installedApkPaths)
const mainApk =
  installedApkPaths.match(/^package:(\S+base\.apk)$/m)?.[1] ??
  installedApkPaths.match(/^package:(\S+)$/m)?.[1]
if (!mainApk) throw new Error("cannot locate installed APK")
const installedSha256 = shell("sha256sum", mainApk).trim().split(/\s+/)[0]
if (installedSha256 !== apkSha256)
  throw new Error(
    `installed APK hash ${installedSha256} differs from supplied APK ${apkSha256}`,
  )
const pid = () => shell("pidof", pkg).trim().split(/\s+/)[0] || null
const processStart = (id) => parseProcessStart(shell("cat", `/proc/${id}/stat`))
const checkProcess = (originalPid, originalStart) => {
  const current = pid()
  if (
    !current ||
    current !== originalPid ||
    processStart(current) !== originalStart
  )
    throw new Error(
      `process restarted or exited: original ${originalPid}, now ${current ?? "none"}`,
    )
}
const sample = (name, originalPid, originalStart) => {
  checkProcess(originalPid, originalStart)
  const mem = shell("dumpsys", "meminfo", pkg)
  const activity = shell("dumpsys", "activity", "top")
  const gfx = shell("dumpsys", "gfxinfo", pkg, "framestats")
  save(`${name}-meminfo.txt`, mem)
  save(`${name}-activity.txt`, activity)
  save(`${name}-gfxinfo.txt`, gfx)
  const result = {
    name,
    at: new Date().toISOString(),
    views: countHierarchyViews(activity, pkg),
    memory: parseMemory(mem),
    frames: parseGfxinfo(gfx),
  }
  shell("dumpsys", "gfxinfo", pkg, "reset")
  return result
}
const play = (frames) => {
  const local = path.join(rawDir, "gesture.json")
  fs.writeFileSync(local, toHidScript(frames, screen))
  adb("push", local, "/data/local/tmp/perf-soak-gesture.json")
  fs.rmSync(local)
  const begin = performance.now()
  shell("hid", "/data/local/tmp/perf-soak-gesture.json")
  const achievedMs = Math.round(performance.now() - begin) - HID_OVERHEAD_MS
  if (achievedMs < plannedDurationMs(frames) * 0.9)
    throw new Error(`gesture ended early: ${achievedMs} ms`)
  return achievedMs
}
const gesture = (kind) =>
  kind === "pinch"
    ? pinch(screen, { durationMs: 3000, minGap: 250, maxGap: 900 })
    : kind === "vertical"
      ? verticalScroll(screen, { count: 2, strokeMs: 150, gapMs: 300 })
      : swipeChain(screen, { directions: [kind], strokeMs: 150, gapMs: 150 })

const summary = {
  mode: options.mode,
  status: "running",
  revision: options.revision,
  apkSha256,
  installedSha256,
  package: pkg,
  packageVersion,
  packageCode,
  url: options.url,
  device,
  thresholds: {
    crossings: SOAK_TARGET,
    stressDurationMs: STRESS_DURATION_MS,
    viewTolerance: VIEW_TOLERANCE,
    diagnosticHeapGrowthBytes: DIAGNOSTIC_HEAP_GROWTH_BYTES,
    diagnosticHeapGrowthRatio: DIAGNOSTIC_HEAP_GROWTH_RATIO,
  },
  startedAt: new Date().toISOString(),
  initialPid: null,
  initialProcessStart: null,
  attempts: [],
  samples: [],
  failures: [],
  metrics: null,
  baselinePage: null,
}
const write = () =>
  fs.writeFileSync(
    path.join(outDir, "summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
  )
let exitCode = 1
let logProcess = null
let stoppingCapture = false
try {
  shell("input", "keyevent", "KEYCODE_WAKEUP")
  adb("logcat", "-c")
  shell("am", "force-stop", pkg)
  shell("am", "start", "-W", "-n", `${pkg}/.MainActivity`)
  await sleep(7000)
  shell(
    "am",
    "start",
    "-a",
    "android.intent.action.VIEW",
    "-d",
    options.url,
    pkg,
  )
  await sleep(5000)
  const originalPid = pid()
  if (!originalPid) throw new Error("app did not start")
  const originalStart = processStart(originalPid)
  if (!originalStart) throw new Error("cannot identify process start")
  summary.initialPid = originalPid
  summary.initialProcessStart = originalStart
  adb("logcat", "-c")
  const logCursor = createLogCursor()
  logProcess = spawn(
    "adb",
    [
      ...(options.serial ? ["-s", options.serial] : []),
      "logcat",
      `--pid=${originalPid}`,
      "-v",
      "time",
      "-s",
      "ReactNativeJS:*",
      "AndroidRuntime:E",
      "libc:F",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  )
  const logErrors = []
  logProcess.stdout.on("data", (chunk) => {
    try {
      fs.appendFileSync(path.join(rawDir, "app-logcat.txt"), chunk)
      logCursor.feed(chunk.toString("utf8"))
    } catch (error) {
      logCursor.fail(String(error))
    }
  })
  logProcess.stderr.on("data", (chunk) =>
    logErrors.push(chunk.toString("utf8")),
  )
  logProcess.on("error", (error) => logCursor.fail(String(error)))
  logProcess.on("exit", (code, signal) => {
    if (!stoppingCapture)
      logCursor.fail(
        `app PID capture exited ${code ?? signal}: ${logErrors.join("")}`,
      )
  })
  await sleep(300)
  let state = { page: null, crossings: 0 }
  const readNewLogs = (direction = null) => {
    const fresh = logCursor.take()
    const fatal = fresh.filter((line) =>
      /FATAL EXCEPTION|Fatal signal|am_crash|ReactNativeJS.*(?:Error:|Unhandled|Exception:)/.test(
        line,
      ),
    )
    if (fatal.length) throw new Error(`crash/error in app logcat: ${fatal[0]}`)
    state = accountSettles(state, parseSettles(fresh), direction)
  }
  readNewLogs()
  summary.baselinePage = state.page
  summary.samples.push(sample("0000", originalPid, originalStart))
  const started = performance.now()
  let lastSample = started
  const maxAttempts = options.mode === "soak" ? SOAK_TARGET * 2 : Infinity
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const elapsed = performance.now() - started
    if (options.mode === "soak" && state.crossings >= SOAK_TARGET) break
    if (options.mode === "stress" && elapsed >= STRESS_DURATION_MS) break
    const kind =
      options.mode === "soak"
        ? Math.floor(state.crossings / 50) % 2
          ? "back"
          : "forward"
        : ["forward", "forward", "back", "vertical", "pinch", "back"][
            attempt % 6
          ]
    const before = state.crossings
    const neededBaseline = state.page === null
    const achievedMs = play(gesture(kind))
    await sleep(settleMs)
    checkProcess(originalPid, originalStart)
    readNewLogs(kind === "forward" ? 1 : kind === "back" ? -1 : null)
    if (neededBaseline && state.page !== null) summary.baselinePage = state.page
    if (neededBaseline && state.page === null)
      summary.failures.push(
        `attempt ${attempt + 1}: no settled baseline observed`,
      )
    if ((kind === "vertical" || kind === "pinch") && state.crossings !== before)
      summary.failures.push(`attempt ${attempt + 1}: ${kind} changed page`)
    if (
      !neededBaseline &&
      (kind === "forward" || kind === "back") &&
      state.crossings === before
    )
      summary.failures.push(
        `attempt ${attempt + 1}: ${kind} produced no observed crossing`,
      )
    summary.attempts.push({
      index: attempt + 1,
      kind,
      achievedMs,
      crossings: state.crossings,
      page: state.page,
    })
    if (
      state.crossings - (summary.samples.at(-1)?.crossings ?? 0) >= 25 ||
      performance.now() - lastSample >= 60000
    ) {
      const next = sample(
        String(summary.samples.length).padStart(4, "0"),
        originalPid,
        originalStart,
      )
      next.crossings = state.crossings
      summary.samples.push(next)
      lastSample = performance.now()
      write()
    }
  }
  readNewLogs()
  const end = sample("final", originalPid, originalStart)
  end.crossings = state.crossings
  summary.samples.push(end)
  summary.crossings = state.crossings
  summary.elapsedMs = Math.round(performance.now() - started)
  summary.metrics = evaluate({
    mode: options.mode,
    elapsedMs: summary.elapsedMs,
    state,
    samples: summary.samples,
    frameWindows: summary.samples.slice(1).map((s) => s.frames),
    failures: summary.failures,
  })
  summary.status = summary.metrics.status
  exitCode = summary.status === "pass" ? 0 : 1
} catch (error) {
  summary.failures.push(String(error))
  summary.status = "fail"
} finally {
  stoppingCapture = true
  logProcess?.kill()
  summary.finishedAt = new Date().toISOString()
  write()
  process.stdout.write(
    `${summary.status}: ${summary.crossings ?? "unknown"} observed crossings; evidence ${outDir}\n`,
  )
  process.exitCode = exitCode
}
