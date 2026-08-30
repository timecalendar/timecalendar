# Design — React Native institution, programme, Connect and manual QR/iCal import journey

## Context

The target path is:

```text
School ──> Programme ──> Connect to intranet ──> Import by QR or iCal URL
                                   │
                                   └── future assistant insertion point (NOT built here)
```

Today's onboarding Stack is `index` (welcome) → `school` → `groups`, with `qr-scan` and `ical-url` as
siblings reachable only by deep link. `groups` persists a school/group selection through MMKV and
dismisses without creating a calendar. `create.ts` posts `schoolName: "Dev import"` / `name:
"Dev import"`.

The server contract this change consumes is already merged and generated:

```ts
// mobile/src/api/generated/timeCalendar.schemas.ts
interface CreateCalendarDto { url: string; schoolId?: string; schoolName?: string
                              /** @maxLength 100 */ name?: string
                              customData: CalendarCustomData | null }
interface SendMessageDto  { …; gradeName?: string; calendarName?: string; … }
interface SchoolForList   { …; /** @nullable */ intranetUrl: string | null; … }
```

The server DTO validates `schoolId` with `@IsUUID() @ValidateIf(o => o.schoolName === undefined)` and
`schoolName` with `@IsString() @ValidateIf(o => o.schoolId === undefined)`. Sending **exactly one**
therefore satisfies validation, and `schoolName: ""` with no `schoolId` is accepted — which is what
makes the no-draft direct route legal without a server change.

## Decision 1 — One ephemeral draft in a React context mounted on the onboarding Stack layout

The journey owns one in-memory draft:

```ts
export type ImportInstitution =
  | { kind: "listed"; school: SchoolListItem }
  | { kind: "unlisted"; schoolName: string }

export interface CalendarImportDraft {
  institution: ImportInstitution
  calendarName: string
}
```

It lives in a new `mobile/src/features/onboarding/draft/` sublayer: a context provider plus
`useImportDraft()`, mounted **once** in `mobile/src/app/onboarding/_layout.tsx` so it wraps every
route in the Stack — including `qr-scan` and `ical-url`, which are Stack siblings.

**Why context and not the existing MMKV selection store.** A durable selected-school value is the
exact failure the spec's risk table calls out: a URL import weeks later would be attributed to a
school the student is no longer importing from. The draft must not outlive the journey. Mounting it
on the Stack layout gives the required lifetime for free — the provider unmounts when the Stack is
dismissed, so "leaving the journey clears it" and "an app restart clears it" are structural, not
code the Applier has to remember to write. No new global store, no persistence, no MMKV key.

**Consequence.** A route opened outside the onboarding Stack has no provider. `useImportDraft()`
must therefore be total: it returns `null` for "no draft" rather than throwing on a missing
provider, which is also exactly the direct-route contract.

This is recorded as **ADR 045** because reversing it means re-plumbing every import path.

## Decision 2 — The draft carries the domain `SchoolListItem`, extended with `intranetUrl`

Spec decision 1 sketches the draft holding a generated `SchoolForList`. The repo cannot do that: the
feature-boundary rule **B-1** allows only a feature's `data/` sublayer to import
`@/api/generated/**`, and the draft is consumed by `ui/` screens. `school-selection/data` already
projects the minimal domain `SchoolListItem`; it gains one field:

```ts
export interface SchoolListItem {
  id: string; name: string; code: string
  imageUrl: string; imageUrlDark: string | null
  intranetUrl: string | null      // NEW — projected from SchoolForList
}
```

`intranetUrl` is projected in `school-selection/data/queries.ts` alongside the existing fields, so
the Connect screen reads it from the draft with **no second query** — the school list it came from
was already fetched (and offline-persisted) by `useSchools()`. The projection stays minimal (R-2):
only what the screens render plus what the journey needs.

## Decision 3 — The create payload is derived by one pure function, and the seam takes it explicitly

`useCreateCalendar` / `useAddCalendar` do **not** read the draft. The screens read it and pass the
derived fields down:

```ts
// mobile/src/features/calendar-sources/data/create.ts
export interface CalendarImportFields {
  name: string
  schoolId?: string
  schoolName?: string
}
addCalendarFromUrl(url: string, fields: CalendarImportFields): Promise<void>
```

Derivation is a pure function beside the draft (`onboarding/draft/`), exhaustively unit-testable
without React:

| Draft | Emitted fields |
| --- | --- |
| `{ kind: "listed", school }` | `{ name: normalized, schoolId: school.id }` — **no** `schoolName` |
| `{ kind: "unlisted", schoolName }` | `{ name: normalized, schoolName: normalized }` — **no** `schoolId` |
| `null` (no draft) | `{ name: "", schoolName: "" }` |

