# React Native institution, programme, Connect and manual QR/iCal import journey

## Why

React Native currently creates every imported calendar with the hard-coded literals `Dev import`
for both `name` and `schoolName` (`mobile/src/features/calendar-sources/data/create.ts`). The
school the student picked is never sent, and tapping a school opens a group picker that persists a
selection and dismisses without creating anything — a dead end. QR scanning has no onboarding entry
point at all: the only path to it is a deep link.

Production data (TIM-274) shows the calendar `name` is worth collecting: it is how a student tells
two feeds apart and how support recognises a cohort behind repeated import failures. It also shows
names cannot be treated as clean identifiers — of 444 028 live calendars, 80 685 names are empty and
119 511 are whitespace-only — so the app must derive a safe label at read time rather than backfill.

The server half landed in [TIM-390](/TIM/issues/TIM-390): `CreateCalendarDto.name` is optional,
trimmed and capped at 100 characters, and `SendMessageDto.calendarName` exists. The generated RN
client already carries both. This change is the client journey that finally uses them.

Canonical specification: `docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md`
(Ticket 2, spec lines 419–437). It supersedes TIM-274's older plan document wherever they differ.

## What Changes

- **One ephemeral import draft** — a feature-scoped React context mounted on the onboarding Stack
  layout, holding `{ institution: listed | unlisted, calendarName }`. Never MMKV, never SQLite, no
  new global store. It dies with the Stack, so leaving the journey or restarting the app clears it.
- **The school step leads to the journey, not the group picker.** Tapping a school pushes the new
  programme step with a `listed` draft. "I can't find my school" pushes a new free-text
  **Institution name** step (required, trimmed, 100 characters) which writes an `unlisted` draft and
  clears any legacy persisted school selection. The group picker keeps its route and its behaviour
  but is no longer on the normal path; removing it is a separate cleanup.
- **Programme step** — “Nom de formation” / “Programme name”, placeholder `L3 Informatique` (never
  persisted), trimmed, Unicode/emoji accepted, 100-character normalized maximum with inline
  validation. Empty is legal only through an explicit quiet **native trailing header Skip action**.
- **Connect step** — explains opening the institution's site in a browser, and shows an
  external-link button labelled with the institution name **only** when its `intranetUrl` is a valid
  HTTP(S) URL. Back and Continue are always available; Continue goes straight to manual import. The
  boundary stays explicit so a later project can insert the assistant here.
- **Manual import step** — one screen offering both **Scan QR code** and **Paste an iCal link**,
  orchestrating the existing QR and URL routes rather than duplicating their permission,
  validation, loading, failure and creation logic.
- **Creation carries real metadata** — exactly one institution representation: listed sends
  `{ url, schoolId, name }`, unlisted sends `{ url, schoolName, name }`. No duplicate `schoolName`
  for a listed school. `Dev import` is deleted.
- **Direct routes stay usable.** A QR or URL route opened with no draft (dev links, external links,
  tests, restored navigation) creates with `name: ""` and `schoolName: ""` — it never redirects and
  never crashes.
- **Effective display name** — every calendar-name surface renders `trim(stored)` when non-empty,
  otherwise the localized “Mon emploi du temps” / “My timetable”. Stored values are never rewritten.
- **Support context** — a failed import's report sends the optional normalized `calendarName`,
  omitted when empty, alongside the existing `calendarUrl`/`schoolId`/`schoolName`.
- FR/EN strings, accessibility labels, unit/integration tests, an ADR for the draft, and Architecture
  Book updates.

## Capabilities

### New Capabilities

- `mobile-import-journey`: the ephemeral import draft and the institution → programme → Connect →
  manual-import journey, including the creation-payload derivation, the no-draft direct-route
  contract, and the draft's lifetime.

### Modified Capabilities

- `mobile-onboarding-flow`: the onboarding Stack gains the institution-name, programme, connect and
  import routes, and its layout mounts the draft provider.
- `mobile-school-selection`: the school projection carries `intranetUrl`; selecting a school opens
  the programme step instead of the group step; the persisted selection stops being a source of
  truth for calendar creation and is cleared on the unlisted path.
- `mobile-ical-import`: the create call carries draft-derived institution/programme fields instead of
  `Dev import`; failure context comes from the draft and adds `calendarName`.
- `mobile-qr-scan`: the scan's create call carries the same draft-derived fields, and a failed scan
  preserves the draft.
- `mobile-feedback`: bounded optional enrichment extends to `calendarName`; `gradeName` stays out.
- `mobile-user-calendars`: the row title uses the effective-display-name rule instead of the
  “Calendrier” placeholder.

## Impact

- **New** `mobile/src/features/onboarding/draft/` — the context provider, the draft types, the pure
  normalizers, and the create-fields derivation.
- **New** `mobile/src/features/onboarding/ui/` screens: institution-name, programme, connect,
  manual-import (+ colocated tests) and four thin routes under `mobile/src/app/onboarding/`.
- `mobile/src/app/onboarding/_layout.tsx` — mounts the draft provider.
- `mobile/src/features/school-selection/` — `SchoolListItem.intranetUrl`, the row's push target, the
  missing-school action's push target.
- `mobile/src/features/calendar-sources/data/create.ts` + `user-calendars/add-calendar.ts` — the
  create seam takes explicit import fields; `Dev import` removed.
- `mobile/src/features/calendar-sources/ui/` — the QR and iCal screens read the draft-derived fields;
  the iCal report adds `calendarName`; the user-calendars row uses the effective name.
- `mobile/src/features/feedback/` — `calendarName` route parameter and DTO field.
- `mobile/src/i18n/locales/{en,fr}.json` — new keys, FR/EN parity enforced by `tsc`.
- `docs/mobile/architecture-book/` — `navigation.md`, `features.md`, `CHANGELOG.md`, ADR 045.
- `docs/react-native-migration/inbox/` — one `(HUMAN: …)` device-pass note.

**Not in scope:** the assistant; school groups (selection, discovery, group iCal generation) and the
cleanup of the unused group implementation; server-driven group selection; the rename UI and sync
convergence (Ticket 3); any Flutter change — `app/lib/modules/assistant/screens/connect_screen.dart`
and `app/lib/modules/import_ical/screens/import_ical/import_ical_screen.dart` are read-only
behavioural references; regenerating `openapi/openapi.json` or `mobile/src/api/generated/`.

## Sensitive surfaces

- `mobile/src/api/generated/` — **consumed only**. This change must not regenerate it; the contract
  is owned by the merged server ticket.
- Expo Router navigation structure — routes stay thin re-exports over `ui/`.
- Camera permission — the existing tested QR route is reused; no new native permission config, no
  `app.config.ts` change.
- External URL opening — only HTTP(S) institution URLs may be opened; anything else renders no link.
