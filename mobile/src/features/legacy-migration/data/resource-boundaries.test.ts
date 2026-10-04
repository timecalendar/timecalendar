import {
  byteChunks,
  encodeLines,
  FIXTURE_EVENT,
  FIXTURE_TIME,
  legacyLine,
} from "@/test-support/legacy-fixtures"

import { parseSembast } from "./parser"
import { DEFAULT_LIMITS } from "./types"

const metadata = JSON.stringify({ version: 3, sembast: 1 }) + "\n"
const parse = (text: string) =>
  parseSembast(byteChunks(text, 64 * 1024), FIXTURE_TIME)

it.each([-1, 0, 1])(
  "enforces actual 256KiB text, 512B IDs, 2MiB lines and 50000-array caps at offset %s",
  async (offset) => {
    const event = {
      ...FIXTURE_EVENT,
      title: "x".repeat(DEFAULT_LIMITS.textBytes + offset),
    }
    expect(
      (
        await parse(
          encodeLines([
            { version: 3, sembast: 1 },
            legacyLine("personal_events", 1, event),
          ]),
        )
      ).entities.length,
    ).toBe(offset > 0 ? 0 : 1)
    const uid = { ...FIXTURE_EVENT, uid: "x".repeat(512 + offset) }
    expect(
      (
        await parse(
          encodeLines([
            { version: 3, sembast: 1 },
            legacyLine("personal_events", 1, uid),
          ]),
        )
      ).entities.length,
    ).toBe(offset > 0 ? 0 : 1)
    const largeLine = "{}" + " ".repeat(DEFAULT_LIMITS.lineBytes + offset - 2)
    const result = await parse(metadata + largeLine + "\n")
    expect(
      result.diagnostics.counts.some((entry) => entry.code === "LINE_TOO_LONG"),
    ).toBe(offset > 0)
    const hidden = await parse(
      encodeLines([
        { version: 3, sembast: 1 },
        legacyLine("hidden_events", 1, {
          uidHiddenEvents: Array.from(
            { length: DEFAULT_LIMITS.arrayMembers + offset },
            () => "same",
          ),
          namedHiddenEvents: [],
        }),
      ]),
    )
    expect(hidden.hidden?.uidHiddenEvents).toEqual(offset > 0 ? [] : ["same"])
  },
)

it.each([-1, 0, 1])(
  "enforces actual physical-line and live-record caps at offset %s",
  async (offset) => {
    const lines = await parse(
      metadata + "\n".repeat(DEFAULT_LIMITS.lines + offset - 1),
    )
    expect(lines.fatal).toBe(offset > 0)
    async function* records() {
      yield new TextEncoder().encode(metadata)
      for (
        let start = 0;
        start < DEFAULT_LIMITS.records + offset;
        start += 1000
      ) {
        const count = Math.min(1000, DEFAULT_LIMITS.records + offset - start)
        yield new TextEncoder().encode(
          encodeLines(
            Array.from({ length: count }, (_, i) =>
              legacyLine("personal_events", i + start, {}),
            ),
          ),
        )
      }
    }
    const recordsResult = await parseSembast(records(), FIXTURE_TIME)
    expect(recordsResult.fatal).toBe(offset > 0)
    expect(recordsResult.diagnostics.examples.length).toBeLessThanOrEqual(100)
  },
)

it.each([-1, 0, 1])(
  "streams the real 64MiB boundary without retaining a whole-file string at offset %s",
  async (offset) => {
    async function* bytes() {
      const first = new TextEncoder().encode(metadata)
      yield first
      let remaining = DEFAULT_LIMITS.fileBytes + offset - first.length
      const block = new Uint8Array(64 * 1024).fill(32)
      while (remaining > 0) {
        const length = Math.min(block.length, remaining)
        yield block.subarray(0, length)
        remaining -= length
      }
    }
    const result = await parseSembast(bytes(), FIXTURE_TIME)
    expect(result.fatal).toBe(offset > 0)
    expect(result.sizeBytes).toBe(DEFAULT_LIMITS.fileBytes + offset)
  },
)
