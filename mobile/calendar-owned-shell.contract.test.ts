/// <reference types="node" />
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import jestConfig from "./jest.config"
import {
  MOUNTED_PAGE_RADIUS,
  PAGE_REBASE_MARGIN,
  PAGE_WINDOW_RADIUS,
} from "./src/features/calendar/data/page-window"

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

const rendererRoot = join(root, "src", "features", "calendar", "renderer")

function rendererSource(file: string): string {
  return readFileSync(join(rendererRoot, file), "utf8")
}

function rendererSources(): string {
  return readdirSync(rendererRoot)
    .filter((file) => /\.tsx?$/.test(file) && !file.includes(".test."))
    .map(rendererSource)
    .join("\n")
}

function topLevelFunction(source: string, name: string): string {
  const start = source.indexOf(`\nfunction ${name}(`)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = source.indexOf("\n}\n", start)
  return source.slice(start, end + 2)
}

/** The source between `name(` and its matching closing parenthesis. */
function callArguments(source: string, name: string): string {
  const open = source.indexOf(`${name}(`) + name.length
  expect(open).toBeGreaterThan(name.length - 1)
  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "(") depth += 1
    if (source[index] === ")") depth -= 1
    if (depth === 0) return source.slice(open + 1, index)
  }
  throw new Error(`Unclosed call to ${name}`)
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
    expect(ios).toContain('"pageKey": pageKey')
    expect(android).toContain("requestSendAccessibilityEvent")
    expect(android).toContain("TYPE_VIEW_ACCESSIBILITY_FOCUSED")
    expect(android).toContain("child === getChildAt(0)")
    expect(android).toContain('"pageKey" to pageKey')
    expect(android).toContain(
      "super.requestSendAccessibilityEvent(child, event)",
    )
    expect(android).not.toContain("AccessibilityService")
    expect(canvas).toContain("<CalendarFocusObserverView")
    expect(canvas).toContain("pageKey={pageKey}")
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
    expect(readdirSync(rendererRoot).sort()).toEqual([
      "calendar-focus-observer.tsx",
      "calendar-focus-observer.types.ts",
      "index.ts",
      "owned-calendar-canvas.tsx",
      "owned-calendar-chooser.tsx",
      "owned-calendar-coordinator.ts",
      "owned-calendar-focus.ts",
      "owned-calendar-geometry.ts",
      "owned-calendar-header.tsx",
      "owned-calendar-page.tsx",
      "owned-calendar-pager-generation.test.tsx",
      "owned-calendar-pager-rest.test.tsx",
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

  it("keeps one native vertical owner and one windowed native horizontal pager", () => {
    const canvas = rendererSource("owned-calendar-canvas.tsx")
    const pagerView = topLevelFunction(canvas, "HorizontalPagerView")
    const renderer = rendererSources()

    expect(renderer.match(/<Animated\.ScrollView\s+ref=/g)).toHaveLength(2)
    expect(renderer.match(/^\s+horizontal$/gm)).toHaveLength(1)
    expect(pagerView).toMatch(/^\s+horizontal$/m)
    expect(canvas).toMatch(/<HorizontalPagerView\s+key=\{pager\.spaceKey\}/)
    expect(renderer).toMatch(/contentInsetAdjustmentBehavior="automatic"/)
    expect(canvas).toContain('const IS_IOS = Platform.OS === "ios"')
    expect(canvas).toContain('const IS_ANDROID = Platform.OS === "android"')
    expect(pagerView).toContain("pagingEnabled={IS_IOS}")
    expect(pagerView).toContain("snapToInterval={IS_ANDROID ? pager.pageWidth")
    expect(pagerView).toContain("disableIntervalMomentum")
    expect(pagerView).toContain("onScroll={pager.scrollHandler}")
    expect(pagerView).toContain(
      "onContentSizeChange={pager.onContentSizeChange}",
    )
    expect(pagerView).not.toMatch(/\bcontentOffset=/)
    expect(renderer.match(/Gesture\.Native\(\)/g)).toHaveLength(2)
    expect(renderer.match(/\.disallowInterruption\(true\)/g)).toHaveLength(2)

    expect(MOUNTED_PAGE_RADIUS).toBe(2)
    expect(PAGE_WINDOW_RADIUS).toBeGreaterThan(MOUNTED_PAGE_RADIUS)
    expect(PAGE_REBASE_MARGIN).toBeLessThan(PAGE_WINDOW_RADIUS)
    const pager = rendererSource("owned-calendar-pager.ts")
    expect(pager).toContain("mountedPageIndexes(window, state.center)")
    expect(pager).toContain("planPageRebase")
  })

  it("settles pages on the UI thread and tells React only about crossings and settles", () => {
    const pager = rendererSource("owned-calendar-pager.ts")
    const scrollHandler = callArguments(pager, "useAnimatedScrollHandler")

    for (const key of [
      "onScroll",
      "onBeginDrag",
      "onEndDrag",
      "onMomentumBegin",
      "onMomentumEnd",
    ]) {
      expect(scrollHandler).toMatch(new RegExp(`\\b${key}: \\(`))
    }
    expect(scrollHandler).not.toMatch(
      /\bset[A-Z]\w*\(|\.current\b|onDateCommitted/,
    )
    expect(
      new Set([...pager.matchAll(/scheduleOnRN\((\w+)/g)].map(([, f]) => f)),
    ).toEqual(new Set(["onCross", "onSettle", "pagingLog"]))
    expect(
      new Set([...pager.matchAll(/scheduleOnUI\(\s*(\w+)/g)].map(([, f]) => f)),
    ).toEqual(
      new Set(["place", "placeNavigation", "releasePreviousNativeTouch"]),
    )
    expect(pager).toMatch(/scrollTo\(scrollRef, /)

    const pagingOwners = [
      "owned-calendar-canvas.tsx",
      "owned-calendar-header.tsx",
      "owned-calendar-page.tsx",
      "owned-calendar-shell.tsx",
    ]
      .map(rendererSource)
      .join("\n")
    expect(pagingOwners).not.toMatch(/generation|revision|epoch/i)
    expect(pager).toContain("activeGeneration")
    expect(pagingOwners).not.toContain("react-native-pager-view")
    expect(
      productionCalendarFiles().filter((file) =>
        readFileSync(file, "utf8").includes("react-native-pager-view"),
      ),
    ).toEqual([])

    const header = rendererSource("owned-calendar-header.tsx")
    expect(header).toContain("translateX: -scrollX.get()")
    expect(header).toContain('testID="owned-calendar-date-header-strip"')
    expect(header).toContain('overflow: "hidden"')
    expect(header).toContain('committed ? "auto" : "no-hide-descendants"')
  })

  it("bans timers, JS-thread animation, and manual memoization in the renderer", () => {
    const renderer = rendererSources()
    expect(renderer).not.toMatch(
      /PanGestureHandler|Animated\.timing|setInterval|setTimeout|runOnJS|import\s*\{[^}]*\bAnimated\b[^}]*\}\s*from "react-native"/,
    )
    expect(renderer).not.toMatch(
      /\buseCallback\b|\buseMemo\b|\bforwardRef\b|\bmemo\(/,
    )

    const zoom = rendererSource("owned-calendar-zoom.ts")
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
      "owned-calendar-chooser.tsx",
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
    expect(renderer).toContain("MINIMUM_TARGET")
    expect(renderer).not.toMatch(/onEventPress\([^)]*(?:index|direction|key)/)
    expect(navigationBoundary).not.toMatch(
      /@\/api|generated\/|customFetch|fetch\(|useSyncCalendars|syncCalendars/,
    )
  })

  it("keeps one committed-page event tree and bounded identity focus refs", () => {
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
    const chooser = readFileSync(
      join(rendererRoot, "owned-calendar-chooser.tsx"),
      "utf8",
    )
    const focus = readFileSync(
      join(rendererRoot, "owned-calendar-focus.ts"),
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
    expect(page).toContain("export function CalendarPage(")
    expect(canvas).toContain("removeClippedSubviews={false}")
    expect(page.match(/<Pressable\b/g)?.length).toBe(2)
    expect(chooser.match(/<Pressable\b/g)?.length).toBe(2)
    expect(chooser.match(/<Modal\b/g)?.length).toBe(1)
    expect(shell).toContain("<EventChooser")
    expect(focus).toContain(
      "type FocusTarget = { node: View; dateKey: string; minute: number }",
    )
    expect(focus).toContain("new Map<string, FocusTarget>()")
    expect(focus).toContain("scrollTo: (offset: number) => void")
    expect(shell).toContain("scrollTo: coordinator.scrollToOffset")
    expect(focus).toContain("AccessibilityInfo.setAccessibilityFocus")
    expect(projection).toContain("entries.sort(compareEntries)")
    expect(
      [canvas, page, shell, chooser, focus, projection].join("\n"),
    ).not.toMatch(
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
      const frameCallbacks = [
        ...source.matchAll(
          /requestAnimationFrame\(\s*([A-Za-z_$][\w$]*)\s*\)/g,
        ),
      ].map(([, callback]) => callback)
      expect(frameCallbacks).toEqual(
        file.endsWith("owned-calendar-pager.ts")
          ? ["checkRest", "checkRest"]
          : [],
      )
      if (file.endsWith("owned-calendar-pager.ts")) {
        expect(source).toContain("frame < INITIAL_PLACEMENT_WAIT_FRAMES")
        expect(source).toContain("retries < INITIAL_PLACEMENT_RETRIES")
        expect(source).toContain("run.get() !== owner")
      }
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
