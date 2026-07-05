// The shared row↔domain glue for the TEXT-ISO + nullable SQLite storage format
// (ADR 011/018/021/024) — four PURE primitives the four feature mappers hand-
// rolled independently. Each is a mechanical alias of the exact expression it
// replaces (no generic mapper factory — the four primitives are the shareable
// unit; a schema-driven factory would be speculative machinery for four mappers
// with genuinely different field sets, R-2). Apply them ONLY where a field is a
// real Date or a genuine null↔undefined passthrough — never to re-canonicalize a
// DTO string, which stays explicit for readability.

export function isoToDate(iso: string): Date {
  return new Date(iso)
}

export function dateToIso(date: Date): string {
  return date.toISOString()
}

export function nullToUndef<T>(value: T | null): T | undefined {
  return value ?? undefined
}

export function undefToNull<T>(value: T | undefined): T | null {
  return value ?? null
}