**Why explicit rather than a hook reading context inside `data/`.** The data seam stays pure and
testable without a provider; the direct-route case is a value (`null` → the third row) instead of a
branch on React context; and the cross-feature edge stays in `ui/`, where the existing screens
already import `@/features/school-selection`.

**Import direction.** `CalendarImportFields` is declared in `calendar-sources/data` and imported by
the onboarding draft through the cross-feature `data/` sub-barrel — the same edge
`settings/data/summary.ts` already uses (`import type { UserCalendar } from
"@/features/calendar-sources/data"`). That sub-barrel does not re-export `ui/`, so the reverse edge
(`calendar-sources/ui` → `@/features/onboarding`) closes no cycle. **The onboarding feature must
never import `@/features/calendar-sources` (the top-level barrel)** — that would close one.

## Decision 4 — Skip is a native trailing header action, not a second button

The programme step's Skip uses the platform's own header treatment, matching the split already in
`school-picker-screen.tsx` (which does exactly this for a header-*left* Back action):

- iOS — `unstable_headerRightItems` on `<Stack.Screen options>`, a text item with
  `accessibilityLabel`, tinted from the theme.
- Android — a `headerRight` `Pressable` with `accessibilityRole="button"`, a translated
  `accessibilityLabel`, and a `minWidth`/`minHeight` of 48.

The onboarding Stack layout sets `headerShown: false`; the programme screen opts its own header in
via `<Stack.Screen options={{ headerShown: true, … }}>`, exactly as the school picker does.

Continue stays the single primary in-body action and is enabled only for a valid non-empty value, so
Skip is the sole route to an empty name — an empty name is never invented.

## Decision 5 — Normalization is one shared pure helper, applied before validation and before send

```ts
normalizeImportName(raw: string): string   // raw.trim()
NAME_MAX_LENGTH = 100
```

- The programme field and the institution-name field both trim before measuring; a value whose
  **normalized** length exceeds 100 keeps the screen open with inline accessible validation
  (`accessibilityLiveRegion="polite"`, `accessibilityRole="alert"` — the established pattern).
- Unicode, accents and emoji are accepted verbatim; length is measured in JS string units, matching
  the server's `@MaxLength(100)` so the client and the server agree on the boundary.
- The placeholder (`L3 Informatique`) is a `placeholder` prop only and can never reach the draft.
- The institution name is **required** on the unlisted path (empty keeps the screen open); the
  programme name is optional **only** via Skip.

## Decision 6 — Connect renders a link only for a validated HTTP(S) URL

A pure `data/`-layer helper returns the URL to open or `null`:

```ts
safeIntranetUrl(raw: string | null | undefined): string | null
```

It parses with the global `URL` and returns the value only for protocol `http:` or `https:`. Anything
else — `null`, empty, whitespace, `javascript:`, `file:`, a bare hostname — yields `null`, and the
screen renders the generic instructions with **no** button. The unlisted path always takes this
branch because it has no trusted URL.

Opening uses `WebBrowser.openBrowserAsync` from `expo-web-browser`, already a dependency and already
used directly from `ui/` in `about-screen.tsx`. No new dependency, no chrome seam.

The button's label is the institution name (Flutter `connect_screen.dart` parity); its
`accessibilityLabel` is a translated, interpolated string naming both the action and the institution,
so a screen-reader user is told the link leaves the app.

## Decision 7 — Manual import orchestrates the existing routes; it adds no import logic

The manual-import screen renders explanatory copy and two controls that `router.push` to
`/onboarding/qr-scan` and `/onboarding/ical-url`. It owns no camera permission handling, no URL
validation, no pending/error state, and no create call. Both existing screens keep their behaviour
unchanged apart from the create fields they now pass.

**The QR screen gains no report affordance.** The iCal screen's existing "Report a problem" path is
the one support surface and is where `calendarName` is added. Adding a second failure-reporting UI to
the camera screen would be new, untested failure surface in a ticket whose QR requirement is
explicitly "reuse the existing tested route". A failed QR import keeps the draft and re-arms, so the
student can switch to the URL route and report from there.

## Decision 8 — Effective display name is a pure helper returning `null`, localized at the call site

```ts
// mobile/src/features/calendar-sources/data/effective-name.ts
export function effectiveCalendarName(stored: string): string | null   // trim() || null
```

The screen renders `effectiveCalendarName(calendar.name) ?? t("userCalendars.nameFallback")`. Keeping
`t()` out of the helper matches `validate-url.ts` (pure, no translation function) and keeps the
helper unit-testable against the whitespace-heavy production reality (119 511 whitespace-only names).
Stored values are **never** rewritten — the fallback is display-only.

