import { readFileSync } from "fs"
import { join } from "path"

// testing.md → Time zones, ADR 066. The unit suite must pass in any process
// zone; these zones break each class of zone defect.
const ZONES = ["Pacific/Kiritimati", "Pacific/Pago_Pago", "America/St_Johns"]

const read = (path: string) => readFileSync(join(__dirname, path), "utf8")

function jobBlock(workflow: string, job: string): string {
  const start = workflow.indexOf(`\n  ${job}:\n`)
  expect(start).toBeGreaterThanOrEqual(0)
  const rest = workflow.slice(start + 1)
  const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/)
  return next === -1 ? rest : rest.slice(0, next + 1)
}

function testStep(job: string): string {
  return job.slice(job.indexOf("- name: Test\n"))
}

describe("the CI time-zone matrix", () => {
  const workflow = read("../.github/workflows/ci-mobile.yml")

  it("runs the full suite under each matrix zone", () => {
    const job = jobBlock(workflow, "test-mobile-timezones")
    expect(job).toContain("fail-fast: false")
    expect(job).toContain(`tz: [${ZONES.join(", ")}]`)
    const step = testStep(job)
    expect(step).toContain("TZ: ${{ matrix.tz }}")
    expect(step).toMatch(/run: npm test\n?$/)
  })

  it("pins the coverage run to UTC", () => {
    const step = testStep(jobBlock(workflow, "test-mobile"))
    expect(step).toContain("TZ: UTC")
    expect(step).toContain("run: npm test -- --coverage")
  })

  it("reproduces the same zones locally", () => {
    const { scripts } = JSON.parse(read("package.json")) as {
      scripts: Record<string, string>
    }
    expect(scripts["test:timezones"]).toBe("bash ./scripts/test-timezones.sh")
    expect(read("scripts/test-timezones.sh")).toContain(
      `for zone in ${ZONES.join(" ")}; do`,
    )
  })
})

it("runs the worker in the process zone", () => {
  const zone = process.env.TZ
  if (zone === undefined || zone === "") return
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(zone)
})
