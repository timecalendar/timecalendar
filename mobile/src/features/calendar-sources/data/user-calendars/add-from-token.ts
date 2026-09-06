import { calendarControllerFindCalendarByToken } from "@/api/generated/calendars/calendars"

import { upsert } from "./repository"
import { fromCalendarForPublic } from "./types"

// The import-by-token seam (ADR 030 / D2) — the resolve+upsert HALF of
// `useAddCalendar.addCalendarFromUrl`, without the create-POST: an import-by-token
// already holds the token, so it skips `POST /calendars {url}` and goes straight to
//   GET /calendars/by-token/{token}  → CalendarForPublic  (resolve metadata)
//   fromCalendarForPublic(dto)       → domain UserCalendar
//   upsert(calendar)                 → durable user_calendars row (by id)
//
// It reuses the ONE tested persist path (`fromCalendarForPublic` → `upsert`,
// storage.md `user_calendars`) rather than a parallel write, so no fidelity drift.
// A plain async function — not a hook — because the sole caller (the dev-import
// route) owns its own local { pending, error } and calls it imperatively, matching
// the non-hook `findAll`/`upsert` repository style in this sublayer. The generated-
// client call + the resolve stay inside data/ (B-1). It rejects on a resolve/upsert
// failure so the route can surface an accessible failure (+ recordError on device).
export async function addCalendarFromToken(token: string): Promise<void> {
  const dto = await calendarControllerFindCalendarByToken(token)
  await upsert(fromCalendarForPublic(dto))
}
