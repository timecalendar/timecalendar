/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import ts from "typescript"

const EXPECTED_TOP_LEVEL = [
  "01-fresh-user-import.yaml",
  "02-personal-event.yaml",
  "03-calendar-visibility.yaml",
]
const EXPECTED_EXPORT_GUIDE_TOP_LEVEL = [
  "01-listed-exact.yaml",
  "02-generic-substitution.yaml",
  "03-connect-skips.yaml",
  "04-unlisted-provider.yaml",
  "05-blocking-retry.yaml",
]
const SAMPLE_INTERPOLATION: Record<string, string> = {
  time: "14:00 – 16:00",
  location: "Room E2E Import",
}
const INTERPOLATION_SAMPLE = "00000000-0000-4000-8000-000000000000"

const mobileRoot = join(__dirname, "..")
const flowsDir = join(mobileRoot, ".maestro")
const exportGuideFlowsDir = join(flowsDir, "export-guide")
const srcDir = join(mobileRoot, "src")
const serverRoot = join(mobileRoot, "..", "server", "src")
const seedScript = join(serverRoot, "scripts", "seed-e2e-calendar.ts")
const exportGuideSeedScript = join(
  serverRoot,
  "scripts",
  "seed-e2e-export-guide.ts",
)
const fixtureController = join(
  serverRoot,
  "e2e",
  "e2e-ical-fixture.controller.ts",
)
const enLocale = join(srcDir, "i18n", "locales", "en.json")

function filesUnder(dir: string, extensions: string[]): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((entry) => extensions.some((ext) => entry.endsWith(ext)))
    .map((entry) => join(dir, entry))
}

function testIdTemplateParts(source: string): string[][] {
  const sourceFile = ts.createSourceFile(
    "source.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const templates: string[][] = []

  function collect(node: ts.Node): void {
    if (ts.isNoSubstitutionTemplateLiteral(node)) {
      templates.push([node.text])
    } else if (ts.isTemplateExpression(node)) {
      templates.push([
        node.head.text,
        ...node.templateSpans.map(({ literal }) => literal.text),
      ])
    } else {
      ts.forEachChild(node, collect)
    }
  }

  function visit(node: ts.Node): void {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "testID" &&
      node.initializer !== undefined
    ) {
      collect(node.initializer)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return templates
}

function declaredTestIds(source: string): string[] {
  const literals = [...source.matchAll(/testID(?:=\{?|:\s*)"([^"]+)"/g)].map(
    (match) => match[1] as string,
  )
  const templates = testIdTemplateParts(source).map((parts) =>
    parts.join(INTERPOLATION_SAMPLE),
  )
  return [...literals, ...templates]
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function declaredTestIdFamilies(source: string): RegExp[] {
  return testIdTemplateParts(source).map(
    (parts) => new RegExp(`^(?:${parts.map(escapeRegExp).join(".+")})$`),
  )
}

const sourceFiles = filesUnder(srcDir, [".ts", ".tsx"]).filter(
  (file) => !/\.test\.tsx?$/.test(file),
)
const declaredIds = [
  ...new Set(
    sourceFiles.flatMap((file) => declaredTestIds(readFileSync(file, "utf8"))),
  ),
]
const declaredFamilies = sourceFiles.flatMap((file) =>
  declaredTestIdFamilies(readFileSync(file, "utf8")),
)

function selectorPattern(selector: string): RegExp | undefined {
  try {
    return new RegExp(`^(?:${selector})$`)
  } catch {
    return undefined
  }
}

function resolves(selector: string): boolean {
  const pattern = selectorPattern(selector)
  return (
    pattern !== undefined &&
    (declaredIds.some((id) => pattern.test(id)) ||
      declaredFamilies.some((family) => family.test(selector)))
  )
}

function flowSelectors(yaml: string): { id: string; line: number }[] {
  return yaml.split("\n").flatMap((rawLine, index) => {
    const match = /^\s*(?:-\s+)?id:\s*["']?([^"'#]+?)["']?\s*(?:#.*)?$/.exec(
      rawLine,
    )
    return match?.[1] ? [{ id: match[1].trim(), line: index + 1 }] : []
  })
}

function flowTextSelectors(yaml: string): { text: string; line: number }[] {
  return yaml.split("\n").flatMap((rawLine, index) => {
    const match =
      /^\s*(?:-\s+)?(?:tapOn|text|visible|notVisible|assertVisible|assertNotVisible):\s*"([^"]*)"\s*$/.exec(
        rawLine,
      )
    return match?.[1] ? [{ text: match[1], line: index + 1 }] : []
  })
}

