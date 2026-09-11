import { fork } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"

type TracePrivacyProof = {
  error?: string
  spanCount: number
  categoryMatches: Record<string, number>
}

const runTracePrivacyProof = () =>
  new Promise<TracePrivacyProof>((resolve, reject) => {
    const child = fork(join(__dirname, "http-telemetry.fixture.ts"), [], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        OTEL_ENABLED: "false",
        OTEL_LOGS_EXPORTER: "none",
        OTEL_METRICS_EXPORTER: "none",
      },
      execArgv: [
        "--require",
        "ts-node/register",
        "--require",
        "tsconfig-paths/register",
      ],
      silent: true,
    })
    let stderr = ""
    let result: TracePrivacyProof | undefined
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.once("message", (message: TracePrivacyProof) => {
      result = message
    })
    child.once("error", reject)
    child.once("exit", (code) => {
      if (result?.error) return reject(new Error(result.error))
      if (!result || code !== 0) {
        return reject(
          new Error(
            `Activity trace fixture exited ${
              code ?? "without a code"
            }: ${stderr}`,
          ),
        )
      }
      resolve(result)
    })
  })

describe("Activity telemetry privacy inventory", () => {
  it("keeps automatic inbound HTTP spans free of body-derived categories", async () => {
    const proof = await runTracePrivacyProof()

    expect(proof.spanCount).toBeGreaterThan(0)
    expect(proof.categoryMatches).toEqual({
      token: 0,
      calendar: 0,
      log: 0,
      cursor: 0,
      content: 0,
    })
  })

  it("keeps explicit Activity telemetry limited to the metric service", () => {
    const root = join(__dirname, "../../modules/calendar-log")
    const files = [
      "controllers/calendar-log-v1.controller.ts",
      "mappers/calendar-log.mapper.ts",
      "repositories/calendar-log.repository.ts",
      "services/calendar-log.service.ts",
    ]
    const source = files
      .map((file) => readFileSync(join(root, file), "utf8"))
      .join("\n")

    expect(source).not.toMatch(/\bLogger\b|\.setAttribute\(|\btrace\./)
    expect(source).not.toMatch(/console\.(?:log|warn|error|debug)/)
  })

  it("pins the finite metric instrument and label vocabulary", () => {
    const source = readFileSync(
      join(
        __dirname,
        "../../modules/calendar-log/services/calendar-log-metrics.service.ts",
      ),
      "utf8",
    )

    expect(source.match(/meter\.create(?:Histogram|Counter)\(/g)).toHaveLength(
      4,
    )
    expect(source).toContain('"calendar_log_search_page_rows"')
    expect(source).toContain('"calendar_log_unread_count_duration"')
    expect(source).toContain('"calendar_log_search_total"')
    expect(source).toContain('"calendar_log_fragment_atomic_overflow_total"')
    expect(source).toContain(
      'export type CalendarLogSearchPage = "first" | "following"',
    )
    expect(source).toContain(
      'export type CalendarLogSearchOutcome = "ok" | "invalid_cursor"',
    )
  })
})
