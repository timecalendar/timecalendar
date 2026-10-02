/// <reference types="node" />
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import jestConfig from "./jest.config"

const root = __dirname
const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}
const packageLock = readFileSync(join(root, "package-lock.json"), "utf8")
const eslintConfig = readFileSync(join(root, "eslint.config.js"), "utf8")
const vendorName = ["calendar", "kit"].join("-")
const vendorPackage = ["@howljs", vendorName].join("/")

function productionCalendarFiles(): string[] {
  const sourceRoot = join(root, "src", "features", "calendar")
  return readdirSync(sourceRoot, { recursive: true, encoding: "utf8" })
    .filter((entry) => /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry))
    .map((entry) => join(sourceRoot, entry))
}

function compileForNativeRuntime(path: string): string {
  return execFileSync(
    process.execPath,
    [
      "-e",
      `const babel = require("@babel/core");
       const result = babel.transformFileSync(process.argv[1], {
         envName: "development",
         caller: { name: "metro", platform: "ios", isDev: true }
       });
       process.stdout.write(result.code);`,
      path,
    ],
    { cwd: root, encoding: "utf8" },
  )
}

describe("owned Calendar paging repository contract", () => {
  it("observes only the existing event target's native accessibility focus", () => {
    const moduleRoot = join(root, "modules/calendar-focus-observer")
    const ios = readFileSync(
      join(moduleRoot, "ios/CalendarFocusObserverView.swift"),
      "utf8",
    )
    const android = readFileSync(
      join(
        moduleRoot,
        "android/src/main/java/expo/modules/calendarfocusobserver/CalendarFocusObserverView.kt",
      ),
      "utf8",
    )
    const canvas = readFileSync(
      join(root, "src/features/calendar/renderer/owned-calendar-page.tsx"),
      "utf8",
    )
    expect(ios).toContain("UIAccessibility.elementFocusedNotification")
    expect(ios).toContain("UIAccessibility.focusedElementUserInfoKey")
    expect(ios).toContain("view.isDescendant(of: target)")
    expect(ios).toContain("stopObserving()")
    expect(android).toContain("requestSendAccessibilityEvent")
    expect(android).toContain("TYPE_VIEW_ACCESSIBILITY_FOCUSED")
    expect(android).toContain("child === getChildAt(0)")
    expect(android).toContain(
      "super.requestSendAccessibilityEvent(child, event)",
    )
    expect(android).not.toContain("AccessibilityService")
    expect(canvas).toContain("<CalendarFocusObserverView")
    expect(canvas).not.toContain("onFocus={")
    expect(canvas).toMatch(/<Pressable\b/g)
  })

  it("compiles the native scroll and pager owner for the native runtime", () => {
    const compiled = [
      "src/features/calendar/renderer/owned-calendar-shell.tsx",
      "src/features/calendar/renderer/owned-calendar-canvas.tsx",
      "src/features/calendar/renderer/owned-calendar-pager.ts",
      "src/features/calendar/renderer/owned-calendar-zoom.ts",
    ]
      .map(compileForNativeRuntime)
      .join("\n")
    expect(compiled).not.toContain("react-native-pager-view")
    expect(compiled).toContain("contentInsetAdjustmentBehavior")
    expect(compiled).toContain("useAnimatedScrollHandler")
    expect(compiled).toContain("scheduleOnUI")
    expect(compiled).toContain("Gesture.Pinch")
  })

  it("keeps the vendor dependency, adapter, patch, and exclusive config absent", () => {
    expect(packageJson.dependencies).not.toHaveProperty(vendorPackage)
    expect(packageJson.devDependencies).not.toHaveProperty("patch-package")
    expect(packageJson.scripts).not.toHaveProperty("postinstall")
    expect(packageLock).not.toContain(vendorPackage)
    expect(packageLock).not.toContain('"patch-package"')
    expect(existsSync(join(root, "patches"))).toBe(false)
    expect(existsSync(join(root, "jest", "calendar-kit"))).toBe(false)
    expect(jestConfig.setupFilesAfterEnv).not.toEqual(
      expect.arrayContaining([expect.stringContaining("calendar-kit")]),
    )
    expect(Object.keys(jestConfig.coverageThreshold ?? {})).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/event-adapter|event-window/),
      ]),
    )
    expect(eslintConfig).not.toContain(vendorPackage)
    expect(eslintConfig).not.toContain("calendar-kit-vendor-seam")
  })

  it("keeps one owned renderer with no vendor, fallback, or compatibility path", () => {
    const rendererRoot = join(root, "src", "features", "calendar", "renderer")
    expect(readdirSync(rendererRoot).sort()).toEqual([
      "calendar-focus-observer.tsx",
      "calendar-focus-observer.types.ts",
      "index.ts",
      "owned-calendar-canvas.tsx",
      "owned-calendar-coordinator.ts",
      "owned-calendar-header.tsx",
      "owned-calendar-page.tsx",
      "owned-calendar-pager.test.tsx",
      "owned-calendar-pager.ts",
      "owned-calendar-paging-log.ts",
      "owned-calendar-resize.test.ts",
      "owned-calendar-resize.ts",
      "owned-calendar-shell.test.tsx",
      "owned-calendar-shell.tsx",
      "owned-calendar-zoom.test.ts",
      "owned-calendar-zoom.ts",
    ])

    const sources = productionCalendarFiles()
      .map((file) => readFileSync(file, "utf8"))
      .join("\n")
    expect(sources).not.toContain(vendorPackage)
    expect(sources).not.toMatch(/fallback renderer|compatibility renderer/i)
    expect(packageJson.dependencies).toMatchObject({
      "react-native-pager-view": expect.any(String),
    })
    expect(
      existsSync(join(root, "src", "features", "calendar", "data", "week.ts")),
    ).toBe(true)
    expect(
      existsSync(
        join(root, "src", "features", "calendar", "data", "week-transition.ts"),
      ),
    ).toBe(true)
  })

  it("keeps one native vertical owner and one windowed native pager with a passive header projection", () => {
    const rendererRoot = join(root, "src/features/calendar/renderer")
    const renderer = readdirSync(rendererRoot)
      .filter((file) => /\.tsx?$/.test(file) && !file.includes(".test."))
      .map((file) => readFileSync(join(rendererRoot, file), "utf8"))
      .join("\n")
    const pager = readFileSync(
      join(rendererRoot, "owned-calendar-pager.ts"),
      "utf8",
    )
    const header = readFileSync(
      join(rendererRoot, "owned-calendar-header.tsx"),
      "utf8",
    )
    expect(renderer).not.toContain("react-native-pager-view")
    expect(renderer).toMatch(/contentInsetAdjustmentBehavior="automatic"/)
    expect(renderer.match(/<Animated\.ScrollView\s+ref=/g)).toHaveLength(2)
    expect(renderer).toMatch(/\bhorizontal\b/)
    expect(renderer).toContain("disableIntervalMomentum")
    expect(renderer).toContain("snapToInterval")
    expect(renderer.match(/\.disallowInterruption\(true\)/g)).toHaveLength(2)
    expect(pager).toContain("useAnimatedScrollHandler")
    expect(pager).toContain("onMomentumEnd")
    expect(pager).toContain("scheduleOnRN(onSettle")
    expect(pager).toContain("mountedPageIndexes")
    expect(pager).toContain("planPageRebase")
    expect(pager).not.toMatch(/generation|revision|epoch/i)
    expect(header).toContain("translateX: -scrollX.get()")
    expect(header).toContain('testID="owned-calendar-date-header-strip"')
    expect(header).toContain('overflow: "hidden"')
    expect(header).toContain('committed ? "auto" : "no-hide-descendants"')
    expect(renderer).not.toMatch(
      /PanGestureHandler|Animated\.timing|setInterval|setTimeout|runOnJS|import\s*\{[^}]*\bAnimated\b[^}]*\}\s*from "react-native"/,
    )
    expect(renderer).not.toMatch(/\buseCallback\b/)
    const motionSources = [
      "owned-calendar-canvas.tsx",
      "owned-calendar-coordinator.ts",
      "owned-calendar-page.tsx",
      "owned-calendar-pager.ts",
      "owned-calendar-zoom.ts",
    ]
      .map((file) => readFileSync(join(rendererRoot, file), "utf8"))
      .join("\n")
    expect(motionSources).not.toMatch(/\buseMemo\b/)

    const zoom = readFileSync(
      join(rendererRoot, "owned-calendar-zoom.ts"),
      "utf8",
    )
    expect(zoom).toContain("Gesture.Pinch()")
    expect(zoom).toContain("useAnimatedScrollHandler")
    expect(zoom).toContain("useAnimatedReaction")
    expect(zoom).toContain("useSharedValue")
    expect(zoom).toContain("scheduleOnRN")
    expect(zoom).not.toMatch(/\buseState\b|\brunOnJS\b|generation/)
  })

  it("pins bounded local presentation and original-identity activation", () => {
    const dataRoot = join(root, "src/features/calendar/data")
    const required = [
      "event-decoder.ts",
      "event-color.ts",
      "event-title.ts",
      "overlap-layout.ts",
      "page-presentation.ts",
      "page-presenter.ts",
      "timed-support.ts",
      "timeline-geometry.ts",
      "timeline-presentation.ts",
    ]
    for (const file of required) {
      expect(existsSync(join(dataRoot, file))).toBe(true)
    }

    const presentation = readFileSync(
      join(dataRoot, "timeline-presentation.ts"),
      "utf8",
    )
    const hook = readFileSync(join(dataRoot, "page-presenter.ts"), "utf8")
    const renderer = [
      "owned-calendar-canvas.tsx",
      "owned-calendar-page.tsx",
      "owned-calendar-shell.tsx",
    ]
      .map((file) =>
        readFileSync(
          join(root, "src/features/calendar/renderer", file),
          "utf8",
        ),
      )
      .join("\n")
    const navigationBoundary = [presentation, hook, renderer].join("\n")
    const overlap = readFileSync(join(dataRoot, "overlap-layout.ts"), "utf8")

    expect(presentation).toContain("shape: support.shape")
    expect(presentation).toContain("resolveEventAppearance")
    expect(presentation).toContain("placeDayTiles")
    expect(presentation).toContain("layoutOverlaps")
    expect(presentation).not.toContain("localeCompare")
    expect(overlap).not.toMatch(/\bindex\b|\btitle\b|localeCompare/)
    expect(renderer).not.toContain("layoutOverlaps")
    expect(renderer).not.toMatch(/\.sort\(/)
    expect(renderer).not.toMatch(/@\/db|useCalendarEventsSnapshot/)
    expect(renderer).not.toMatch(/MAX_(?:EVENT|DENSITY)|eventLimit|slice\(0,/)
    expect(hook).not.toMatch(/\buseMemo\b|\buseCallback\b/)
    expect(renderer).toContain("onEventPress(tile.identity.uid)")
    expect(renderer).toContain("planTargetConflicts")
    expect(renderer).toContain("accessibilityViewIsModal")
    expect(renderer).toContain("component.items.length > 1")
    expect(renderer).toContain("accessibilityElementsHidden")
    expect(renderer).toContain("isEventActivationBlocked")
    expect(renderer).toContain('tile.shape !== "interval"')
    expect(renderer).toContain("minimumTarget")
    expect(renderer).not.toMatch(/onEventPress\([^)]*(?:index|direction|key)/)
    expect(navigationBoundary).not.toMatch(
      /@\/api|generated\/|customFetch|fetch\(|useSyncCalendars|syncCalendars/,
    )
  })

  it("keeps one committed-page event tree and bounded identity focus refs", () => {
    const rendererRoot = join(root, "src/features/calendar/renderer")
    const canvas = readFileSync(
      join(rendererRoot, "owned-calendar-canvas.tsx"),
      "utf8",
    )
    const page = readFileSync(
      join(rendererRoot, "owned-calendar-page.tsx"),
      "utf8",
    )
    const shell = readFileSync(
      join(rendererRoot, "owned-calendar-shell.tsx"),
      "utf8",
    )
    const projection = readFileSync(
      join(root, "src/features/calendar/data/accessibility-projection.ts"),
      "utf8",
    )

    expect(page).toContain("if (!committed)")
    expect(page).toContain("<StaticCalendarTile")
    expect(page).toContain("accessibilityElementsHidden={!committed}")
    expect(page).toContain('importantForAccessibility="no-hide-descendants"')
    expect(page).toContain("memo(function CalendarPage")
    expect(canvas).toContain("removeClippedSubviews={false}")
    expect(page.match(/<Pressable\b/g)?.length).toBe(2)
    expect(shell.match(/<Pressable\b/g)?.length).toBe(2)
    expect(shell.match(/<Modal\b/g)?.length).toBe(1)
    expect(shell).toContain(
      "type FocusTarget = { node: View; dateKey: string; minute: number }",
    )
    expect(shell).toContain("new Map<string, FocusTarget>()")
    expect(shell).toContain("coordinator.scrollRef.current?.scrollTo")
    expect(shell).toContain("AccessibilityInfo.setAccessibilityFocus")
    expect(projection).toContain("entries.sort(compareEntries)")
    expect([canvas, page, shell, projection].join("\n")).not.toMatch(
      /experimental_accessibilityOrder|accessibilityOrder=|<FlatList\b|<SectionList\b/,
    )
  })

  it("scopes the displayed-precision clock and bans continuous calendar work", () => {
    const calendarRoot = join(root, "src/features/calendar")
    const productionFiles = productionCalendarFiles()
    const timerOwners = productionFiles
      .filter((file) =>
        /\bset(?:Timeout|Interval)\s*\(/.test(readFileSync(file, "utf8")),
      )
      .map((file) => file.slice(calendarRoot.length + 1))

    expect(timerOwners).toEqual(["data/clock.ts"])

    const clock = readFileSync(join(calendarRoot, "data/clock.ts"), "utf8")
    expect(clock).toContain("useFocusEffect")
    expect(clock).toContain('AppState.currentState === "active"')
    expect(clock).toContain('AppState.addEventListener("change"')
    expect(clock).toContain("MINUTE_MS + BOUNDARY_GUARD_MS")
    expect(clock).toContain("Date.now() % MINUTE_MS")
    expect(clock).toContain("clearTimeout(timer)")
    expect(clock).not.toContain("setInterval")

    for (const file of productionFiles) {
      const source = readFileSync(file, "utf8")
      expect(source).not.toContain("withRepeat")
      expect(source).not.toMatch(
        /requestAnimationFrame\(\s*([A-Za-z_$][\w$]*)\s*\)/,
      )
      expect(source).not.toMatch(/withTiming\([^)]*\)[\s\S]{0,120}withTiming\(/)
    }
  })

  it("keeps view and weekend persistence in the typed settings and storage seams", () => {
    const week = readFileSync(
      join(root, "src/features/calendar/data/week.ts"),
      "utf8",
    )
    const settingsStore = readFileSync(
      join(root, "src/features/settings/prefs/store.ts"),
      "utf8",
    )
    const settingsHooks = readFileSync(
      join(root, "src/features/settings/prefs/hooks.ts"),
      "utf8",
    )
    const storage = readFileSync(join(root, "src/storage/index.ts"), "utf8")
    const settingsTypes = readFileSync(
      join(root, "src/features/settings/prefs/types.ts"),
      "utf8",
    )
    const transition = readFileSync(
      join(root, "src/features/calendar/data/week-transition.ts"),
      "utf8",
    )

    expect(week).toContain("startOfWeekInZone(anchor, zone, firstWeekday)")
    expect(week).toMatch(/weekday === 0 \|\| weekday === 6/)
    expect(settingsStore).toContain("getBoolean(SETTINGS_KEYS.showWeekends)")
    expect(settingsStore).toContain("setBoolean(SETTINGS_KEYS.showWeekends")
    expect(settingsHooks).toContain(
      "useStoredBoolean(SETTINGS_KEYS.showWeekends)",
    )
    expect(storage).toContain(
      '[STORAGE_KEYS.showWeekends]: "environment-independent"',
    )
    expect(settingsTypes).toContain(
      'export type CalendarView = "day" | "week" | "agenda"',
    )
    expect(settingsStore).toContain("getCalendarView")
    expect(settingsStore).toContain("setCalendarView")
    expect(settingsHooks).toContain("useCalendarViewPreference")
    expect(storage).toContain(
      '[STORAGE_KEYS.calendarView]: "environment-independent"',
    )
    expect(settingsStore).toContain("getCalendarZoomPixelsPerHour")
    expect(settingsStore).toContain("setCalendarZoomPixelsPerHour")
    expect(settingsHooks).toContain("useCalendarZoomPreference")
    expect(storage).toContain(
      '[STORAGE_KEYS.calendarZoomPixelsPerHour]: "environment-independent"',
    )
    expect(transition).toContain('mode === "day"')
    expect(transition).not.toMatch(/86_?400_?000|24\s*\*\s*60\s*\*\s*60/)

    for (const source of productionCalendarFiles().map((file) =>
      readFileSync(file, "utf8"),
    )) {
      expect(source).not.toContain("react-native-mmkv")
    }
  })

  it("pins the three journeys and retained Agenda helper", () => {
    const maestroRoot = join(root, ".maestro")
    const topLevel = readdirSync(maestroRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
      .map((entry) => entry.name)
      .sort()

    expect(topLevel).toEqual([
      "01-fresh-user-import.yaml",
      "02-personal-event.yaml",
      "03-calendar-visibility.yaml",
    ])
    expect(
      existsSync(join(maestroRoot, "helpers", "open-calendar-agenda.yaml")),
    ).toBe(true)
  })
})
