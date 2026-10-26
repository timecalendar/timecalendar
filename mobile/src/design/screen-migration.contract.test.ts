const { existsSync, readFileSync } = jest.requireActual("node:fs") as {
  existsSync(path: string): boolean
  readFileSync(path: string, encoding: "utf8"): string
}
const { resolve } = jest.requireActual("node:path") as {
  resolve(...paths: string[]): string
}

const MIGRATED_SCREENS: readonly {
  slice: string
  files: readonly string[]
}[] = [
  {
    slice: "5.1",
    files: [
      "src/app/onboarding/index.tsx",
      "src/app/onboarding/connect.tsx",
      "src/app/onboarding/import.tsx",
      "src/features/onboarding/ui/welcome-screen.tsx",
      "src/features/onboarding/ui/welcome-controls.tsx",
      "src/features/onboarding/ui/welcome-entrance.tsx",
      "src/features/onboarding/ui/welcome-page-catalog.ts",
      "src/features/onboarding/ui/welcome-page-indicator.tsx",
      "src/features/onboarding/ui/welcome-pager.tsx",
      "src/features/onboarding/ui/welcome-pages.tsx",
      "src/features/onboarding/ui/connect-screen.tsx",
      "src/features/onboarding/ui/manual-import-screen.tsx",
      "src/features/onboarding/ui/step-styles.ts",
    ],
  },
]

const DRIFT_PATTERNS: readonly { id: string; pattern: RegExp }[] = [
  { id: "color-literal", pattern: /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/ },
  {
    id: "named-color",
    pattern:
      /["'](white|black|transparent|red|blue|green|gray|grey|yellow|orange|pink|purple)["']/,
  },
  {
    id: "spacing-literal",
    pattern:
      /\b(padding\w*|margin\w*|gap|rowGap|columnGap|top|bottom|left|right|start|end)\s*:\s*-?[0-9]+(\.[0-9]+)?\b|\bspacing=\{[0-9]+\}/,
  },
  {
    id: "radius-literal",
    pattern: /\b(border\w*Radius|cornerRadius)\s*:\s*[0-9]+/,
  },
  {
    id: "typography-literal",
    pattern: /\b(fontSize|lineHeight|letterSpacing)\s*:\s*[0-9]+/,
  },
  { id: "font-weight", pattern: /fontWeight\s*:/ },
  { id: "font-family", pattern: /fontFamily\s*:/ },
  {
    id: "legacy-shadow",
    pattern:
      /\b(shadowColor|shadowOpacity|shadowRadius|shadowOffset|elevation|boxShadow)\s*:/,
  },
  { id: "scheme-access", pattern: /useColorScheme|Appearance\./ },
  {
    id: "inline-style",
    pattern: /(style|contentContainerStyle|containerStyle)=\{\{/,
  },
  { id: "hairline", pattern: /hairlineWidth/ },
  { id: "opacity-literal", pattern: /\bopacity\s*:\s*[0-9.]*0\./ },
  { id: "border-width-literal", pattern: /\bborder\w*Width\s*:\s*[0-9]+/ },
  { id: "hit-slop-literal", pattern: /hitSlop=\{[0-9]/ },
  { id: "raw-activity-indicator", pattern: /<ActivityIndicator/ },
  { id: "raw-symbol-view", pattern: /<SymbolView/ },
  { id: "touch-target-literal", pattern: /min(Height|Width)\s*:\s*(44|48)\b/ },
  {
    id: "touch-target-branch",
    pattern: /Platform\.(OS|select)\b.*\b(44|48)\b/,
  },
  { id: "theme-color-prop", pattern: /themeColor=/ },
  {
    id: "legacy-type-alias",
    pattern: /type="(default|small|smallBold|subtitle)"/,
  },
]

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ""))
    .replace(/(^|\s)\/\/.*$/gm, "$1")
}

function findDrift(source: string): { id: string; line: number }[] {
  return stripComments(source)
    .split("\n")
    .flatMap((text, index) =>
      DRIFT_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
        ({ id }) => ({ id, line: index + 1 }),
      ),
    )
}

// Raised by every Phase 5 slice that appends files, so the list cannot shrink.
const MIGRATED_FILE_FLOOR = 13

const listedFiles = MIGRATED_SCREENS.flatMap(({ files }) => files)

describe("migrated-screen contract", () => {
  it("reports each drift pattern once and ignores comments", () => {
    const fixture = [
      'color: "#ff0000",',
      'color: "white",',
      "padding: 12,",
      "borderRadius: 6,",
      "fontSize: 17,",
      'fontWeight: "600",',
      'fontFamily: "Inter",',
      "shadowRadius: Spacing.two,",
      "const scheme = useColorScheme()",
      "<View style={{ flex: 1 }} />",
      "StyleSheet.hairlineWidth",
      "opacity: 0.5,",
      "borderWidth: 1,",
      "<Pressable hitSlop={8} />",
      "<ActivityIndicator />",
      '<SymbolView name="x" />',
      "minHeight: 44,",
      'const H = Platform.OS === "ios" ? 52 : 48',
      '<ThemedText themeColor="textSecondary" />',
      '<ThemedText type="smallBold" />',
      '// <ThemedText themeColor="x" />',
      '/* <ThemedText themeColor="x" /> */',
    ].join("\n")

    const hits = findDrift(fixture)

    expect(hits.map(({ id }) => id)).toEqual(DRIFT_PATTERNS.map(({ id }) => id))
    expect(hits.map(({ line }) => line)).toEqual(
      DRIFT_PATTERNS.map((_, index) => index + 1),
    )
  })

  it("keeps line numbers across block comments", () => {
    expect(findDrift('/*\n\n*/\n<T themeColor="x" />')).toEqual([
      { id: "theme-color-prop", line: 4 },
    ])
  })

  it("lists only files that exist", () => {
    expect(
      listedFiles.filter((file) => !existsSync(resolve(process.cwd(), file))),
    ).toEqual([])
  })

  it("never lists fewer files than the floor", () => {
    expect(listedFiles.length).toBeGreaterThanOrEqual(MIGRATED_FILE_FLOOR)
  })

  it("lists each file once", () => {
    expect(
      listedFiles.filter((file, index) => listedFiles.indexOf(file) !== index),
    ).toEqual([])
  })

  it("keeps every migrated screen free of drift", () => {
    const offenders = listedFiles.flatMap((file) =>
      findDrift(readFileSync(resolve(process.cwd(), file), "utf8")).map(
        ({ id, line }) => `${file}:${line} ${id}`,
      ),
    )

    expect(offenders).toEqual([])
  })
})
