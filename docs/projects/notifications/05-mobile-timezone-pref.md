# Epic 05 — Mobile display-timezone preference

Repo: `mobile`. Independent of the pipeline epics; lowest priority. Deliberately thin —
detail it when it's next up.

## Why

Real reported bug from the Flutter era: a student traveling abroad saw all course times
shift to the local device timezone. The schedule of a Paris school should be readable in
Paris time from anywhere, if the user says so. Also covers the inverse (outre-mer
students, exchange students) — the display zone is a preference, not an inference.

## Shape (to refine)

- Setting: `"auto" | <IANA zone>` — auto = device zone (today's behavior). Likely a short
  curated list (France métropolitaine + outre-mer zones) rather than a 400-entry picker.
- **Display side is the real work**: every rendered event time (calendar grid, home,
  event details, all-day lane) currently formats in device timezone. Rendering in a
  chosen zone touches the date-formatting seam across the app — needs an inventory pass
  before scoping.
- **Notification side is free**: epic 04's effective-timezone accessor means the
  subscription PUT picks up the override automatically; the server already stores any
  IANA zone.

## Out of scope (for the eventual change)

- Per-calendar timezones (a calendar's events all render in the one chosen zone).
- Server-side changes of any kind.
