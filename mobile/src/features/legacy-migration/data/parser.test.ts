import {
  byteChunks,
  encodeLines,
  FIXTURE_CALENDAR,
  FIXTURE_CHECKLIST,
  FIXTURE_EVENT,
  FIXTURE_HIDDEN,
  FIXTURE_TIME,
  fixtureLines,
  legacyLine,
} from "@/test-support/legacy-fixtures"

import { parseSembast } from "./parser"
import { DEFAULT_LIMITS } from "./types"

const parse = (lines: unknown[], overrides = {}) =>
  parseSembast(byteChunks(encodeLines(lines)), FIXTURE_TIME, {
    ...DEFAULT_LIMITS,
    ...overrides,
  })
const metadata = { version: 3, sembast: 1 }

it.each([1, 2, 3])(
  "normalizes every approved entity from version %s including nulls, local dates and exact colors",
  async (version) => {
    const result = await parse(fixtureLines(version))
    expect(result.fatal).toBe(false)
    expect(result.entities).toHaveLength(3)
    expect(result.entities[0]?.row).toMatchObject({
      school_id: null,
      visible: 0,
      last_updated_at: "2026-03-29T01:30:00.000Z",
    })
    expect(result.entities[1]?.row).toMatchObject({
      color: "#aAbBcC",
      title: FIXTURE_EVENT.title,
      location: "",
      description: null,
      exported_at: FIXTURE_TIME,
    })
    expect(result.entities[2]?.row).toMatchObject({
      event_uid: "synthetic-school-event",
      deleted_at: FIXTURE_TIME,
      is_checked: 1,
      order: 2,
    })
    expect(result.hidden).toEqual(FIXTURE_HIDDEN)
    expect(result.diagnostics.counts).toEqual([])
  },
)

it("replays writes, number/string keys and tombstones in source order", async () => {
  const result = await parse([
    metadata,
    legacyLine("personal_events", 1, FIXTURE_EVENT),
    legacyLine("personal_events", 1, { ...FIXTURE_EVENT, title: "last" }),
    legacyLine("personal_events", "1", { ...FIXTURE_EVENT, uid: "deleted" }),
    { store: "personal_events", key: "1", deleted: true },
  ])
  expect(result.entities.map((c) => c.row.title)).toEqual(["last"])
})

it("picks latest valid logical ID, then latest token, while invalid later duplicates cannot suppress siblings", async () => {
  const result = await parse([
    metadata,
    legacyLine("user_calendars", 1, FIXTURE_CALENDAR),
    legacyLine("user_calendars", 2, { ...FIXTURE_CALENDAR, name: "latest" }),
    legacyLine("user_calendars", 3, { ...FIXTURE_CALENDAR, id: "winner" }),
    legacyLine("user_calendars", 4, { ...FIXTURE_CALENDAR, name: 2 }),
  ])
  expect(result.entities.map((c) => c.id)).toEqual(["winner"])
  expect(result.counters.user_calendars).toMatchObject({
    candidate: 4,
    skipped_invalid: 2,
    skipped_conflict: 1,
  })
})

it("salvages malformed interior and truncated final lines with no raw diagnostics", async () => {
  const bytes =
    encodeLines(fixtureLines()) + 'SYNTHETIC_PRIVATE_BROKEN\n{"secret":'
  const result = await parseSembast(byteChunks(bytes, 1), FIXTURE_TIME)
  expect(result.entities).toHaveLength(3)
  expect(result.diagnostics.counts.map((e) => e.code)).toEqual([
    "MALFORMED_JSON",
    "TRUNCATED_TAIL",
  ])
  expect(JSON.stringify(result.diagnostics)).not.toContain("PRIVATE")
})

it.each([
  "",
  "{}\n",
  "[]\n",
  '{"sembast":1,"version":4}\n',
  '{"sembast":1,"version":-1}\n',
  '{"sembast":1,"version":1.1}\n',
  '{"sembast":1}\n',
  '{"version":3,',
])(
  "fails unsupported or absent metadata %p without importing",
  async (input) => {
    const result = await parseSembast(byteChunks(input), FIXTURE_TIME)
    expect(result.fatal).toBe(true)
    expect(result.entities).toEqual([])
  },
)

it("accepts a BOM only at byte zero and strict UTF8 across chunk boundaries", async () => {
  expect(
    (
      await parseSembast(
        byteChunks("\uFEFF" + encodeLines(fixtureLines()), 1),
        FIXTURE_TIME,
      )
    ).entities,
  ).toHaveLength(3)
  const result = await parseSembast(
    byteChunks(new Uint8Array([0xc0, 0xaf, 10]), 1),
    FIXTURE_TIME,
  )
  expect(result.diagnostics.counts[0]?.code).toBe("INVALID_UTF8")
  const later = await parseSembast(
    byteChunks(JSON.stringify(metadata) + "\n\uFEFF{}\n"),
    FIXTURE_TIME,
  )
  expect(later.diagnostics.counts[0]?.code).toBe("MALFORMED_JSON")
})

it("rejects UID-less historical records, invalid dates, nested fields and prototype-bearing values", async () => {
  const bad = [
    { ...FIXTURE_EVENT, uid: undefined },
    { ...FIXTURE_EVENT, startsAt: "2026-02-30T00:00:00Z" },
    { ...FIXTURE_EVENT, endsAt: "2025-01-01T00:00:00Z" },
    { ...FIXTURE_EVENT, description: {} },
    { ...FIXTURE_EVENT, color: "#FFFFFF00" },
    { ...FIXTURE_EVENT, color: "FFFFFFF" },
    { ...FIXTURE_EVENT, startsAt: "not-a-date" },
    { ...FIXTURE_EVENT, startsAt: "2026-03-29T01:00:00+99:00" },
    { ...FIXTURE_EVENT, startsAt: undefined },
    { ...FIXTURE_EVENT, endsAt: undefined },
    { ...FIXTURE_EVENT, exportedAt: undefined },
    { ...FIXTURE_EVENT, constructor: {} },
  ]
  const result = await parse([
    metadata,
    ...bad.map((v, i) => legacyLine("personal_events", i, v)),
    legacyLine("personal_events", "valid", FIXTURE_EVENT),
  ])
  expect(result.entities).toHaveLength(1)
  expect(result.counters.personal_events.skipped_invalid).toBe(bad.length)
})

