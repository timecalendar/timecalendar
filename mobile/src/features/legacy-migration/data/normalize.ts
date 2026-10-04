import {
  diagnose,
  type EntityCandidate,
  type Limits,
  type ParsedSource,
  type Row,
  type SourceStore,
} from "./types"

export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    !Object.hasOwn(value, "__proto__") &&
    !Object.hasOwn(value, "constructor") &&
    !Object.hasOwn(value, "prototype")
  )
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

function text(value: unknown, max: number, nonempty = false): string {
  if (
    typeof value !== "string" ||
    (nonempty && value.length === 0) ||
    byteLength(value) > max
  )
    throw new Error("INVALID_RECORD")
  return value
}

function instant(value: unknown): string {
  // Flutter writes both UTC instants and device-local ISO dates. Keep the latter's
  // local-zone interpretation, just as Dart DateTime.parse does on the same device.
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})?$/.test(
      value,
    )
  )
    throw new Error("INVALID_RECORD")
  const year = Number(value.slice(0, 4)),
    month = Number(value.slice(5, 7)),
    day = Number(value.slice(8, 10))
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
    Number(value.slice(11, 13)) > 23 ||
    Number(value.slice(14, 16)) > 59 ||
    Number(value.slice(17, 19)) > 59
  )
    throw new Error("INVALID_RECORD")
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new Error("INVALID_RECORD")
  return date.toISOString()
}

function optional(
  value: unknown,
  convert: (input: unknown) => string,
): string | null {
  return value == null ? null : convert(value)
}

function boolean(value: unknown): number {
  if (typeof value !== "boolean") throw new Error("INVALID_RECORD")
  return value ? 1 : 0
}

export function normalizeEntity(
  store: Exclude<SourceStore, "hidden_events">,
  value: unknown,
  version: number,
  startedAt: string,
  line: number,
  limits: Limits,
): EntityCandidate {
  if (!isRecord(value)) throw new Error("INVALID_RECORD")
  const id = (v: unknown) => text(v, 512, true)
  const userText = (v: unknown) => text(v, limits.textBytes)
  let row: Row
  let identity: string
  if (store === "user_calendars") {
    identity = id(value.id)
    row = {
      id: identity,
      token: text(value.token, limits.textBytes, true),
      name: text(value.name, limits.textBytes, true),
      school_name: optional(value.schoolName, userText),
      school_id: optional(value.schoolId, userText),
      last_updated_at: instant(value.lastUpdatedAt),
      created_at: instant(value.createdAt),
      visible: value.visible === undefined ? 1 : boolean(value.visible),
    }
  } else if (store === "personal_events") {
    identity = id(value.uid)
    const color = text(value.color, 7)
    if (!/^#[\da-fA-F]{6}$/.test(color)) throw new Error("INVALID_RECORD")
    const startsAt = instant(
      value.startsAt ?? (version === 1 ? value.start : undefined),
    )
    const endsAt = instant(
      value.endsAt ?? (version === 1 ? value.end : undefined),
    )
    if (endsAt < startsAt) throw new Error("INVALID_RECORD")
    row = {
      uid: identity,
      title: userText(value.title),
      color,
      starts_at: startsAt,
      ends_at: endsAt,
      exported_at: instant(
        value.exportedAt ?? (version === 1 ? startedAt : undefined),
      ),
      location: optional(value.location, userText),
      description: optional(value.description, userText),
    }
  } else {
    identity = id(value.uuid)
    if (typeof value.order !== "number" || !Number.isSafeInteger(value.order))
      throw new Error("INVALID_RECORD")
    row = {
      uuid: identity,
      event_uid: id(value.eventUid),
      content: userText(value.content),
      is_checked: boolean(value.isChecked),
      order: value.order,
      created_at: optional(value.createdAt, instant),
      updated_at: optional(value.updatedAt, instant),
      deleted_at: optional(value.deletedAt, instant),
    }
  }
  return { store, id: identity, row, line }
}

export function normalizeHidden(
  value: unknown,
  result: ParsedSource,
  line: number,
  limits: Limits,
): ParsedSource["hidden"] {
  let usable = false
  const invalid = () => {
    result.counters.hidden_events.skipped_invalid++
    diagnose(
      result.diagnostics,
      "normalize",
      "INVALID_RECORD",
      { line, dataset: "hidden_events" },
      limits.errors,
    )
  }
  const array = (input: unknown, maxBytes: number): string[] => {
    if (!Array.isArray(input) || input.length > limits.arrayMembers) {
      invalid()
      return []
    }
    if (input.length === 0) usable = true
    const accepted = new Set<string>()
    for (const item of input) {
      try {
        accepted.add(text(item, maxBytes, true))
        usable = true
      } catch {
        invalid()
      }
    }
    return [...accepted]
  }
  if (!isRecord(value)) {
    invalid()
    return null
  }
  const hidden = {
    uidHiddenEvents: array(value.uidHiddenEvents, 512),
    namedHiddenEvents: array(value.namedHiddenEvents, limits.textBytes),
  }
  return usable ? hidden : null
}
