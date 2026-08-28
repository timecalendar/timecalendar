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

const mobileRoot = join(__dirname, "..")
const flowsDir = join(mobileRoot, ".maestro")
const srcDir = join(mobileRoot, "src")

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

const declaredIds = new Set(
  filesUnder(srcDir, [".ts", ".tsx"])
    .filter((file) => !/\.test\.tsx?$/.test(file))
    .flatMap((file) => declaredTestIds(readFileSync(file, "utf8"))),
)

const flows = filesUnder(flowsDir, [".yaml"]).map((file) => ({
  name: file.slice(flowsDir.length + 1),
  selectors: flowSelectors(readFileSync(file, "utf8")),
}))

function resolves(selector: string): boolean {
  const pattern = new RegExp(`^(?:${selector})$`)
  return [...declaredIds].some((id) => pattern.test(id))
}

describe("Maestro flow selectors", () => {
  it("finds the flows and the app testIDs", () => {
    // A parser that silently matched nothing would make every assertion below pass.
    expect(flows.length).toBeGreaterThan(0)
    expect(flows.flatMap((flow) => flow.selectors).length).toBeGreaterThan(0)
    expect(declaredIds.size).toBeGreaterThan(0)
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
