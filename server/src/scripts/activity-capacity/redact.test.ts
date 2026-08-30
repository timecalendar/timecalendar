import { REDACTED, redactPlan } from "./redact"

describe("redactPlan", () => {
  it("redacts a UUID inside an Index Cond", () => {
    const line =
      `  Index Cond: ("calendarId" = ANY ` +
      `('{6f9619ff-8b86-d011-b42d-00cf4fc964ff}'::uuid[]))`

    const redacted = redactPlan(line)

    expect(redacted).not.toContain("6f9619ff")
    expect(redacted).toContain(REDACTED)
    // The plan structure a reader needs survives.
    expect(redacted).toContain("Index Cond")
    expect(redacted).toContain('"calendarId"')
  })

  it("redacts a quoted token literal", () => {
    const line = `  Filter: (("token")::text = 'k7Fq2xTnJ4bV9wLd'::text)`

    const redacted = redactPlan(line)

    expect(redacted).not.toContain("k7Fq2xTnJ4bV9wLd")
    expect(redacted).toBe(`  Filter: (("token")::text = ${REDACTED}::text)`)
  })

  it("redacts a quoted event title", () => {
    const line = `  Filter: (title = 'Anatomie — CM 3, amphi Pasteur')`

    const redacted = redactPlan(line)

    expect(redacted).not.toContain("Anatomie")
    expect(redacted).not.toContain("Pasteur")
    expect(redacted).toBe(`  Filter: (title = ${REDACTED})`)
  })

  it("redacts every literal when several appear on one line", () => {
    const line = `  Index Cond: (a = 'first' AND b = 'second' AND c = 'third')`

    const redacted = redactPlan(line)

    expect(redacted).toBe(
      `  Index Cond: (a = ${REDACTED} AND b = ${REDACTED} AND c = ${REDACTED})`,
    )
  })

  it("redacts a literal containing an escaped quote without stopping early", () => {
    const line = `  Filter: (title = 'Travaux d''étude' AND location = 'B12')`

    const redacted = redactPlan(line)

    expect(redacted).not.toContain("étude")
    expect(redacted).not.toContain("B12")
    expect(redacted).toBe(
      `  Filter: (title = ${REDACTED} AND location = ${REDACTED})`,
    )
  })

  it("leaves a plan line with nothing to redact unchanged", () => {
    const line =
      "  ->  Index Scan Backward using IDX_calendar_log_calendar_createdAt " +
      "on calendar_log  (cost=0.43..812.55 rows=164 width=88) " +
      "(actual time=0.021..0.310 rows=51 loops=1)"

    expect(redactPlan(line)).toBe(line)
  })

  it("redacts across a multi-line plan", () => {
    const plan = [
      "Limit  (cost=0.43..12.55 rows=51 width=88)",
      `  Index Cond: ("calendarId" = '6f9619ff-8b86-d011-b42d-00cf4fc964ff'::uuid)`,
      "  Buffers: shared hit=12",
    ].join("\n")

    const redacted = redactPlan(plan)

    expect(redacted).not.toContain("6f9619ff")
    expect(redacted).toContain("Buffers: shared hit=12")
    expect(redacted.split("\n")).toHaveLength(3)
  })
})
