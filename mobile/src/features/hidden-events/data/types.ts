// The persisted hidden-events set (design D1/D2, ADR 023) — stored through
// @/storage as a SINGLE JSON-encoded record under one flat key, mirroring the
// Flutter HiddenEvent.toMap() wire format VERBATIM for Phase-09 importer fidelity:
// { uidHiddenEvents: String[], namedHiddenEvents: String[] }. There is no server
// backup — the set is irreplaceable, so the parser is TOTAL (a corrupt/absent
// value reads as the empty set, never throws — the views then render everything,
// the safe default) and the importer can write the recovered blob verbatim.

export interface HiddenEventsSet {
  uidHiddenEvents: string[]
  namedHiddenEvents: string[]
}

// The single flat namespaced storage key (the i18n flat-key convention applied to
// storage for greppability). One key holds the JSON record, matching the Flutter
// single-record store shape (D1 — NOT two keys).
export const HIDDEN_EVENTS_KEYS = {
  set: "hiddenEvents.set",
} as const

// The empty default — the value an absent/corrupt blob decodes to. A fresh
// install reads this (no key written yet); a view filters out nothing.
export function emptyHiddenEvents(): HiddenEventsSet {
  return { uidHiddenEvents: [], namedHiddenEvents: [] }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
}

// Total parser for the persisted blob: a JSON-encoded
// { uidHiddenEvents, namedHiddenEvents } record. An unset, non-JSON, wrong-shape,
// or non-string-array value → the empty set, NEVER throws (mirrors
// parseGroupValues). The store owns the JSON parse/validation — the one place it
// lives (D2). Both lists are parsed independently, so a partially-corrupt blob
// keeps the half that is valid (defensive, never throws).
export function parseHiddenEvents(raw: string | undefined): HiddenEventsSet {
  if (raw === undefined) return emptyHiddenEvents()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== "object") {
      return emptyHiddenEvents()
    }
    const record = parsed as Record<string, unknown>
    return {
      uidHiddenEvents: isStringArray(record.uidHiddenEvents)
        ? record.uidHiddenEvents
        : [],
      namedHiddenEvents: isStringArray(record.namedHiddenEvents)
        ? record.namedHiddenEvents
        : [],
    }
  } catch {
    return emptyHiddenEvents()
  }
}

// Encode the set back to the verbatim Flutter-shape JSON. The key order/shape is
// { uidHiddenEvents, namedHiddenEvents } — importer-fidelity verbatim.
export function encodeHiddenEvents(set: HiddenEventsSet): string {
  return JSON.stringify({
    uidHiddenEvents: set.uidHiddenEvents,
    namedHiddenEvents: set.namedHiddenEvents,
  })
}
