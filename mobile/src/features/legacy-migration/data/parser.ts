import { sha256 } from "@noble/hashes/sha256"
import { bytesToHex } from "@noble/hashes/utils"

import { isRecord, normalizeEntity, normalizeHidden } from "./normalize"
import {
  DEFAULT_LIMITS,
  diagnose,
  emptyParsed,
  type EntityCandidate,
  type ErrorCode,
  type Limits,
  type ParsedSource,
  type SourceStore,
} from "./types"

const STORES = new Set<SourceStore>([
  "user_calendars",
  "personal_events",
  "checklist_items",
  "hidden_events",
])

function validUtf8(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length; ) {
    const first = bytes[i++]!
    if (first < 128) continue
    const count =
      first >= 0xc2 && first <= 0xdf
        ? 1
        : first >= 0xe0 && first <= 0xef
          ? 2
          : first >= 0xf0 && first <= 0xf4
            ? 3
            : -1
    if (count < 0 || i + count > bytes.length) return false
    const second = bytes[i]!
    if (
      (first === 0xe0 && second < 0xa0) ||
      (first === 0xed && second > 0x9f) ||
      (first === 0xf0 && second < 0x90) ||
      (first === 0xf4 && second > 0x8f)
    )
      return false
    for (let j = 0; j < count; j++)
      if ((bytes[i++]! & 0xc0) !== 0x80) return false
  }
  return true
}

export interface ReplayResult extends ParsedSource {
  fingerprint: string
  sizeBytes: number
}

export async function parseSembast(
  chunks: AsyncIterable<Uint8Array>,
  startedAt: string,
  limits: Limits = DEFAULT_LIMITS,
): Promise<ReplayResult> {
  const result = emptyParsed()
  const hash = sha256.create()
  const live = new Map<
    string,
    { store: SourceStore; value: unknown; line: number }
  >()
  let sizeBytes = 0,
    line = 0,
    lineSize = 0,
    oversized = false
  let parts: Uint8Array[] = []
  const error = (code: ErrorCode, fatal = false) => {
    diagnose(result.diagnostics, "parse", code, { line }, limits.errors)
    result.fatal ||= fatal
  }
  const processLine = (tail: boolean) => {
    line++
    if (line > limits.lines) {
      error("LINE_LIMIT", true)
      return
    }
    if (oversized) {
      error("LINE_TOO_LONG", line === 1)
      return
    }
    let bytes = new Uint8Array(lineSize)
    let offset = 0
    for (const part of parts) {
      bytes.set(part, offset)
      offset += part.length
    }
    if (
      line === 1 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf
    )
      bytes = bytes.subarray(3)
    if (!validUtf8(bytes)) {
      error("INVALID_UTF8", line === 1)
      return
    }
    const content = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes)
    if (line > 1 && content.trim() === "") return
    let record: unknown
    try {
      record = JSON.parse(content)
    } catch {
      error(
        line === 1
          ? "INVALID_METADATA"
          : tail
            ? "TRUNCATED_TAIL"
            : "MALFORMED_JSON",
        line === 1,
      )
      return
    }
    if (line === 1) {
      if (
        !isRecord(record) ||
        record.sembast !== 1 ||
        !Number.isInteger(record.version)
      ) {
        error("INVALID_METADATA", true)
        return
      }
      result.version = record.version as number
      if (result.version < 1 || result.version > 3)
        error("UNSUPPORTED_VERSION", true)
      return
    }
    if (!isRecord(record)) {
      error("MALFORMED_JSON")
      return
    }
    if (!STORES.has(record.store as SourceStore)) return
    const store = record.store as SourceStore
    if (
      (typeof record.key !== "string" &&
        !(
          typeof record.key === "number" && Number.isSafeInteger(record.key)
        )) ||
      (record.deleted !== undefined && typeof record.deleted !== "boolean")
    ) {
      error("MALFORMED_JSON")
      return
    }
    const key = JSON.stringify([store, record.key])
    if (record.deleted === true) {
      live.delete(key)
      return
    }
    if (!Object.hasOwn(record, "value")) {
      error("MALFORMED_JSON")
      return
    }
    live.set(key, { store, value: record.value, line })
    if (live.size > limits.records) error("FILE_LIMIT", true)
  }
  for await (const chunk of chunks) {
    sizeBytes += chunk.length
    hash.update(chunk)
    if (sizeBytes > limits.fileBytes) {
      error("FILE_LIMIT", true)
      break
    }
    let start = 0
    for (let i = 0; i <= chunk.length; i++) {
      if (i < chunk.length && chunk[i] !== 10) continue
      const fragment = chunk.subarray(start, i)
      lineSize += fragment.length
      if (lineSize > limits.lineBytes) {
        oversized = true
        parts = []
      }
      if (!oversized && fragment.length) parts.push(fragment.slice())
      if (i < chunk.length) {
        processLine(false)
        parts = []
        lineSize = 0
        oversized = false
        if (result.fatal) break
      }
      start = i + 1
    }
    if (result.fatal) break
  }
  if (!result.fatal && (lineSize > 0 || oversized)) processLine(true)
  if (line === 0) error("INVALID_METADATA", true)
  if (!result.fatal) {
    const candidates = new Map<string, EntityCandidate>()
    let hidden: { value: unknown; line: number } | undefined
    for (const entry of [...live.values()].sort((a, b) => a.line - b.line)) {
      result.counters[entry.store].candidate++
      if (entry.store === "hidden_events") {
        if (hidden) {
          diagnose(
            result.diagnostics,
            "normalize",
            "DUPLICATE_SOURCE_ID",
            { line: hidden.line, dataset: "hidden_events" },
            limits.errors,
          )
          result.counters.hidden_events.skipped_invalid++
        }
        hidden = entry
        continue
      }
      let candidate: EntityCandidate
      try {
        candidate = normalizeEntity(
          entry.store,
          entry.value,
          result.version!,
          startedAt,
          entry.line,
          limits,
        )
      } catch {
        result.counters[entry.store].skipped_invalid++
        diagnose(
          result.diagnostics,
          "normalize",
          "INVALID_RECORD",
          { line: entry.line, dataset: entry.store },
          limits.errors,
        )
        continue
      }
      const key = JSON.stringify([candidate.store, candidate.id])
      if (candidates.has(key)) {
        result.counters[entry.store].skipped_invalid++
        diagnose(
          result.diagnostics,
          "normalize",
          "DUPLICATE_SOURCE_ID",
          { line: candidates.get(key)!.line, dataset: entry.store },
          limits.errors,
        )
      }
      candidates.set(key, candidate)
    }
    const tokens = new Map<string, EntityCandidate>()
    for (const candidate of [...candidates.values()].sort(
      (a, b) => a.line - b.line,
    )) {
      if (candidate.store !== "user_calendars") continue
      const token = candidate.row.token as string
      const previous = tokens.get(token)
      if (previous) {
        candidates.delete(JSON.stringify([previous.store, previous.id]))
        result.counters.user_calendars.skipped_conflict++
        diagnose(
          result.diagnostics,
          "normalize",
          "DUPLICATE_SOURCE_TOKEN",
          { line: previous.line, dataset: "user_calendars" },
          limits.errors,
        )
      }
      tokens.set(token, candidate)
    }
    result.entities = [...candidates.values()]
    if (hidden)
      result.hidden = normalizeHidden(hidden.value, result, hidden.line, limits)
  }
  return { ...result, fingerprint: bytesToHex(hash.digest()), sizeBytes }
}