function commandLines(yaml: string): string {
  return yaml
    .split("\n")
    .filter((line) => !/^\s*(?:#|$)/.test(line))
    .join("\n")
}

function containsOrdered(yaml: string, snippets: string[]): boolean {
  const commands = commandLines(yaml)
  let cursor = 0
  return snippets.every((snippet) => {
    const index = commands.indexOf(snippet, cursor)
    if (index === -1) return false
    cursor = index + snippet.length
    return true
  })
}

const flowFiles = filesUnder(flowsDir, [".yaml"])
const flows = flowFiles.map((file) => ({
  file,
  name: relative(flowsDir, file),
  yaml: readFileSync(file, "utf8"),
}))
const flow = (name: string) =>
  flows.find((candidate) => candidate.name === name)?.yaml ?? ""
const OPEN_AGENDA_FLOW = "- runFlow: helpers/open-calendar-agenda.yaml"

const seededTitles = [
  ...new Set(
    [seedScript, exportGuideSeedScript, fixtureController].flatMap((file) =>
      [
        ...readFileSync(file, "utf8").matchAll(
          /(?:title:|EVENT_TITLE\s*=)\s*"([^"]+)"/g,
        ),
      ].map((match) => match[1] as string),
    ),
  ),
]
const titleExtendingLabels = Object.values(
  JSON.parse(readFileSync(enLocale, "utf8")) as Record<string, string>,
).filter((value) => value.startsWith("{{title}}") && value !== "{{title}}")

function matches(selector: string, candidate: string): boolean {
  return selectorPattern(selector)?.test(candidate) ?? false
}

function unreachableRenderings(selector: string): string[] {
  const title = seededTitles.find((candidate) => matches(selector, candidate))
  if (title === undefined) return []
  const renderings = [
    title,
    ...titleExtendingLabels.map((template) =>
      template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
        key === "title" ? title : (SAMPLE_INTERPOLATION[key] ?? key),
      ),
    ),
  ]
  return [...new Set(renderings)].filter(
    (rendering) => !matches(selector, rendering),
  )
}

