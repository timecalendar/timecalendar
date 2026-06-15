import { randomUUID } from "expo-crypto"

// The single import site of the uid generator (D7) — a thin wrapper over
// expo-crypto's randomUUID (a v4 UUID via the platform CSPRNG). The normal add
// path uses the server DTO's `id` (the canonical identity carried by
// CalendarForPublic); newId() exists for a future local-only source / a create
// path that lacks a server id. Keeping it one function makes the generator
// swappable; the Phase-09 importer bypasses it by supplying its own recovered id
// to the repository's upsert (same posture as personal-events/data/uid.ts).
export function newId(): string {
  return randomUUID()
}
