## Context

The accepted mobile IA is currently Home · Calendar · Profile (ADR 025). The
Profile route is an implementation outlier: a complete screen lives under
`src/app/(tabs)/profile.tsx`, manually draws its title and safe area, and exposes
six visually equivalent text links. TimeCalendar has no account or identity, so
the label and person icon make a promise the product does not fulfill.

The destinations span four concepts: held calendar sources, event utilities,
preferences, and application/support information. Five routes exist today
(`user-calendars`, `personal-events`, `hidden-events`, `settings`, and
`notification-settings`); Activity, About, and Feedback exist only in Flutter.

Held calendars are the durable representation of what a user follows. Each
`UserCalendar` has optional `schoolId` and `schoolName`. The separate
school-selection store intentionally persists one current `schoolId` and group
selection for onboarding, so it cannot describe a multi-school collection.

Constraints include the Architecture Book's thin-route and feature-boundary
rules, complete EN/FR localization, native correctness on iOS and Android,
dynamic type, existing theme tokens, and Expo SDK 56. Native tabs and Expo UI
remain alpha APIs and are reached only through `@/components/chrome` seams.

## Goals / Non-Goals

**Goals:**

- Establish Home · Calendar · Settings as the honest three-tab information
  architecture.
- Give secondary destinations a predictable grouped hierarchy without hiding
  them behind an account/avatar affordance.
- Make the tab screen native-feeling through system navigation chrome,
  platform-correct list treatment, interaction feedback, and accessibility.
- Derive a truthful, stable calendar summary for zero, one, and multiple-school
  users without introducing persisted duplicate state.
- Put the screen and derivation logic behind a first-class `features/settings`
  boundary with a thin route and meaningful automated proofs.

**Non-Goals:**

- No account, avatar, user profile, or primary-school preference.
- No Activity, About, or Feedback implementation and no disabled/dead rows for
  them.
- No calendar database/API/schema changes and no new persisted header state.
- No redesign of the destination screens beyond renaming the existing Settings
  entry to Appearance & language.
- No direct task actions such as Add calendar on the Settings hub; adding remains a
  native header action inside calendar management.
- No pixel-identical iOS/Android layout and no new UI dependency.

## Decisions

### Decision 1 — Settings / Réglages replaces Profile as the canonical third tab

The tab order becomes Home · Calendar · Settings. The native tab trigger is `settings`,
with label `settingsHub.tab.label` (EN “Settings”, FR “Réglages”) and the
platform gear icon (`gearshape` SF Symbol and Material `settings`).

“Profile” is rejected because there is no identity. Settings is accepted as the
most idiomatic place to manage the application, including configured calendars,
event visibility, appearance, language, and notifications. Named sections keep
the destination coherent as the inventory grows.

The canonical route changes from `/profile` to `/settings`. A root `/profile` route
redirects to `/settings` for one compatibility window, preventing old development
links or automation from dead-ending. No new code uses `/profile`; the redirect
is removed after callers and released deep links no longer require it.

### Decision 2 — Settings owns a nested native Stack and a feature UI module

Mirror the established Calendar tab shape:

```text
src/app/(tabs)/settings/
  _layout.tsx       native Stack, header shown
  index.tsx         thin export only

src/features/settings/
  index.ts
  data/
    summary.ts
    summary.test.ts
    index.ts
  ui/
    settings-screen.tsx
    settings-screen.test.tsx
    settings-section.tsx
    settings-row.tsx
    index.ts
```

The nested Stack supplies a compact localized Settings title. The screen does not
render a promotional hero, logo, repeated product name, or descriptive marketing
copy. It starts directly with its calendar summary and named sections, respects
safe-area insets, and constrains content to `MaxContentWidth` on wide devices.

The previous alternative, retaining a single `(tabs)/profile.tsx` route while
only changing its label, is rejected: it preserves misleading route/module names
and the route-file architecture violation the change is intended to remove.

### Decision 3 — Use a controlled React Native grouped list for v1

Build section and row primitives from React Native core plus theme tokens, with
platform-specific composition where idioms differ:

- iOS: inset-grouped surfaces, separators inset after the leading icon,
  disclosure chevrons, and iOS pressed fill.
- Android: Material-style section spacing/surfaces, foreground ripple, Material
  disclosure affordance, and Android minimum 48dp targets.
- Both: full-row Pressables, leading tinted icon containers, short labels,
  optional trailing value/badge slots, dynamic type without fixed row heights,
  reduced-motion-safe behavior, and accessible roles/labels/hints.

Using Expo UI `Form`/`Section` as the whole screen is rejected for this first
version. The current codebase already documents Android `testID` forwarding gaps
on Expo UI Picker, while this hub needs navigation rows, trailing counts/badges,
stable test anchors, and cross-platform accessibility. The existing chrome seam
remains available for genuinely native controls; a later spike may replace the
internal primitives if the API proves all required behavior without weakening
tests or parity.

### Decision 4 — Fixed initial hierarchy, with no dead rows

The shipped hierarchy is:

```text
[ Calendar collection summary → /user-calendars ]

EVENTS
  Personal events              → /personal-events
  Hidden events                → /hidden-events

PREFERENCES
  Appearance & language        → /appearance-settings
  Notifications                → /notification-settings
```

The summary is the Calendars front door, so a duplicate Calendars row is omitted.
Add/import remains inside `/user-calendars`, maintaining a clean distinction
between destinations and actions.