describe("Maestro smoke inventory", () => {
  it("discovers exactly the three ordered business journeys", () => {
    const topLevel = readdirSync(flowsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
      .map((entry) => entry.name)
      .sort()

    expect(topLevel).toEqual(EXPECTED_TOP_LEVEL)
    expect(flows.filter(({ name }) => name.includes("/"))).not.toHaveLength(0)
  })

  it("keeps the export-guide suite separate with a fixed ordered inventory", () => {
    const topLevel = readdirSync(exportGuideFlowsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
      .map((entry) => entry.name)
      .sort()

    expect(topLevel).toEqual(EXPECTED_EXPORT_GUIDE_TOP_LEVEL)
    expect(
      flows.filter(({ name }) => name.startsWith("export-guide/helpers/")),
    ).not.toHaveLength(0)
  })

  it("keeps helpers nested and every runFlow target resolvable", () => {
    const missing = flows.flatMap(({ file, name, yaml }) =>
      [...yaml.matchAll(/^\s*-\s*runFlow:\s*([^\s]+\.yaml)\s*$/gm)].flatMap(
        (match) => {
          const target = join(dirname(file), match[1] as string)
          return flowFiles.includes(target) ? [] : [`${name} -> ${match[1]}`]
        },
      ),
    )

    expect(missing).toEqual([])
    expect(
      flows
        .filter(({ name }) => name.startsWith("helpers/"))
        .every(({ name }) => !EXPECTED_TOP_LEVEL.includes(name)),
    ).toBe(true)
  })
})

describe("Maestro selector integrity", () => {
  it("finds both flow selectors and shipped app testIDs", () => {
    expect(flows.flatMap(({ yaml }) => flowSelectors(yaml))).not.toHaveLength(0)
    expect(declaredIds).not.toHaveLength(0)
  })

  it.each(flows)("$name resolves every id selector", ({ name, yaml }) => {
    const unresolved = flowSelectors(yaml)
      .filter(({ id }) => !resolves(id))
      .map(({ id, line }) => `${name}:${line} — id: "${id}"`)

    expect(unresolved).toEqual([])
  })

  it("keeps recursive scanning and regex/template-family matching load-bearing", () => {
    expect(flows.map(({ name }) => name)).toContain(
      "helpers/import-seeded-calendar.yaml",
    )
    expect(resolves("calendar-(add|fab)")).toBe(true)
    expect(
      resolves("user-calendar-visibility-e2e0e2e0-0000-4000-8000-000000000001"),
    ).toBe(true)
    expect(resolves("calendar-view-agenda")).toBe(false)
  })

  it("uses no platform-asymmetric bare back or keyboard-hide command", () => {
    const offenders = flows.flatMap(({ name, yaml }) =>
      yaml
        .split("\n")
        .flatMap((line, index) =>
          /^\s*-\s*(?:back|hideKeyboard)\s*$/.test(line)
            ? [`${name}:${index + 1}`]
            : [],
        ),
    )
    expect(offenders).toEqual([])
  })
})

describe("Maestro journey contracts", () => {
  it("covers exact, Generic, Connect-skip, broken-image and unlisted handoffs", () => {
    const exact = flow("export-guide/01-listed-exact.yaml")
    const generic = flow("export-guide/02-generic-substitution.yaml")
    const skipped = flow("export-guide/03-connect-skips.yaml")
    const unlisted = flow("export-guide/04-unlisted-provider.yaml")
    const retry = flow("export-guide/05-blocking-retry.yaml")
    const failNext = readFileSync(
      join(exportGuideFlowsDir, "fail-next.js"),
      "utf8",
    )

    expect(
      containsOrdered(exact, [
        'tapOn: "E2E Export ADE Safe"',
        'id: "onboarding-connect-intranet"',
        'id: "export-guide-visible-back"',
        '- tapOn:\n    id: "export-guide-next"',
        'visible: "Page 2 of 4"',
        '- tapOn:\n    id: "export-guide-next"',
        'visible: "Page 3 of 4"',
        '- tapOn:\n    id: "export-guide-next"',
        'visible: "Page 4 of 4"',
        'visible:\n      id: "onboarding-import-content"',
        'assertNotVisible:\n    id: "ical-url-content"',
      ]),
    ).toBe(true)
    expect(
      containsOrdered(generic, [
        'tapOn: "E2E Export Future Provider"',
        'visible: "Display your timetable(,.*)?"',
        'id: "export-guide-page-image-placeholder"',
        '- tapOn:\n    id: "export-guide-next"',
        'visible: "Page 2 of 3"',
        '- tapOn:\n    id: "export-guide-next"',
        'visible: "Page 3 of 3"',
        'id: "onboarding-import-content"',
      ]),
    ).toBe(true)
    expect(skipped).toContain('tapOn: "E2E Export Missing Connect"')
    expect(skipped).toContain('tapOn: "E2E Export Unsafe Connect"')
    expect(skipped.split('id: "onboarding-connect-intranet"')).toHaveLength(3)
    expect(
      flow("export-guide/helpers/start-onboarding.yaml").split(
        "openLink: timecalendar-dev://onboarding",
      ),
    ).toHaveLength(3)
    expect(
      containsOrdered(unlisted, [
        'id: "onboarding-school-missing"',
        "platform: Android",
        "pressKey: back",
        'id: "onboarding-institution-continue"',
        'id: "export-guide-provider-ade"',
        'id: "export-guide-provider-hplanning"',
        'id: "export-guide-provider-celcat"',
        'id: "export-guide-provider-generic"',
        '- tapOn:\n    id: "export-guide-next"',
        'visible: "Page 2 of 3"',
        '- tapOn:\n    id: "export-guide-next"',
        'visible: "Page 3 of 3"',
        'id: "onboarding-import-content"',
      ]),
    ).toBe(true)
    expect(
      containsOrdered(retry, [
        "- runScript: fail-next.js",
        'id: "export-guide-retry"',
        'id: "export-guide-back"',
        'id: "onboarding-import-content"',
        'id: "export-guide-retry"',
        'id: "export-guide-page"',
      ]),
    ).toBe(true)
    expect(failNext).toContain("body: JSON.stringify({})")
    expect(failNext).toContain(
      "`${E2E_CONTROL_URL}/__e2e/export-guide/fail-next`",
    )
    expect(retry).toContain("E2E_CONTROL_URL: ${E2E_CONTROL_URL}")
  })

  it("keeps cold Calendar-to-Agenda entry in one shared helper", () => {
    expect(
      containsOrdered(flow("helpers/open-calendar-agenda.yaml"), [
        "- stopApp\n- openLink: timecalendar-dev://calendar",
        "- runFlow: confirm-ios-deep-link.yaml",
        'visible: "Calendar"',
        'id: "calendar-view"',
        '- tapOn: "Agenda"',
      ]),
    ).toBe(true)
  })

  it("starts every production protected-route probe from cleared state", () => {
    const guard = flow("production-guard/protected-routes.yaml")

    expect(guard.split("clearState: true")).toHaveLength(4)
    expect(guard.split('id: "onboarding-school-content"')).toHaveLength(4)
  })

  it("keeps the real listed-school import path and synced detail proof", () => {
    const yaml = flow("01-fresh-user-import.yaml")
    expect(yaml.split(OPEN_AGENDA_FLOW)).toHaveLength(2)
    expect(
      containsOrdered(yaml, [
        "clearState: true",
        '- tapOn: "My Gaming Academia"',
        'id: "onboarding-programme-input"',
        '- inputText: "E2E Programme"',
        'id: "onboarding-connect-continue"',
        'id: "onboarding-import-url"',
        '- inputText: "http://127.0.0.1:3005/__e2e/ical/import.ics"',
        'id: "ical-url-submit"',
        OPEN_AGENDA_FLOW,
        'id: "agenda-section-list"',
        'visible:\n        id: "calendar-empty-refresh"',
        'id: "calendar-empty-refresh"',
        'visible: "E2E Imported Lecture(,.*)?"',
        '- assertVisible: "Room E2E Import"',
      ]),
    ).toBe(true)
    expect(yaml).not.toContain("dev-import")
  })

  it("creates, edits, cold-reopens, and deletes through Calendar", () => {
    const yaml = flow("02-personal-event.yaml")
    expect(yaml.split(OPEN_AGENDA_FLOW)).toHaveLength(4)
    expect(
      containsOrdered(yaml, [
        'id: "calendar-(add|fab)"',
        '- inputText: "Maestro personal event"',
        '- tapOn: "Maestro personal event(,.*)?"',
        '- tapOn: "Edit this event"',
        '- inputText: "Edited and persisted"',
        OPEN_AGENDA_FLOW,
        '- tapOn: "Maestro personal event(,.*)?"',
        'visible: "Edited and persisted"',
        'id: "personal-event-delete"',
        'visible: "Delete event.*"',
        '- runFlow:\n    when:\n      platform: Android\n    commands:\n      - tapOn:\n          text: "Delete"\n          rightOf: "Cancel"',
        '- runFlow:\n    when:\n      platform: iOS\n    commands:\n      - tapOn:\n          text: "Delete"\n          above:\n            id: "personal-event-delete"',
        'id: "agenda-section-list"',
        '- assertNotVisible: "Maestro personal event(,.*)?"',
      ]),
    ).toBe(true)
    expect(yaml).not.toContain("personal-event-start-picker")
    expect(yaml).not.toContain("personal-event-end-picker")
  })

  it("hides and restores a persisted subscription without a vacuous absence", () => {
    const yaml = flow("03-calendar-visibility.yaml")
    const toggle =
      'id: "user-calendar-visibility-e2e0e2e0-0000-4000-8000-000000000001"'
    expect(yaml.split(toggle)).toHaveLength(3)
    expect(yaml.split(OPEN_AGENDA_FLOW)).toHaveLength(3)
    expect(
      containsOrdered(yaml, [
        'visible: "E2E Hide Control(,.*)?"',
        '- assertVisible: "E2E Hide Seminar(,.*)?"',
        toggle,
        OPEN_AGENDA_FLOW,
        'id: "agenda-section-list"',
        '- assertNotVisible: "E2E Hide Seminar(,.*)?"',
        toggle,
        OPEN_AGENDA_FLOW,
        'visible: "E2E Hide Control(,.*)?"',
        '- assertVisible: "E2E Hide Seminar(,.*)?"',
      ]),
    ).toBe(true)
  })
})

describe("Maestro seeded-title selectors", () => {
  it("finds both seeded and dynamic fixture titles", () => {
    expect(seededTitles).toContain("E2E Hide Seminar")
    expect(seededTitles).toContain("E2E Imported Lecture")
    expect(titleExtendingLabels).not.toHaveLength(0)
  })

  it.each(flows)(
    "$name matches seeded titles on every rendered surface",
    ({ name, yaml }) => {
      const unreachable = flowTextSelectors(yaml).flatMap(({ text, line }) =>
        unreachableRenderings(text).map(
          (rendering) =>
            `${name}:${line} — "${text}" cannot match "${rendering}"`,
        ),
      )
      expect(unreachable).toEqual([])
    },
  )

  it("rejects a bare title but accepts the cross-platform anchored form", () => {
    expect(unreachableRenderings("E2E Imported Lecture")).not.toHaveLength(0)
    expect(unreachableRenderings("E2E Imported Lecture(,.*)?")).toEqual([])
  })
})
