import { randomUUID } from "expo-crypto"

// The single import site of the uid generator (D2) — a thin wrapper over
// expo-crypto's randomUUID (a v4 UUID via the platform CSPRNG, the same RFC-4122
// shape the Flutter `uuid` package emits, so local and imported uids are
// indistinguishable and never collide). Keeping it one function makes the
// generator swappable; the Phase-09 importer bypasses it by supplying its own
// recovered uid to the repository's upsert.
export function newEventId(): string {
  return randomUUID()
}
