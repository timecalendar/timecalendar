import { randomUUID } from "expo-crypto"

// The single, swappable uid seam for every device-local record identity
// (personal_events.uid, user_calendars.id, checklist_items.uuid) — a thin
// wrapper over expo-crypto's randomUUID (a v4 UUID via the platform CSPRNG, the
// same RFC-4122 shape the Flutter `uuid` package emits, so local and imported
// uids are indistinguishable and never collide). Keeping it one function makes
// the generator swappable; the Phase-09 importer bypasses it by supplying its
// own recovered id to the repository's upsert.
export function newId(): string {
  return randomUUID()
}
