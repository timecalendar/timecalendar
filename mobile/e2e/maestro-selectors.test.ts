// The app tsconfig resolves modules with the `react-native` condition, under which
// @types/node's exports do not match — so the Node types this repo-facing (never
// bundled) proof needs are pulled in explicitly for this file.
/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

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
//  3. A testID may be a template literal (`` testID={`checklist-check-${uuid}`} ``),
//     which stands for the whole family of ids sharing its static parts.

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
function declaredTestIds(source: string): string[] {
  const literals = [...source.matchAll(/testID(?:=\{?|:\s*)"([^"]+)"/g)].map(
    (match) => match[1] as string,
  )
  const templates = [...source.matchAll(/testID=\{`([^`]+)`\}/g)].map((match) =>
    (match[1] as string).replace(/\$\{[^}]*\}/g, INTERPOLATION_SAMPLE),
  )
  return [...literals, ...templates]
}

const declaredIds = [
  ...new Set(
    filesUnder(srcDir, [".ts", ".tsx"])
      .filter((file) => !/\.test\.tsx?$/.test(file))
      .flatMap((file) => declaredTestIds(readFileSync(file, "utf8"))),
  ),
]

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

const flows = filesUnder(flowsDir, [".yaml"]).map((file) => ({
  name: file.slice(flowsDir.length + 1),
  selectors: flowSelectors(readFileSync(file, "utf8")),
  textSelectors: flowTextSelectors(readFileSync(file, "utf8")),
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
  return declaredIds.some((id) => pattern.test(id))
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
  })

  it("resolves a testID declared as an object property", () => {
    expect(resolves("settings-feedback")).toBe(true)
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
      "E2E Today Lecture, 14:00 – 16:00 Room E2E Lecture. View details",
    ])
    expect(unreachableRenderings("E2E Today Lecture(,.*)?")).toEqual([])
  })

  it("leaves a text selector that is not a seeded title alone", () => {
    // Scoped by construction: the rule only fires on a selector that already matches
    // a seeded title, so ordinary UI-copy assertions are untouched.
    expect(unreachableRenderings("Privacy policy")).toEqual([])
    expect(unreachableRenderings("Un-hide E2E Today Seminar")).toEqual([])
  })
})
