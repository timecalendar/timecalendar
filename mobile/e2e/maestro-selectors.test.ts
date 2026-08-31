// The app tsconfig resolves modules with the `react-native` condition, under which
// @types/node's exports do not match — so the Node types this repo-facing (never
// bundled) proof needs are pulled in explicitly for this file.
/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"

// Maestro selector-drift guard (TIM-264).
//
// Every `id:` selector in mobile/.maestro/**.yaml must resolve to a testID that
// really exists in mobile/src. Three flows had rotted silently — `calendar-view-agenda`,
// `onboarding-welcome-url-cta` and `onboarding-school-filter` were each deleted by a
// UI-rework PR that passed the baseline gate and never ran the on-demand native gate.
// run_e2e.sh stops at the first failing flow, so one stale id masks every later flow
// and costs a full native CI cycle to discover. This guard runs in the BASELINE gate,
// which is the point: it catches the break in the PR that causes it.
//
// Three matching rules, each of which a naive literal comparison gets wrong (it would
// report seven false positives on this repo and push real, working ids into an
// allowlist — including `settings-feedback`):
//  1. A Maestro `id:` value is a REGEX, not a literal (`checklist-check-.*`).
//  2. A testID is declared as a JSX attribute (`testID="x"`) OR as an object property
//     (`testID: "x"`) on a data-driven row/destination descriptor.
//  3. A testID may contain one or more template literals, directly or behind a
//     conditional expression, and each stands for the family sharing its static parts.

// Second guard, same file: seeded-title TEXT selectors (TIM-264).
//
// The app renders a seeded event title on three surfaces. On the details screen it is
// a bare ThemedText. On a home today-timeline tile and on a calendar agenda tile it is
// a child of a Pressable carrying accessibilityRole="button" + an accessibilityLabel
// that EXTENDS the title into a longer string (`{{title}}, {{time}} {{location}}`).
// XCUITest collapses such a container into a single element and drops the child text,
// so on iOS the only string a flow can match there is the composed label. A Maestro
// text selector is a fully anchored regex, so a bare title silently matched nothing —
// `calendar.yaml` failed asserting an event the screenshot plainly showed, and
// `hidden-events.yaml`'s assertNotVisible passed vacuously for the same reason. Note
// that maestro-selectors' id guard is correct to stay silent here: every testID and
// every rendered string really does exist; only the iOS projection of them differs.
//
// The invariant this encodes: a flow text selector that matches a seeded title at all
// must match it on EVERY surface that can render it. Both inputs are read from their
// real sources — the titles from the server seed script, the label templates from the
// EN locale — so the guard re-checks itself if either changes.

// Stand-ins for the runtime interpolations of a title-extending label. Only their
// shape matters: they must not themselves contain a seeded title.
const SAMPLE_INTERPOLATION: Record<string, string> = {
  time: "14:00 – 16:00",
  location: "Room E2E Lecture",
  date: "28 August",
}

const mobileRoot = join(__dirname, "..")
const flowsDir = join(mobileRoot, ".maestro")
const srcDir = join(mobileRoot, "src")
const seedScript = join(
  mobileRoot,
  "..",
  "server",
  "src",
  "scripts",
  "seed-e2e-calendar.ts",
)
const enLocale = join(srcDir, "i18n", "locales", "en.json")
const hiddenEventsFlow = readFileSync(
  join(flowsDir, "hidden-events.yaml"),
  "utf8",
)
const eventChecklistsFlow = readFileSync(
  join(flowsDir, "event-checklists.yaml"),
  "utf8",
)
const icalImportFlow = readFileSync(join(flowsDir, "ical-import.yaml"), "utf8")
const personalEventsFlow = readFileSync(
  join(flowsDir, "personal-events.yaml"),
  "utf8",
)
const userCalendarRenameFlow = readFileSync(
  join(flowsDir, "user-calendar-rename.yaml"),
  "utf8",
)

// Stale ids awaiting an app-side fix. MUST stay empty: TIM-264 authorizes repairing
// every stale selector in the flows, so there is nothing left to defer. An entry here
// is also checked in reverse — if it turns up in mobile/src the guard fails, so the
// allowlist cannot rot after the app-side fix lands.
const KNOWN_STALE: Record<string, string> = {}