it("salvages calendars and checklists independently when field types are invalid", async () => {
  const result = await parse([
    metadata,
    legacyLine("user_calendars", 1, {
      ...FIXTURE_CALENDAR,
      visible: undefined,
    }),
    legacyLine("user_calendars", 2, { ...FIXTURE_CALENDAR, visible: 1 }),
    legacyLine("checklist_items", 1, { ...FIXTURE_CHECKLIST, order: 1.5 }),
    legacyLine("checklist_items", 2, { ...FIXTURE_CHECKLIST, order: "1" }),
    legacyLine("hidden_events", 1, null),
  ])
  expect(result.entities).toHaveLength(1)
  expect(result.entities[0]?.row.visible).toBe(1)
  expect(result.counters.user_calendars.skipped_invalid).toBe(1)
  expect(result.counters.checklist_items.skipped_invalid).toBe(2)
  expect(result.counters.hidden_events.skipped_invalid).toBe(1)
  expect(result.hidden).toBeNull()
})

it("uses the final hidden record, deduplicates exact strings and salvages each array independently", async () => {
  const result = await parse([
    metadata,
    legacyLine("hidden_events", 1, FIXTURE_HIDDEN),
    legacyLine("hidden_events", 2, {
      uidHiddenEvents: ["a", "a", 2, "b"],
      namedHiddenEvents: false,
    }),
  ])
  expect(result.hidden).toEqual({
    uidHiddenEvents: ["a", "b"],
    namedHiddenEvents: [],
  })
  expect(result.counters.hidden_events.skipped_invalid).toBe(3)
  expect(
    (
      await parse([
        metadata,
        legacyLine("hidden_events", 1, {
          uidHiddenEvents: false,
          namedHiddenEvents: {},
        }),
      ])
    ).hidden,
  ).toBeNull()
})

it.each([-1, 0, 1])(
  "enforces file, line, record, text, array and diagnostic bounds at offset %s",
  async (offset) => {
    const input = encodeLines([
      metadata,
      legacyLine("personal_events", 1, FIXTURE_EVENT),
    ])
    const bytes = new TextEncoder().encode(input).length
    expect(
      (
        await parseSembast(byteChunks(input), FIXTURE_TIME, {
          ...DEFAULT_LIMITS,
          fileBytes: bytes + offset,
        })
      ).fatal,
    ).toBe(offset < 0)
    expect((await parse([metadata, {}], { lines: 2 + offset })).fatal).toBe(
      offset < 0,
    )
    expect(
      (
        await parse(
          [metadata, legacyLine("personal_events", 1, FIXTURE_EVENT)],
          { records: 1 + offset },
        )
      ).fatal,
    ).toBe(offset < 0)
    const lineBytes = new TextEncoder().encode(
      JSON.stringify(legacyLine("personal_events", 1, FIXTURE_EVENT)),
    ).length
    expect(
      (
        await parse(
          [metadata, legacyLine("personal_events", 1, FIXTURE_EVENT)],
          { lineBytes: lineBytes + offset },
        )
      ).entities.length,
    ).toBe(offset < 0 ? 0 : 1)
    expect(
      (
        await parse(
          [
            metadata,
            legacyLine("personal_events", 1, {
              ...FIXTURE_EVENT,
              title: "a".repeat(32),
            }),
          ],
          { textBytes: 32 + offset },
        )
      ).entities.length,
    ).toBe(offset < 0 ? 0 : 1)
    const hidden = await parse(
      [
        metadata,
        legacyLine("hidden_events", 1, {
          uidHiddenEvents: ["a", "b"],
          namedHiddenEvents: [],
        }),
      ],
      { arrayMembers: 2 + offset },
    )
    expect(hidden.hidden?.uidHiddenEvents.length).toBe(offset < 0 ? 0 : 2)
    const errors = await parse(
      [
        metadata,
        legacyLine("personal_events", 1, {}),
        legacyLine("personal_events", 2, {}),
      ],
      { errors: 2 + offset },
    )
    expect(errors.diagnostics.examples.length).toBe(Math.min(2, 2 + offset))
    expect(errors.diagnostics.truncated).toBe(offset < 0)
  },
)

it("counts physical blank lines and skips an oversized line without accumulating it", async () => {
  const result = await parseSembast(
    byteChunks(
      JSON.stringify(metadata) +
        "\n" +
        "x".repeat(500) +
        "\n" +
        JSON.stringify(legacyLine("personal_events", 1, FIXTURE_EVENT)) +
        "\n",
      13,
    ),
    FIXTURE_TIME,
    { ...DEFAULT_LIMITS, lineBytes: 400 },
  )
  expect(result.entities).toHaveLength(1)
  expect(result.diagnostics.counts[0]?.code).toBe("LINE_TOO_LONG")
  expect(
    (
      await parseSembast(
        byteChunks(JSON.stringify(metadata) + "\n\n\n"),
        FIXTURE_TIME,
        { ...DEFAULT_LIMITS, lines: 2 },
      )
    ).fatal,
  ).toBe(true)
})
