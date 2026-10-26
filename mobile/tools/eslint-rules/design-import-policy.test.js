/* global __dirname, beforeAll, describe, expect, it */
const { resolve } = require("node:path")
const { execFileSync } = require("node:child_process")

// Flat config REPLACES no-restricted-imports options block by block, so a block
// that forgets a flag drops a ban with lint still green. This pins the effective
// policy per file class (ADR 068, lint-format.md → Design layer).

const root = resolve(__dirname, "../..")

const DESIGN_BARREL = "^@/design$"
const DESIGN_DEEP = "^@/design/(?!gallery(/|$))"
const GALLERY_ENTRY = "^@/design/gallery(/|$)"
const ROUTE_ENTRYPOINT = "^@/app(/|$)"
const STORAGE_BACKEND = "^react-native-mmkv($|/)"
const CHROME_SEAM = "^expo-glass-effect($|/)"
const CHROME_DEEP = "^@/components/chrome/"
const APP_SHELL = "^@/components/(?!chrome(/|$))"
const SYMBOLS_DEEP = "^expo-symbols/"
const SYMBOL_IMPORT_NAMES = [
  "SymbolView",
  "unstable_getMaterialSymbolSourceAsync",
]

const fileClasses = [
  {
    file: "src/features/settings/ui/settings-screen.tsx",
    barrel: true,
    deep: false,
    gallery: false,
  },
  {
    file: "src/features/developer/ui/gallery-index-screen.tsx",
    barrel: true,
    deep: false,
    gallery: true,
  },
  {
    file: "src/features/environment/ui/environment-selector.tsx",
    barrel: true,
    deep: false,
    gallery: false,
  },
  {
    file: "src/app/developer.tsx",
    barrel: true,
    deep: false,
    gallery: false,
    route: false,
    appShell: true,
  },
  {
    file: "src/design/button/button.tsx",
    barrel: false,
    deep: true,
    gallery: false,
    chromeDeep: true,
  },
  {
    file: "src/design/event-surface/event-surface.tsx",
    barrel: false,
    deep: true,
    gallery: false,
    chromeDeep: true,
  },
  {
    file: "src/design/icon/icon.tsx",
    barrel: false,
    deep: true,
    gallery: false,
    symbolView: false,
    chromeDeep: true,
  },
  {
    file: "src/design/gallery/registry.ts",
    barrel: true,
    deep: true,
    gallery: true,
    chromeDeep: true,
  },
  {
    file: "src/design/button/button.gallery.tsx",
    barrel: true,
    deep: true,
    gallery: true,
    chromeDeep: true,
  },
  {
    file: "src/design/button/button.test.tsx",
    barrel: true,
    deep: true,
    gallery: false,
    chromeDeep: true,
  },
  {
    file: "src/components/chrome/native-list.tsx",
    barrel: false,
    deep: true,
    gallery: false,
    chromeSeam: false,
    chromeDeep: true,
    symbolView: false,
  },
  {
    file: "src/components/chrome/menu-view.gallery.tsx",
    barrel: true,
    deep: true,
    gallery: true,
    chromeSeam: false,
    chromeDeep: true,
    symbolView: false,
  },
  {
    file: "src/features/calendar-sources/ui/dev-import-screen.tsx",
    barrel: true,
    deep: false,
    gallery: false,
  },
  {
    file: "src/features/developer/ui/gallery-story-screen.tsx",
    barrel: true,
    deep: false,
    gallery: true,
  },
  {
    file: "src/app/(tabs)/_layout.tsx",
    barrel: true,
    deep: false,
    gallery: false,
    route: false,
    appShell: true,
  },
  {
    file: "src/components/app-tabs.tsx",
    barrel: true,
    deep: false,
    gallery: false,
    chromeDeep: true,
    appShell: true,
  },
  {
    file: "src/components/app-tabs.test.tsx",
    barrel: true,
    deep: false,
    gallery: false,
    chromeDeep: true,
    appShell: true,
  },
  {
    file: "src/components/chrome/native-list.test.tsx",
    barrel: false,
    deep: true,
    gallery: false,
    chromeSeam: false,
    chromeDeep: true,
    symbolView: false,
  },
  {
    file: "src/theme/tokens.gallery.tsx",
    barrel: true,
    deep: false,
    gallery: true,
  },
]

describe("design import policy", () => {
  const configs = new Map()

  beforeAll(() => {
    // Resolved in a plain Node process: under Jest's module resolution ESLint
    // cannot load its own config file or every plugin it names.
    const script = `
      const { ESLint } = require("eslint")
      const eslint = new ESLint({ cwd: process.cwd() })
      Promise.all(JSON.parse(process.argv[1]).map(async (file) => [
        file,
        (await eslint.calculateConfigForFile(file)).rules["no-restricted-imports"][1],
      ])).then((entries) => process.stdout.write(JSON.stringify(entries)))
    `
    const output = execFileSync(
      process.execPath,
      ["-e", script, JSON.stringify(fileClasses.map(({ file }) => file))],
      { cwd: root, encoding: "utf8" },
    )
    for (const [file, options] of JSON.parse(output)) configs.set(file, options)
  }, 60000)

  it.each(fileClasses)(
    "$file gets its layer's import restrictions",
    ({
      file,
      barrel,
      deep,
      gallery,
      route = true,
      symbolView = true,
      chromeSeam = true,
      chromeDeep = false,
      appShell = false,
    }) => {
      const options = configs.get(file)
      const patterns = options.patterns.map((pattern) => pattern.regex)
      const symbolNames = options.paths
        .filter((path) => path.name === "expo-symbols")
        .flatMap((path) => path.importNames)
      const banned = (regex) => patterns.includes(regex)

      expect({
        file,
        barrel: !banned(DESIGN_BARREL),
        deep: !banned(DESIGN_DEEP),
        gallery: !banned(GALLERY_ENTRY),
        route: banned(ROUTE_ENTRYPOINT),
        storage: banned(STORAGE_BACKEND),
        chromeSeam: banned(CHROME_SEAM),
        chromeDeep: !banned(CHROME_DEEP),
        appShell: !banned(APP_SHELL),
        symbolView: symbolNames,
        symbolsDeep: banned(SYMBOLS_DEEP),
      }).toEqual({
        file,
        barrel,
        deep,
        gallery,
        route,
        storage: true,
        chromeSeam,
        chromeDeep,
        appShell,
        symbolView: symbolView ? SYMBOL_IMPORT_NAMES : [],
        symbolsDeep: symbolView,
      })
    },
  )
})