Activity later joins Events with an unread badge. About and Feedback later form
an Application section. Rows appear only in the same change that lands a working
destination; the Settings component does not carry disabled placeholders or feature
flags for absent features.

### Decision 5 — The header is a calendar-collection summary, never a school identity

The summary reads the reactive `useUserCalendars()` result and its loaded state.
A pure selector derives presentation-neutral facts; the UI localizes their
labels. It stores nothing.

School identities are deduplicated as follows:

1. A non-empty `schoolId` is the primary identity.
2. Normalize a fallback `schoolName` by trimming, collapsing whitespace, and
   locale-insensitive case folding.
3. A name-only calendar matching the normalized name attached to an ID-backed
   school joins that identity; otherwise it forms a name-backed identity.
4. A calendar with neither value contributes to calendar counts but not school
   counts.

The selector counts every held calendar, regardless of visibility. Visibility is
a rendering preference, not whether the source is configured. It may also expose
`visibleCalendarCount` for a concise localized subtitle, but the school result
never depends on visibility or array order.

Presentation states:

| Loaded state | Primary | Secondary |
| --- | --- | --- |
| Not loaded | skeleton/no announcement | no false empty state |
| 0 calendars | “Your calendars” | “Add your first calendar” |
| exactly 1 known school | that school's display name | localized calendar count |
| more than 1 known school | localized school count | localized calendar count |
| calendars but no known school | “Your calendars” | localized calendar count |

For a mixed collection with one known school plus metadata-free calendars, the
primary may name the one known school while the calendar count makes the broader
collection visible; it must not imply that unknown calendars belong to that
school in accessibility copy. The full summary is one accessible link to
`/user-calendars` with a localized label and hint.

The first-calendar alternative is rejected because SQL row order has no product
meaning and deletion/reimport could silently change the represented school. The
school-selection store is rejected because it represents only the most recent
single-school onboarding context and can disagree with the durable collection.

### Decision 6 — Appearance & language remains a dedicated destination

The existing preference screen moves to `/appearance-settings` without changing
its theme/language preference seams. Settings labels the row “Appearance &
language” / “Apparence et langue” so the destination accurately describes its
content. The former `/settings` path becomes the canonical Settings tab.

When calendar display settings arrive, they receive their own row or a separately
specified consolidation. This change does not silently redefine the existing
settings capability.

### Decision 7 — Behavior tests plus a focused native device pass

Pure summary tests cover loading, empty, unknown metadata, one school, duplicate
calendars, mixed ID/name aliases, multiple schools, visibility, and order
independence. Screen tests cover section order, only-live destinations, links,
localized accessible names, trailing counts, dynamic long copy, and Android/iOS
row branches. App-tabs tests cover trigger order/name/labels/icons, and a route
test or structural assertion covers the compatibility redirect.

The existing Maestro navigation proof is updated to open Settings, assert the summary
and shipped groups, navigate to at least calendar management and Appearance &
language, and return without losing the selected tab. Manual iOS/Android checks
cover safe-area behavior, native tab preservation, VoiceOver/TalkBack, extra-large
type, dark mode, ripple/pressed feedback, and a multi-school fixture.

## Risks / Trade-offs

- **[Settings becomes an unstructured junk drawer over time]** → Section ownership is
  specified; new rows require a real destination and an explicit group.
- **[Hand-built rows drift from native conventions]** → Use native navigation/tab
  chrome, platform branches, system icons, theme tokens, and explicit device
  review; keep primitives private so they can be replaced.
- **[School metadata aliases incorrectly]** → Prefer server `schoolId`, use names
  only as fallback, test mixed metadata, and present counts rather than claiming a
  primary identity when multiple schools resolve.
- **[Mixed known/unknown sources make a named header ambiguous]** → Accessible copy
  describes the whole calendar count and does not claim all sources belong to the
  named school; fall back to “Your calendars” if device review finds the compact
  form misleading.
- **[Route rename breaks deep links/tests]** → Temporary `/profile` redirect,
  repository-wide caller update, and route/tab tests.
- **[Nested Stack changes safe-area or native-tab behavior]** → Mirror the shipped
  Calendar tab pattern and verify both platforms before removing the old route.
- **[Large text clips icon/chevron rows]** → Minimum rather than fixed row height,
  wrapping labels, hidden decorative icons, and large-font tests/device pass.

## Migration Plan

1. Add summary selector/tests and the Settings feature UI behind the new route.
2. Add the nested Settings Stack and switch the static native-tab trigger to `settings`.
3. Add `/profile` compatibility redirect and update all internal callers, i18n,
   tests, and Maestro anchors.
4. Update ADR 025 via a superseding IA ADR plus Architecture Book navigation and
   feature maps.
5. Run typecheck, lint, coverage, and both platform device passes before removing
   the old Profile implementation.

Rollback restores the Profile trigger/route and removes the new module; there is
no data migration or irreversible state change. The compatibility redirect makes
rollback path-safe.

## Open Questions

- How long should `/profile` compatibility remain? Default: one released RN
  version after all repository callers move, then remove it in a cleanup change.
- Should the mixed one-known-school plus unknown-source state name the school or
  use “Your calendars”? Default: name the school with an explicit total-calendar
  subtitle, then decide from the accessibility/device pass if that reads as an
  identity claim.