// Stands in for the interpolated part of a template-literal testID. Any concrete
// value works; this one cannot collide with a hand-written id.
const INTERPOLATION_SAMPLE = "00000000-0000-4000-8000-000000000000"

function filesUnder(dir: string, extensions: string[]): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((entry) => extensions.some((ext) => entry.endsWith(ext)))
    .map((entry) => join(dir, entry))
}

/** Every `id:` selector in a flow, with its 1-based line number. */
function flowSelectors(yaml: string): { id: string; line: number }[] {
  return yaml.split("\n").flatMap((rawLine, index) => {
    const line = rawLine.replace(/\s+#.*$/, "")
    const match = /^\s*(?:-\s+)?id:\s*(\S.*?)\s*$/.exec(line)
    if (!match?.[1]) return []
    return [{ id: match[1].replace(/^["']|["']$/g, ""), line: index + 1 }]
  })
}

/**
 * Every testID a source file declares, as a concrete string. Template literals are
 * expanded with a sample interpolation so a regex selector can match the family.
 * Pass-throughs (`testID={testID}`) carry no id of their own — the value they receive
 * is declared as an object property elsewhere, which rule 2 already collects.
 */
function testIdTemplateParts(source: string): string[][] {
  const sourceFile = ts.createSourceFile(
    "source.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const templates: string[][] = []

  function collectTemplates(node: ts.Node): void {
    if (ts.isNoSubstitutionTemplateLiteral(node)) {
      templates.push([node.text])
      return
    }
    if (ts.isTemplateExpression(node)) {
      templates.push([
        node.head.text,
        ...node.templateSpans.map(({ literal }) => literal.text),
      ])
      return
    }
    ts.forEachChild(node, collectTemplates)
  }

  function visit(node: ts.Node): void {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "testID" &&
      node.initializer !== undefined
    ) {
      collectTemplates(node.initializer)
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

/**
 * Template-literal testIDs also declare a family for concrete flow ids. The
 * sampled expansion above proves regex selectors such as `checklist-check-.*`;
 * this pattern proves fixed fixture ids such as
 * `activity-new-e2e-activity-new` and `user-calendar-actions-<uuid>`.
 */
function declaredTestIdFamilies(source: string): RegExp[] {
  return testIdTemplateParts(source).map((parts) => {
    const family = parts.map(escapeRegExp).join(".+")
    return new RegExp(`^(?:${family})$`)
  })
}

const declaredIds = [
  ...new Set(
    filesUnder(srcDir, [".ts", ".tsx"])
      .filter((file) => !/\.test\.tsx?$/.test(file))
      .flatMap((file) => declaredTestIds(readFileSync(file, "utf8"))),
  ),
]

const declaredIdFamilies = filesUnder(srcDir, [".ts", ".tsx"])
  .filter((file) => !/\.test\.tsx?$/.test(file))
  .flatMap((file) => declaredTestIdFamilies(readFileSync(file, "utf8")))

/** Every text-matching selector in a flow, with its 1-based line number. */
function flowTextSelectors(yaml: string): { text: string; line: number }[] {
  return yaml.split("\n").flatMap((rawLine, index) => {
    const match =
      /^\s*(?:-\s+)?(?:tapOn|text|visible|notVisible|assertVisible|assertNotVisible):\s*"([^"]*)"\s*$/.exec(
        rawLine,
      )
    if (match?.[1] === undefined) return []
    return [{ text: match[1], line: index + 1 }]
  })
}

/** The seeded event titles, read from the server script that actually inserts them. */
const seededTitles = [
  ...new Set(
    [
      ...readFileSync(seedScript, "utf8").matchAll(/^\s*title:\s*"([^"]+)"/gm),
    ].map((match) => match[1] as string),
  ),
]

/**
 * The accessibility-label templates that EXTEND a title: `{{title}}` as the head of a
 * longer string. Precisely the collapsed-tile shape — iOS swaps the child text for
 * this label, so an anchored bare-title regex fails against a screen that plainly
 * shows the event. Two neighbouring shapes are deliberately NOT in this set:
 *  - a label that IS the title (school rows, personal-event rows) — a bare selector
 *    already matches it exactly, so no tolerance is needed;
 *  - a label that WRAPS the title (`Un-hide {{title}}`) — that labels a separate
 *    control, which hidden-events.yaml targets by its full label on purpose. Treating
 *    it as a rendering of the event would force every title selector to tolerate a
 *    leading prefix, which is both wrong and much weaker than the tail tolerance.
 */
const titleExtendingLabels = Object.values(
  JSON.parse(readFileSync(enLocale, "utf8")) as Record<string, string>,
).filter((value) => value.startsWith("{{title}}") && value !== "{{title}}")

/** Every distinct string the app can expose for a seeded title. */
function renderings(title: string): string[] {
  return [
    ...new Set([
      title,
      ...titleExtendingLabels.map((template) =>
        template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
          key === "title" ? title : (SAMPLE_INTERPOLATION[key] ?? key),
        ),
      ),
    ]),
  ]
}

/**
 * The bare `back` command. iOS has no hardware back key, so Maestro issues a
 * left-edge swipe that reports COMPLETED without popping a native-stack Screen —
 * a one-platform failure Android's hardware key hides.
 */
function backCommands(yaml: string): number[] {
  return yaml
    .split("\n")
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => /^\s*-\s*back\s*$/.test(line))
    .map(({ number }) => number)
}

function hideKeyboardCommands(yaml: string): number[] {
  return yaml
    .split("\n")
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => /^\s*-\s*hideKeyboard\s*$/.test(line))
    .map(({ number }) => number)
}

function flowCommands(yaml: string): string {
  return yaml
    .split("\n")
    .filter((line) => !/^\s*(?:#|$)/.test(line))
    .join("\n")
}

function containsOrdered(yaml: string, snippets: string[]): boolean {
  const commands = flowCommands(yaml)
  let cursor = 0
  for (const snippet of snippets) {
    const index = commands.indexOf(snippet, cursor)
    if (index === -1) return false
    cursor = index + snippet.length
  }
  return true
}

function preservesChecklistPersistence(yaml: string): boolean {
  return (
    hideKeyboardCommands(yaml).length === 0 &&
    containsOrdered(yaml, [
      '- tapOn:\n    id: "checklist-add"\n- inputText: "Buy notebook"',
      '- extendedWaitUntil:\n    visible:\n      id: "checklist-input-.*"\n      text: "Buy notebook"\n    timeout: 15000',
      "- stopApp\n- openLink: timecalendar-dev://calendar",
      '- extendedWaitUntil:\n    visible: "E2E Today Lecture(,.*)?"\n    timeout: 60000\n- tapOn:\n    text: "E2E Today Lecture(,.*)?"\n- extendedWaitUntil:\n    visible: "Buy notebook"\n    timeout: 60000',
      '- tapOn:\n    id: "checklist-check-.*"\n- assertVisible: "Buy notebook"',
      "- stopApp\n- openLink: timecalendar-dev://calendar",
      '- extendedWaitUntil:\n    visible:\n      id: "agenda-event-e2e-today-lecture-progress-1-1"\n    timeout: 60000',
      '- tapOn:\n    text: "E2E Today Lecture(,.*)?"\n- extendedWaitUntil:\n    visible: "Buy notebook"\n    timeout: 60000\n- tapOn:\n    id: "checklist-remove-.*"\n- extendedWaitUntil:\n    notVisible: "Buy notebook"\n    timeout: 60000',
    ])
  )
}

function preservesIcalCtaSequence(
  yaml: string,
  stem: "institution" | "programme",
  value: string,
): boolean {
  return flowCommands(yaml).includes(
    `- inputText: "${value}"\n- extendedWaitUntil:\n    visible:\n      id: "onboarding-${stem}-input"\n      text: "${value}"\n    timeout: 15000\n- extendedWaitUntil:\n    visible:\n      id: "onboarding-${stem}-continue"\n    timeout: 15000\n- tapOn:\n    id: "onboarding-${stem}-continue"`,
  )
}

function preservesPersonalEventCancellation(yaml: string): boolean {
  return /- tapOn: "Cancel"\n- assertVisible:\n\s+id: "personal-event-delete"\n(?:#[^\n]*\n)*- stopApp\n- openLink: timecalendar-dev:\/\/personal-events\n- runFlow:\n\s+when:\n\s+platform: iOS\n\s+commands:\n\s+- tapOn:\n\s+text: "Open"\n\s+optional: true\n- extendedWaitUntil:\n\s+visible: "Maestro CRUD event"\n\s+timeout: 60000\n(?:#[^\n]*\n)*- tapOn: "Maestro CRUD event"\n- extendedWaitUntil:\n\s+visible:\n\s+id: "personal-event-delete"\n\s+timeout: 60000\n- tapOn:\n\s+id: "personal-event-delete"\n- tapOn: "Delete"\n(?:#[^\n]*\n)*- extendedWaitUntil:\n\s+notVisible: "Maestro CRUD event"\n\s+timeout: 60000\s*$/.test(
    yaml,
  )
}

function replaceLast(
  source: string,
  target: string,
  replacement: string,
): string {
  const index = source.lastIndexOf(target)
  if (index === -1) return source
  return `${source.slice(0, index)}${replacement}${source.slice(index + target.length)}`
}

const flows = filesUnder(flowsDir, [".yaml"]).map((file) => ({
  name: file.slice(flowsDir.length + 1),
  selectors: flowSelectors(readFileSync(file, "utf8")),
  textSelectors: flowTextSelectors(readFileSync(file, "utf8")),
  backCommands: backCommands(readFileSync(file, "utf8")),
  hideKeyboardCommands: hideKeyboardCommands(readFileSync(file, "utf8")),
}))

/** Maestro compiles a text selector as a fully anchored regex — so does this. */
function matches(selector: string, candidate: string): boolean {
  try {
    return new RegExp(`^(?:${selector})$`).test(candidate)
  } catch {
    return false
  }
}

/** The renderings a selector that already matches the bare title still misses. */
function unreachableRenderings(selector: string): string[] {
  const title = seededTitles.find((candidate) => matches(selector, candidate))
  if (title === undefined) return []
  return renderings(title).filter((rendering) => !matches(selector, rendering))
}

function resolves(selector: string): boolean {
  let pattern: RegExp
  try {
    pattern = new RegExp(`^(?:${selector})$`)
  } catch {
    // Maestro could not compile it either, so it selects nothing on a device.
    return false
  }
  return (
    declaredIds.some((id) => pattern.test(id)) ||
    declaredIdFamilies.some((family) => family.test(selector))
  )
}

describe("Maestro flow selectors", () => {
  it("finds the flows and the app testIDs", () => {
    // A parser that silently matched nothing would make every assertion below pass.
    expect(flows.length).toBeGreaterThan(0)
    expect(flows.flatMap((flow) => flow.selectors).length).toBeGreaterThan(0)
    expect(declaredIds.length).toBeGreaterThan(0)
  })

  it.each(flows.filter((flow) => flow.selectors.length > 0))(
    "$name resolves every id selector against mobile/src",
    ({ name, selectors }) => {
      const unresolved = selectors
        .filter(({ id }) => !resolves(id))
        .map(({ id, line }) => `${name}:${line} — id: "${id}"`)

      expect(unresolved).toEqual([])
    },
  )

  it("carries no deferred stale selector", () => {
    // TIM-264 repairs every stale selector in the flows; nothing may be deferred.
    expect(Object.keys(KNOWN_STALE)).toEqual([])
    // Reverse direction: once the app declares an allowlisted id again, the entry
    // is stale itself and must be removed rather than left to silently pass.
    expect(Object.keys(KNOWN_STALE).filter(resolves)).toEqual([])
  })

  it("rejects a selector the app no longer declares", () => {
    // The guard's own failure mode: an over-permissive matcher that resolves
    // everything would make the assertions above vacuous.
    expect(resolves("calendar-view-agenda")).toBe(false)
    expect(resolves("calendar-view")).toBe(true)
  })

  it("treats a selector as a regex and a template testID as a family", () => {
    expect(resolves("checklist-check-.*")).toBe(true)
    expect(resolves("checklist-check-")).toBe(false)
    expect(resolves("activity-new-e2e-activity-new")).toBe(true)
    expect(
      resolves("user-calendar-actions-e2e0e2e0-0000-4000-8000-000000000002"),
    ).toBe(true)
    expect(resolves("agenda-event-e2e-today-lecture-progress-1-1")).toBe(true)
  })

  it("resolves a testID declared as an object property", () => {
    expect(resolves("settings-feedback")).toBe(true)
  })
})

describe("Maestro back navigation", () => {
  it("uses no bare back command", () => {
    // run 33211705313: settings.yaml's `back` reported COMPLETED on iOS and the
    // captured hierarchy still showed the pushed "My calendars" screen, so the
    // next assertion failed 60s later on a screen the flow believed it had left.
    // Android's hardware key makes the same command pass, so only iOS ever sees
    // it. Re-enter a root screen with `stopApp` + `launchApp` instead.
    const offenders = flows.flatMap((flow) =>
      flow.backCommands.map((line) => `${flow.name}:${line}`),
    )

    expect(offenders).toEqual([])
  })

  it("detects a bare back command", () => {
    // The guard's own failure mode: a parser matching nothing passes vacuously.
    expect(backCommands("- launchApp\n- back\n")).toEqual([2])
    expect(backCommands("- tapOn: back\n- assertVisible: back\n")).toEqual([])
  })
})

describe("Maestro keyboard commands", () => {
  it("uses no hideKeyboard command in any shared flow", () => {
    const offenders = flows.flatMap((flow) =>
      flow.hideKeyboardCommands.map((line) => `${flow.name}:${line}`),
    )

    expect(offenders).toEqual([])
  })

  it("detects a hideKeyboard command", () => {
    expect(
      hideKeyboardCommands("- inputText: value\n- hideKeyboard\n"),
    ).toEqual([2])
  })
})

describe("Maestro checklist persistence", () => {
  it("cold re-enters before toggling the exact persisted row", () => {
    expect(preservesChecklistPersistence(eventChecklistsFlow)).toBe(true)
  })

  it.each([
    [
      "hideKeyboard returns",
      eventChecklistsFlow.replace(
        '- inputText: "Buy notebook"',
        '- inputText: "Buy notebook"\n- hideKeyboard',
      ),
    ],
    [
      "the exact input value gate is removed",
      eventChecklistsFlow.replace(
        '- extendedWaitUntil:\n    visible:\n      id: "checklist-input-.*"\n      text: "Buy notebook"\n    timeout: 15000\n',
        "",
      ),
    ],
    [
      "the input value is widened",
      eventChecklistsFlow.replace(
        'text: "Buy notebook"\n    timeout: 15000',
        'text: "Buy notebook.*"\n    timeout: 15000',
      ),
    ],
    [
      "the pre-toggle re-entry is removed",
      eventChecklistsFlow.replace(
        "- stopApp\n- openLink: timecalendar-dev://calendar",
        "- stopApp",
      ),
    ],
    [
      "the toggle moves before persistence proof",
      eventChecklistsFlow.replace(
        '- tapOn:\n    id: "checklist-check-.*"',
        '- tapOn:\n    id: "checklist-check-.*"\n- stopApp',
      ),
    ],
    [
      "the hard-delete absence proof is lost",
      eventChecklistsFlow.replace(
        '- extendedWaitUntil:\n    notVisible: "Buy notebook"\n    timeout: 60000',
        '- assertVisible: "Buy notebook"',
      ),
    ],
  ])("rejects when %s", (_name, mutatedFlow) => {
    expect(mutatedFlow).not.toBe(eventChecklistsFlow)
    expect(preservesChecklistPersistence(mutatedFlow)).toBe(false)
  })
})

describe("Maestro personal-event cancellation", () => {
  it("cold re-enters the list before proving preservation and confirmed deletion", () => {
    expect(preservesPersonalEventCancellation(personalEventsFlow)).toBe(true)
  })

  it.each([
    [
      "a bare back returns",
      replaceLast(
        personalEventsFlow,
        "- stopApp\n- openLink: timecalendar-dev://personal-events",
        "- back",
      ),
    ],
    [
      "cold re-entry is reordered",
      replaceLast(
        personalEventsFlow,
        "- stopApp\n- openLink: timecalendar-dev://personal-events",
        "- openLink: timecalendar-dev://personal-events\n- stopApp",
      ),
    ],
    [
      "cold re-entry is removed",
      replaceLast(
        personalEventsFlow,
        "- stopApp\n- openLink: timecalendar-dev://personal-events\n",
        "",
      ),
    ],
    [
      "the cancellation-preserved row wait is widened",
      personalEventsFlow.replace(
        'visible: "Maestro CRUD event"\n    timeout: 60000\n# Reopen',
        'visible: "Maestro CRUD event.*"\n    timeout: 60000\n# Reopen',
      ),
    ],
    [
      "the confirmed-deletion assertion is widened",
      personalEventsFlow.replace(
        'notVisible: "Maestro CRUD event"',
        'notVisible: "Maestro CRUD event.*"',
      ),
    ],
  ])("rejects when %s", (_name, mutatedFlow) => {
    expect(mutatedFlow).not.toBe(personalEventsFlow)
    expect(preservesPersonalEventCancellation(mutatedFlow)).toBe(false)
  })
})

describe("Maestro hidden-event restoration", () => {
  it("scrolls the restored target into view before asserting it", () => {
    // Run 33349187760: the final Agenda showed E2E Hide Control at the bottom
    // edge after the un-hide completed, while the following 16:00 seminar row
    // remained below the viewport. A plain wait cannot move the list.
    expect(hiddenEventsFlow).toMatch(
      /- scrollUntilVisible:\n\s+element:\n\s+text: "E2E Hide Seminar\(,\.\*\)\?"\n\s+direction: DOWN\n\s+centerElement: true\n\s+timeout: 60000\n- assertVisible: "E2E Hide Seminar\(,\.\*\)\?"\s*$/,
    )
  })
})

describe("Maestro iCal import journey", () => {
  it("follows the moved unlisted-institution journey to the URL option", () => {
    // Run 33351996623: both platforms tapped onboarding-school-missing and then
    // timed out waiting for Add a calendar by URL while the captured screen was
    // the new Which institution? step introduced by merged commit a10ab396.
    // Pin every inserted route edge so this proof fails if the flow restores the
    // obsolete direct jump or bypasses the user-visible manual-import choice.
    expect(flowSelectors(icalImportFlow).map(({ id }) => id)).toEqual([
      "onboarding-next",
      "onboarding-next",
      "onboarding-welcome-cta",
      "onboarding-school-missing",
      "onboarding-institution-input",
      "onboarding-institution-input",
      "onboarding-institution-input",
      "onboarding-institution-continue",
      "onboarding-institution-continue",
      "onboarding-programme-input",
      "onboarding-programme-input",
      "onboarding-programme-input",
      "onboarding-programme-continue",
      "onboarding-programme-continue",
      "onboarding-connect-continue",
      "onboarding-connect-continue",
      "onboarding-import-url",
      "onboarding-import-url",
      "ical-url-submit",
    ])
    expect(
      [...icalImportFlow.matchAll(/^\s*-\s*inputText:\s*"([^"]+)"\s*$/gm)].map(
        (match) => match[1],
      ),
    ).toEqual(["E2E Institution", "E2E Programme"])
    expect(flowTextSelectors(icalImportFlow).map(({ text }) => text)).toContain(
      "Add a calendar by URL",
    )
  })

  it("exact-gates each value before waiting for and tapping Continue", () => {
    expect(icalImportFlow).not.toMatch(/^\s*-\s*hideKeyboard\s*$/m)
    expect(
      preservesIcalCtaSequence(
        icalImportFlow,
        "institution",
        "E2E Institution",
      ),
    ).toBe(true)
    expect(
      preservesIcalCtaSequence(icalImportFlow, "programme", "E2E Programme"),
    ).toBe(true)
  })

  it.each([
    [
      "institution exact gate disappears",
      icalImportFlow.replace(
        '- extendedWaitUntil:\n    visible:\n      id: "onboarding-institution-input"\n      text: "E2E Institution"\n    timeout: 15000\n',
        "",
      ),
    ],
    [
      "programme exact value widens",
      icalImportFlow.replace(
        'text: "E2E Programme"',
        'text: "E2E Programme.*"',
      ),
    ],
    [
      "institution Continue bypasses its wait",
      icalImportFlow.replace(
        '- extendedWaitUntil:\n    visible:\n      id: "onboarding-institution-continue"\n    timeout: 15000\n- tapOn:\n    id: "onboarding-institution-continue"',
        '- tapOn:\n    id: "onboarding-institution-continue"',
      ),
    ],
    [
      "programme Continue tap moves before its wait",
      icalImportFlow.replace(
        '- extendedWaitUntil:\n    visible:\n      id: "onboarding-programme-continue"\n    timeout: 15000\n- tapOn:\n    id: "onboarding-programme-continue"',
        '- tapOn:\n    id: "onboarding-programme-continue"\n- extendedWaitUntil:\n    visible:\n      id: "onboarding-programme-continue"\n    timeout: 15000',
      ),
    ],
    [
      "hideKeyboard returns",
      icalImportFlow.replace(
        '- inputText: "E2E Institution"',
        '- inputText: "E2E Institution"\n- hideKeyboard',
      ),
    ],
  ])("rejects when %s", (_name, mutatedFlow) => {
    expect(mutatedFlow).not.toBe(icalImportFlow)
    expect(
      hideKeyboardCommands(mutatedFlow).length === 0 &&
        preservesIcalCtaSequence(
          mutatedFlow,
          "institution",
          "E2E Institution",
        ) &&
        preservesIcalCtaSequence(mutatedFlow, "programme", "E2E Programme"),
    ).toBe(false)
  })
})

describe("Maestro user-calendar rename synchronization", () => {
  it("gates Save on the exact target after two erase boundaries", () => {
    expect(userCalendarRenameFlow).toMatch(
      /- tapOn:\n\s+id: "user-calendar-rename-input"\n- eraseText\n- eraseText\n- inputText: "E2E Renamed Timetable"\n- extendedWaitUntil:\n\s+visible:\n\s+id: "user-calendar-rename-input"\n\s+text: "E2E Renamed Timetable"\n\s+timeout: 15000\n- tapOn:\n\s+id: "user-calendar-rename-save"/,
    )
  })

  it("retains the baseline, local-write, and server-convergence assertions", () => {
    expect(userCalendarRenameFlow).toMatch(
      /visible: "E2E Rename Baseline"[\s\S]*visible: "E2E Renamed Timetable"[\s\S]*- runFlow: rename-seed\.yaml[\s\S]*visible: "E2E Renamed Timetable"[\s\S]*- assertNotVisible: "E2E Rename Baseline"\s*$/,
    )
  })
})

describe("Maestro seeded-title text selectors", () => {
  it("finds the seeded titles and the title-extending labels", () => {
    // Either input parsing silently returning nothing would make the guard vacuous.
    expect(seededTitles).toContain("E2E Today Lecture")
    expect(titleExtendingLabels.length).toBeGreaterThan(0)
    expect(flows.flatMap((flow) => flow.textSelectors).length).toBeGreaterThan(
      0,
    )
  })

  it.each(flows.filter((flow) => flow.textSelectors.length > 0))(
    "$name matches every seeded title on every surface that renders it",
    ({ name, textSelectors }) => {
      const unreachable = textSelectors.flatMap(({ text, line }) =>
        unreachableRenderings(text).map(
          (rendering) =>
            `${name}:${line} — "${text}" cannot match "${rendering}"`,
        ),
      )

      expect(unreachable).toEqual([])
    },
  )

  it("rejects the bare title that made the iOS agenda assertion fail", () => {
    // The guard's own failure mode: a matcher that accepted everything would make
    // the assertion above vacuous. This is the exact selector that shipped broken.
    expect(unreachableRenderings("E2E Today Lecture")).toEqual([
      "E2E Today Lecture, 14:00 – 16:00 Room E2E Lecture",
      "E2E Today Lecture, 14:00 – 16:00 Room E2E Lecture. progress",
      "E2E Today Lecture, 14:00 – 16:00 Room E2E Lecture. View details",
      "E2E Today Lecture, 14:00 – 16:00 Room E2E Lecture. progress. View details",
    ])
    expect(unreachableRenderings("E2E Today Lecture(,.*)?")).toEqual([])
  })

  it("leaves a text selector that is not a seeded title alone", () => {
    // Scoped by construction: the rule only fires on a selector that already matches
    // a seeded title, so ordinary UI-copy assertions are untouched.
    expect(unreachableRenderings("Privacy policy")).toEqual([])
    expect(unreachableRenderings("Un-hide E2E Hide Seminar")).toEqual([])
  })
})