The existing key `userCalendars.namePlaceholder` (“Calendar” / “Calendrier”) is replaced by
`userCalendars.nameFallback` (“My timetable” / “Mon emploi du temps”): the semantics changed from an
input placeholder to a display fallback, and the copy is specified by the tech spec.

## Decision 9 — A successful import leaves the journey; a failure keeps it

- **Success** clears the draft and dismisses the onboarding Stack rather than `router.back()`ing to
  the manual-import step — otherwise the student lands back on a step whose work is already done,
  holding a stale draft. The dismissal is guarded (`router.canDismiss()`) so a directly deep-linked
  QR/URL route with a single Stack entry falls back to the current `router.back()` behaviour instead
  of throwing.
- **Failure** clears nothing: the draft and the entered URL stay available so the student can retry
  or switch QR ↔ URL, which is precisely why the draft is shared across both routes.

## Decision 10 — The group picker stays, unreachable from the normal path

`SchoolRow` pushes `/onboarding/programme` instead of `/onboarding/groups?schoolId=<id>`, and
`MissingSchoolAction` pushes `/onboarding/institution-name` instead of `/onboarding/ical-url`. The
`groups` route, its screen, its tests and its store writes are left exactly as they are and remain
deep-linkable; deleting them is a separate cleanup ticket, out of scope here.

The legacy persisted selection is neutralized rather than deleted: the iCal screen stops reading
`useSelectedSchool()` for failure context (it reads the draft), and entering the unlisted path calls
`clearSelection()` so no stale school id can be attributed to an unlisted import by any code that
still reads the store.

## Navigation shape after this change

```text
/onboarding                     welcome                     (unchanged)
/onboarding/school              school picker               row → programme, "not listed" → institution-name
/onboarding/institution-name    NEW  free-text institution  → programme
/onboarding/programme           NEW  programme + Skip       → connect
/onboarding/connect             NEW  intranet guidance      → import        ← assistant insertion point
/onboarding/import              NEW  QR or iCal link        → qr-scan | ical-url
/onboarding/qr-scan             existing                    (create fields now from the draft)
/onboarding/ical-url            existing                    (create fields now from the draft)
/onboarding/groups              existing, off the normal path, still deep-linkable
```

Every new route is a one-line re-export from `@/features/onboarding/ui` (route-structure rule), so
colocated tests stay out of the Metro route tree.

## Error behavior

| Situation | Behavior |
| --- | --- |
| Programme omitted | Skip continues; create sends `name: ""` |
| Programme normalized length > 100 | Screen stays open, inline accessible validation |
| Institution name empty on the unlisted path | Screen stays open, inline accessible validation |
| Institution name normalized length > 100 | Screen stays open, inline accessible validation |
| Invalid or missing `intranetUrl` | Generic Connect copy, no external-link button |
| Direct QR/URL route with no draft | Create with `name: ""`, `schoolName: ""` |
| Calendar create fails | Draft and entered URL preserved for retry and reporting |
| Stored name empty or whitespace | Render the localized timetable fallback |

## Testing approach

Following the two-layer posture in `testing.md`: pure helpers and the derivation are unit-tested
directly; `data/` proves the wire shape by mocking `src/api/mutator`; `ui/` screen tests mock the
feature's own `data`/draft hooks and keep pure helpers real via `requireActual`.

The load-bearing assertions are the ones a reviewer cannot get from reading the diff:

- The listed create DTO has `schoolId` and **no `schoolName` key at all** (not `schoolName:
  undefined`) — asserted on the mocked mutator's captured body.
- The unlisted create DTO has `schoolName` and **no `schoolId` key**.
- A QR/URL screen rendered with no provider creates with `{ name: "", schoolName: "" }`.
- Entering the unlisted path leaves `getSelection()` undefined even when a school was selected first.
- `safeIntranetUrl` rejects `javascript:` and `file:` (a security assertion, not a formatting one).

## Risks

| Risk | Mitigation |
| --- | --- |
| A stale persisted school is attributed to an unlisted import | The draft is the only creation source of truth; the unlisted path clears the legacy selection; asserted by test |
| A listed create sends both `schoolId` and `schoolName` | The derivation is one pure function with an exhaustive table test asserting key **absence** |
| The draft leaks across journeys | Provider lifetime is the Stack's; success clears explicitly; no persistence exists to leak through |
| Ticket 3 also edits `user-calendars-screen.tsx` | This change touches only the row's name derivation and its i18n key; the overflow menu and rename dialog stay untouched |
| ADR number collides with a long-lived PR | 045 is free on `main` and unclaimed by open PRs today (#317 takes 046); re-check the highest number at rebase before merge |
| The native E2E gate is already red on `main` | Maestro is extended only where cheap; the PR is not gated on an emulator run (no `run-e2e` label). Pre-existing stale selectors in `onboarding.yaml` / `ical-import.yaml` are recorded, not fixed here |
