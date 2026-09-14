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
  it("compiles the native scroll and pager owner for the native runtime", () => {
    const compiled = [
      "src/features/calendar/renderer/owned-calendar-shell.tsx",
      "src/features/calendar/renderer/owned-calendar-canvas.tsx",
      "src/features/calendar/renderer/pager-page-scroll.ts",
    ]
      .map(compileForNativeRuntime)
      .join("\n")
    expect(compiled).toContain("react-native-pager-view")
    expect(compiled).toContain("contentInsetAdjustmentBehavior")
    expect(compiled).toContain("createAnimatedComponent")
    expect(compiled).toContain("useEvent")
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
      "index.ts",
      "owned-calendar-canvas.tsx",
      "owned-calendar-coordinator.ts",
      "owned-calendar-header.tsx",
      "owned-calendar-shell.test.tsx",
      "owned-calendar-shell.tsx",
      "pager-page-scroll.ts",
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

  it("keeps one native vertical owner and one pager with a passive header projection", () => {
    const rendererRoot = join(root, "src/features/calendar/renderer")
    const renderer = readdirSync(rendererRoot)
      .filter((file) => /\.tsx?$/.test(file) && !file.includes(".test."))
      .map((file) => readFileSync(join(rendererRoot, file), "utf8"))
      .join("\n")
    const progress = readFileSync(
      join(rendererRoot, "pager-page-scroll.ts"),
      "utf8",
    )
    expect(renderer).toMatch(/<ScrollView\b/)
    expect(renderer).toMatch(/contentInsetAdjustmentBehavior="automatic"/)
    expect(progress).toContain("createAnimatedComponent(PagerView)")
    expect(progress).toContain("useHandler")
    expect(progress).toContain("useEvent")
    expect(progress).toContain("useSharedValue")
    expect(progress).toContain("useAnimatedStyle")
    expect(renderer).toMatch(/<AnimatedPagerView\b/)
    expect(renderer.match(/<ScrollView\s+ref=/g)).toHaveLength(1)
    expect(renderer.match(/<AnimatedPagerView\s+ref=/g)).toHaveLength(1)
    expect(renderer).toMatch(/initialPage=\{1\}/)
    expect(renderer).toContain("weekColumns")
    expect(renderer).toContain('testID="owned-calendar-date-header"')
    expect(renderer).toContain('testID="owned-calendar-date-header-viewport"')
    expect(renderer).toContain('testID="owned-calendar-date-header-strip"')
    expect(renderer).toContain("pages={coordinator.pages}")
    expect(renderer).toContain("onPageScroll={coordinator.onPageScroll}")
    expect(renderer).toContain('overflow: "hidden"')
    expect(renderer).toContain('left: "-100%"')
    expect(renderer).toContain('width: "300%"')
    expect(renderer).toContain('page.direction === 0 ? "auto"')
    expect(renderer).toContain('"no-hide-descendants"')
    expect(renderer).not.toMatch(
      /PanGestureHandler|Animated\.timing|setInterval|setTimeout|runOnJS|import\s*\{[^}]*\bAnimated\b[^}]*\}\s*from "react-native"/,
    )
    expect(renderer).not.toMatch(/\buseMemo\b|\buseCallback\b/)
  })

  it("keeps weekend persistence in the typed settings and storage seams", () => {
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
