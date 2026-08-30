# 045 — Hold the calendar-import draft in an ephemeral, Stack-scoped context

## Status

Accepted.

## Context

The import journey (school → programme → Connect → QR or iCal URL) has to carry
the student's institution and programme name across four screens and hand them to
whichever of the two import routes they finish on. The app already has a durable
place that looks like the obvious home for it: the school-selection MMKV store,
which the group step writes.

Using it would be wrong. A persisted "selected school" outlives the journey, so a
URL import made weeks later is attributed to a school the student is no longer
importing from — the exact risk the tech spec
(`docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md`)
calls out. Production data reinforces how load-bearing the metadata is: of 444 028
live calendars, the `schoolName`/`name` pair is how support places a repeated
import failure (TIM-274).

The journey's own routes make the lifetime question sharper still. `qr-scan` and
`ical-url` are Stack **siblings**, deep-linkable and used directly by dev links,
external links and restored navigation — so whatever holds the draft must be
readable from inside the journey and absent outside it, without either case being
an error.

## Decision

One in-memory draft — `{ institution: listed | unlisted, calendarName }` — held in
React state behind a context provider mounted **once** on
`src/app/onboarding/_layout.tsx`, in `src/features/onboarding/draft/`.

- No MMKV key, no SQLite table, no new global store, and no persistence of any
  kind. Mounting the provider on the Stack layout makes the required lifetime
  structural: the provider unmounts with the Stack, so leaving the journey clears
  the draft and an app restart cannot restore it.
- `useImportDraft()` is **total**. Outside the provider it returns `draft: null`
  with no-op setters rather than throwing, because a route opened with no journey
  in front of it is a supported entry point, not a failure.
- The create payload is derived by one pure function, `toCreateFields(draft)`, and
  passed to the create seam **explicitly**. The seam never reads the draft, so
  `data/` stays provable without a React provider and the no-draft case is a value
  (`{ name: "", schoolName: "" }`) rather than a branch on context.
- The draft carries the domain `SchoolListItem` projection (extended with
  `intranetUrl`), never the generated `SchoolForList` — `ui/` reads it, and only
  `data/` may import `@/api/generated/**` (boundary B-1).

Rejected: reusing the MMKV selection (wrong lifetime, the documented risk); a new
global store (a durable home for something that must not be durable); a navigation
parameter chain (four screens × two exit routes, and it would not survive the
QR ↔ URL switch a failed import needs).

## Consequences

- "Leaving the journey clears the draft" and "a restart clears it" need no code and
  cannot regress by omission — they are properties of where the provider is mounted.
- A failed import keeps its context for free: both import routes are inside the same
  provider, so switching QR ↔ URL finds the same draft.
- The legacy persisted selection is now **neutralized rather than authoritative**:
  the iCal screen no longer reads it for failure context, and the unlisted path
  calls `clearSelection()`. It still exists for the off-path group step; removing
  it is a separate cleanup.
- Anything that must survive the journey — a resumable multi-session import, a
  draft restored after a crash — is out of reach without revisiting this.
- Screens reading the draft must tolerate `null`; that is a contract, not a guard
  to be "tightened" later into a throw.

## Revisit if

- A journey step needs to survive backgrounding, a crash, or an app restart (e.g. a
  resumable import, or an assistant step that leaves the app and returns).
- The draft has to be read outside the onboarding Stack — a second entry point to
  import that is not a Stack sibling.
- The group step is deleted and the school-selection MMKV store loses its last
  writer, at which point the "two places hold a school" tension disappears and the
  neutralization above can be simplified.
