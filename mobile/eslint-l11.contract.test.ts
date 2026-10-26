import { spawnSync } from "child_process"

// lint-format.md → L11. Lints each import form through the real
// eslint.config.js, so the test proves the rule is wired to src/ as well as
// what it matches. ESLint runs in a child process: its flat-config loader and
// plugins do not load under jest-expo.
const PROBE = "src/features/calendar/data/l11-probe.ts"
const RESTRICTION_RULES = ["no-restricted-imports", "no-restricted-syntax"]

type Message = { ruleId: string | null; message: string; fatal?: boolean }

const banned: [string, string][] = [
  [
    "a named import",
    `import { getTimezoneOffset } from "date-fns-tz"
export const o = getTimezoneOffset("UTC", new Date())`,
  ],
  [
    "an aliased import",
    `import { getTimezoneOffset as offset } from "date-fns-tz"
export const o = offset("UTC", new Date())`,
  ],
  [
    "a namespace import",
    `import * as tz from "date-fns-tz"
export const o = tz.getTimezoneOffset("UTC", new Date())`,
  ],
  ["a default import", `import tz from "date-fns-tz"\nexport const o = tz`],
  ["a named re-export", `export { getTimezoneOffset } from "date-fns-tz"`],
  ["a namespace re-export", `export * as tz from "date-fns-tz"`],
  [
    "a dynamic import",
    `export const load = async () => await import("date-fns-tz")`,
  ],
  [
    "a template-literal dynamic import",
    "export const load = async () => await import(`date-fns-tz`)",
  ],
  [
    "the getTimezoneOffset sub-path",
    `import { getTimezoneOffset } from "date-fns-tz/getTimezoneOffset"
export const o = getTimezoneOffset("UTC", new Date())`,
  ],
  [
    "the fp getTimezoneOffset sub-path",
    `import getTimezoneOffset from "date-fns-tz/fp/getTimezoneOffset"
export const o = getTimezoneOffset`,
  ],
  [
    "the fp barrel",
    `import { getTimezoneOffset } from "date-fns-tz/fp"
export const o = getTimezoneOffset`,
  ],
  [
    "a dynamic sub-path import",
    `export const load = async () => await import("date-fns-tz/getTimezoneOffset")`,
  ],
]

const allowed: [string, string][] = [
  [
    "the allowed helpers",
    `import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz"
export const helpers = [formatInTimeZone, fromZonedTime, toZonedTime]`,
  ],
  [
    "an allowed helper sub-path",
    `import { formatInTimeZone } from "date-fns-tz/formatInTimeZone"
export const helper = formatInTimeZone`,
  ],
  ["Date#getTimezoneOffset", `export const o = new Date().getTimezoneOffset()`],
]

const LINT_SCRIPT = `
const { ESLint } = require("eslint")
const cases = JSON.parse(require("fs").readFileSync(0, "utf8"))
const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfig: { rules: { "prettier/prettier": "off" } },
})
Promise.all(
  cases.map((code) => eslint.lintText(code, { filePath: ${JSON.stringify(PROBE)} })),
).then((results) => {
  process.stdout.write(JSON.stringify(results.map(([result]) => result.messages)))
})
`

function lintAll(codes: string[]): Message[][] {
  const result = spawnSync(process.execPath, ["-e", LINT_SCRIPT], {
    cwd: __dirname,
    input: JSON.stringify(codes),
    encoding: "utf8",
  })
  if (result.status !== 0) {
    throw new Error(`ESLint exited ${result.status}: ${result.stderr}`)
  }
  const reports = JSON.parse(result.stdout) as Message[][]
  expect(reports).toHaveLength(codes.length)
  return reports
}

const cases = [...banned, ...allowed]
const reports = new Map<string, Message[]>()

beforeAll(() => {
  const results = lintAll(cases.map(([, code]) => code))
  cases.forEach(([form], index) => reports.set(form, results[index] ?? []))
})

const restrictions = (form: string) =>
  reports
    .get(form)!
    .filter((message) => RESTRICTION_RULES.includes(message.ruleId ?? ""))
    .map((message) => message.message)

describe("L11 bans every date-fns-tz form that reaches getTimezoneOffset", () => {
  it.each(cases.map(([form]) => form))("parses %s", (form) => {
    expect(reports.get(form)!.filter((message) => message.fatal)).toEqual([])
  })

  it.each(banned.map(([form]) => form))("reports %s", (form) => {
    const messages = restrictions(form)
    expect(messages.length).toBeGreaterThan(0)
    expect(
      messages.some(
        (message) =>
          message.includes("zoneOffsetMinutes") || message.includes("L11"),
      ),
    ).toBe(true)
  })

  it.each(allowed.map(([form]) => form))("leaves %s clean", (form) => {
    expect(restrictions(form)).toEqual([])
  })
})
