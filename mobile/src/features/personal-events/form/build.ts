import { newEventId, type PersonalEvent } from "@/features/personal-events/data"

import type { EventFormValues } from "./types"

// Pure event assembly (design D2/D8) — mirrors the Flutter `buildEvent`:
//  - create (no existing): a fresh uid via B1's newEventId() wrapper,
//    exportedAt = now;
//  - edit (existing): preserve existing.uid, refresh exportedAt = now.
// `exportedAt` is "the moment this event was last written from this app" (its
// name comes from the Flutter export/backup lineage — not a created-at, D8).
//
// String fields are trimmed; an empty trimmed location/description becomes
// undefined (the optional domain fields). Dates and the #RRGGBB color string
// pass through UNCHANGED — B1's eventToRow owns the canonical-UTC ISO + verbatim
// hex storage encoding (ADR 011); B2 does not re-encode here.
export function buildEventFromForm(
  values: EventFormValues,
  existing?: PersonalEvent,
): PersonalEvent {
  const location = values.location.trim()
  const description = values.description.trim()

  return {
    uid: existing?.uid ?? newEventId(),
    title: values.title.trim(),
    color: values.color,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
    exportedAt: new Date(),
    location: location.length > 0 ? location : undefined,
    description: description.length > 0 ? description : undefined,
  }
}
