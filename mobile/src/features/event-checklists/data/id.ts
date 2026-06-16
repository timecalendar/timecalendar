import { randomUUID } from "expo-crypto"

// The single import site of the uid generator (ADR 024) — a thin wrapper over
// expo-crypto's randomUUID (a v4 UUID via the platform CSPRNG), mirroring the
// Flutter ChecklistItem constructor's `uuid ?? Uuid().v4()`. A locally-added
// checklist item gets its uuid here; the Phase-09 importer bypasses it by
// supplying its own recovered uuid to the repository's add (the uuid is the
// identity in both the sembast store and the wire format — same posture as
// personal-events/data/uid.ts and user-calendars/id.ts).
export function newId(): string {
  return randomUUID()
}
