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

describe("owned Calendar paging repository contract", () => {
  it("compiles the resting-offset helper for the native UI runtime", () => {
    // Jest's animation mocks do not enforce the native runtime boundary.
    const compiled = execFileSync(
      process.execPath,
      [
        "-e",
        `const babel = require("@babel/core");
         const result = babel.transformFileSync(
           "src/features/calendar/renderer/owned-calendar-shell.tsx",
           {
             envName: "development",
             caller: { name: "metro", platform: "ios", isDev: true }
           }
         );
         process.stdout.write(result.code);`,
      ],
      { cwd: root, encoding: "utf8" },
    )
    expect(compiled).toMatch(/restingTranslation\.__workletHash\s*=/)
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
      "owned-calendar-shell.test.tsx",
      "owned-calendar-shell.tsx",
    ])

    const sources = productionCalendarFiles()
      .map((file) => readFileSync(file, "utf8"))
      .join("\n")
    expect(sources).not.toContain(vendorPackage)
    expect(sources).not.toMatch(/fallback renderer|compatibility renderer/i)
    expect(sources).not.toContain("react-native-pager-view")
    expect(packageJson.dependencies).toMatchObject({
      "react-native-gesture-handler": expect.any(String),
      "react-native-reanimated": expect.any(String),
      "react-native-worklets": expect.any(String),
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

  it("registers legacy native worklet events on the animated viewport", () => {
    const renderer = readFileSync(
      join(root, "src/features/calendar/renderer/owned-calendar-shell.tsx"),
      "utf8",
    )
    expect(renderer).toMatch(/<PanGestureHandler\b[^>]*>\s*<Animated\.View\b/)
  })

  it("keeps snap-back on the UI runtime instead of queuing a guarded JS callback", () => {
    const renderer = readFileSync(
      join(root, "src/features/calendar/renderer/owned-calendar-shell.tsx"),
      "utf8",
    )
    expect(renderer).toMatch(/const snapBack = \(\) => \{\s*"worklet"/)
    expect(renderer).not.toMatch(/scheduleOnRN\(\s*snapBack/)
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
