#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { parseGfxinfo, hierarchyViewClasses } from "./lib/gfxinfo.mjs"
import {
  boundsCenter,
  convertedPageIndex,
  menuItemPoint,
  observeCalendarUi,
  selectedCalendarView,
  targetPageFromUi,
} from "./lib/calendar-ui.mjs"
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
  parseMountedModes,
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
    "mode-switch-interval": { type: "string", default: "60" },
  },
})
const usage = `Usage: node perf/soak.mjs --mode soak|stress --revision <full git SHA> --apk <built APK> [--serial SERIAL] [--out DIR] [--label LABEL] [--dry-run]
soak: 500 observed adjacent page crossings in one app process (maximum 1000 swipes).
stress: 30 minutes of paging, vertical scrolling, pinch, and observed Day/Week switching in one app process.
--mode-switch-interval 0 disables switching and leaves mode coverage unknown.
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
const modeSwitchInterval = Number(options["mode-switch-interval"])
if (
  !Number.isInteger(modeSwitchInterval) ||
  modeSwitchInterval < 0 ||
  (modeSwitchInterval !== 0 && modeSwitchInterval % 6 !== 0)
)
  throw new Error("mode-switch-interval must be zero or a positive multiple of six")
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
        modeSwitchInterval:
          options.mode === "stress" ? modeSwitchInterval : null,
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
const localeDirectory = new URL("../src/i18n/locales/", import.meta.url)
const viewLabels = Object.fromEntries(
  fs.readdirSync(localeDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const messages = JSON.parse(
        fs.readFileSync(new URL(name, localeDirectory), "utf8"),
      )
      return [
        name.slice(0, -5),
        {
          day: messages["calendar.view.day"],
          week: messages["calendar.view.week"],
        },
      ]
    }),
)
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
  const viewClasses = hierarchyViewClasses(activity, pkg)
  const result = {
    name,
    at: new Date().toISOString(),
    views:
      viewClasses === null
        ? null
        : Object.values(viewClasses).reduce((total, count) => total + count, 0),
    viewClasses,
    memory: parseMemory(mem),
    frames: parseGfxinfo(gfx),
  }
  shell("dumpsys", "gfxinfo", pkg, "reset")
  return result
}
const uiDump = (name) => {
  const remote = "/data/local/tmp/perf-soak-ui.xml"
  shell("uiautomator", "dump", remote)
  const xml = shell("cat", remote)
  save(`${name}-ui.xml`, xml)
  return xml
}
const tap = ({ x, y }) => shell("input", "tap", String(x), String(y))
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
    modeSwitchInterval: options.mode === "stress" ? modeSwitchInterval : null,
  },
  startedAt: new Date().toISOString(),
  initialPid: null,
  initialProcessStart: null,
  attempts: [],
  samples: [],
  checkpoints: [],
  modeSwitches: [],
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
  let observedMode = null
  let modeEpoch = 0
  const takeFreshLogs = () => {
    const fresh = logCursor.take()
    const fatal = fresh.filter((line) =>
      /FATAL EXCEPTION|Fatal signal|am_crash|ReactNativeJS.*(?:Error:|Unhandled|Exception:)/.test(
        line,
      ),
    )
    if (fatal.length) throw new Error(`crash/error in app logcat: ${fatal[0]}`)
    return fresh
  }
  const readNewLogs = (direction = null) => {
    const fresh = takeFreshLogs()
    const modes = parseMountedModes(fresh)
    if (modes.some((mode) => observedMode !== null && mode !== observedMode))
      throw new Error("mode changed outside an observed switch")
    if (observedMode === null && modes.length > 0) observedMode = modes.at(-1)
    const settles = parseSettles(fresh)
    state = accountSettles(state, settles, direction)
    return settles
  }
  const initialSettles = readNewLogs()
  const initialView = selectedCalendarView(uiDump("initial"), viewLabels, screen)
  if (initialView === null)
    throw new Error("Calendar mode control not observed after launch")
  if (observedMode !== null && observedMode !== initialView.mode)
    throw new Error("native mount mode disagrees with Calendar view control")
  observedMode = initialView.mode
  summary.initialMode = observedMode
  summary.baselinePage = state.page
  summary.samples.push(sample("0000", originalPid, originalStart))
  const recordCheckpoint = (crossings, settledThisAttempt) => {
    const name = `return-${String(crossings).padStart(4, "0")}`
    const beforeXml = uiDump(`${name}-before`)
    const beforeSelection = selectedCalendarView(beforeXml, viewLabels, screen)
    if (observedMode === null && beforeSelection !== null)
      observedMode = beforeSelection.mode
    const mode = observedMode
    const before = observeCalendarUi(beforeXml, mode, state.page, viewLabels, screen)
    const measured = sample(name, originalPid, originalStart)
    measured.crossings = state.crossings
    summary.samples.push(measured)
    const after = observeCalendarUi(
      uiDump(`${name}-after`),
      mode,
      state.page,
      viewLabels,
      screen,
    )
    checkProcess(originalPid, originalStart)
    const witness = {
      matched:
        settledThisAttempt &&
        before.matched &&
        after.matched &&
        before.locale === after.locale &&
        before.dateKeys.join("|") === after.dateKeys.join("|"),
      mode: after.mode,
      locale: after.locale,
      dateKeys: after.dateKeys,
    }
    summary.checkpoints.push({
      crossings,
      mode,
      modeEpoch,
      page: state.page,
      views: measured.views,
      sample: name,
      witness,
    })
    write()
  }
  const openModeMenu = async (selected, target, name) => {
    tap(boundsCenter(selected.bounds, screen))
    await sleep(400)
    return menuItemPoint(
      uiDump(`${name}-menu`),
      viewLabels[selected.locale][target],
      screen,
    )
  }
  const pollTargetWitness = async (name, from, sourcePage, target) => {
    let mountedTarget = false
    let modeBaseline = null
    let previousFingerprint = null
    for (let poll = 0; poll < 8; poll++) {
      await sleep(500)
      checkProcess(originalPid, originalStart)
      const fresh = takeFreshLogs()
      mountedTarget ||= parseMountedModes(fresh).includes(target)
      const witnessed = targetPageFromUi(
        uiDump(`${name}-after-${poll}`),
        from,
        sourcePage,
        target,
        viewLabels,
        screen,
      )
      const fingerprint = witnessed
        ? `${witnessed.page}|${witnessed.locale}|${witnessed.dateKeys.join("|")}`
        : null
      if (
        mountedTarget &&
        fingerprint !== null &&
        fingerprint === previousFingerprint
      ) {
        modeBaseline = witnessed
        break
      }
      previousFingerprint = fingerprint
    }
    return { mountedTarget, modeBaseline }
  }
  const switchMode = async (afterAttempt) => {
    readNewLogs()
    const name = `mode-${String(summary.modeSwitches.length + 1).padStart(2, "0")}`
    const beforeXml = uiDump(`${name}-before`)
    const selected = selectedCalendarView(beforeXml, viewLabels, screen)
    const target = selected?.mode === "week" ? "day" : "week"
    const expectedTargetPage = selected && convertedPageIndex(
      selected.mode,
      state.page,
      target,
    )
    const sourceWitness = selected && observeCalendarUi(
      beforeXml,
      selected.mode,
      state.page,
      viewLabels,
      screen,
    )
    const sourcePage = state.page
    const failSwitch = (reason) => {
      summary.modeSwitches.push({
        afterAttempt,
        from: selected?.mode ?? null,
        to: selected ? target : null,
        sourcePage,
        expectedTargetPage,
        observedMode: null,
        verified: false,
        reason,
      })
      write()
      throw new Error(reason)
    }
    if (sourceWitness?.matched !== true)
      failSwitch("source Calendar page not witnessed before switch")
    if (observedMode !== null && observedMode !== selected.mode)
      failSwitch("Calendar mode control disagrees with native mounts")
    if (expectedTargetPage === null)
      failSwitch("cannot convert witnessed source page")
    observedMode = selected.mode
    const option = await openModeMenu(selected, target, name)
    if (option === null) failSwitch("target mode menu item not observed")
    readNewLogs()
    if (state.page !== sourcePage)
      failSwitch("source page moved while mode menu was open")
    tap(option)
    const { mountedTarget, modeBaseline } = await pollTargetWitness(
      name,
      selected.mode,
      sourcePage,
      target,
    )
    const verified = mountedTarget && modeBaseline !== null
    summary.modeSwitches.push({
      afterAttempt,
      from: selected.mode,
      to: target,
      observedMode: modeBaseline?.mode ?? null,
      mountedTarget,
      sourcePage,
      expectedTargetPage,
      modeBaselinePage: modeBaseline?.page ?? null,
      modeBaselineSource: modeBaseline ? "stable-visible-date-header" : null,
      crossings: state.crossings,
      verified,
    })
    if (!verified)
      throw new Error("mode transition lacks the expected stable UI page")
    observedMode = target
    modeEpoch += 1
    state = { page: modeBaseline.page, crossings: state.crossings }
    const measured = sample(name, originalPid, originalStart)
    measured.crossings = state.crossings
    summary.samples.push(measured)
    write()
  }
  const started = performance.now()
  let lastSample = started
  if (options.mode === "soak" && state.page !== null) {
    recordCheckpoint(0, initialSettles.at(-1) === state.page)
    lastSample = performance.now()
  }
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
    const settles = readNewLogs(
      kind === "forward" ? 1 : kind === "back" ? -1 : null,
    )
    if (neededBaseline && state.page !== null) {
      summary.baselinePage = state.page
      if (options.mode === "soak") {
        recordCheckpoint(0, settles.at(-1) === state.page)
        lastSample = performance.now()
      }
    }
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
      mode: observedMode,
    })
    if (
      options.mode === "soak" &&
      state.crossings > 0 &&
      state.crossings % 100 === 0 &&
      summary.checkpoints.at(-1)?.crossings !== state.crossings
    ) {
      recordCheckpoint(state.crossings, settles.at(-1) === state.page)
      lastSample = performance.now()
    }
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
    if (
      options.mode === "stress" &&
      modeSwitchInterval > 0 &&
      (attempt + 1) % modeSwitchInterval === 0
    ) {
      await switchMode(attempt + 1)
      lastSample = performance.now()
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
    checkpoints: summary.checkpoints,
    modeSwitches: summary.modeSwitches,
    attempts: summary.attempts,
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
