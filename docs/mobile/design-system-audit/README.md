# Mobile design-system audit (phase 0)

Date: 2026-10-25. Scope: `mobile/` UI layer (37 screen routes, 212 components). Audit and plan
only; no app code changed. **Exploration, not rules:** the Architecture Book stays authoritative
until the ADRs listed in the roadmap land.

| File | Contents |
| --- | --- |
| [assessment.md](./assessment.md) | Verdict, ranked issues, per-screen scorecard, de facto DS |
| [screen-inventory.md](./screen-inventory.md) | Every route → screen → classified components |
| [component-inventory.md](./component-inventory.md) | Every shared and feature-local component: props, variants, consumers, tests, a11y |
| [duplication-and-drift.md](./duplication-and-drift.md) | Duplicate groups, token drift per feature, platform parity |
| [design-system-proposal.md](./design-system-proposal.md) | Token additions, type ramp, primitive set, location, lint gates |
| [storybook-options.md](./storybook-options.md) | Storybook on device / web / hybrid / in-house gallery, visual regression |
| [migration-roadmap.md](./migration-roadmap.md) | Phased slices, screen order, ADRs to write |

## Verdict

The layering (thin routes → `features/<x>/ui` → `components/` + `components/chrome/` →
`theme/`) is sound, and token use is already disciplined (315 token references vs 53 numeric
literals; 5 hex literals in production code). What is missing is the **primitive layer between
tokens and screens**: no type ramp, one button, no text field, no general list row, no
status view, no icon abstraction. Features fill those gaps by hand. Settings (native-settings
seam) and the root-page forms are the exemplars; Calendar, Home, Event details, onboarding
welcome/connect and the personal-event form are the worst offenders.

## Top 10 issues

1. No type ramp: `ThemedText` jumps 16 → 32 → 48; five ad-hoc heading scales in features.
2. One button: ~19 hand-rolled filled/outlined/neutral/text buttons, 3 header-action mechanisms, 2 FABs.
3. Light-scheme brand pink used as 14px label text at 8 sites (4.35:1, fails AA); `actionText` exists.
4. **Android personal events cannot set a time** (`date-time-field.tsx:72-83`, date-only dialog).
5. Two list systems: the native seam for short lists, 8 hand-built RN row styles elsewhere; second row API owned by the wrong feature.
6. 9 local loading/empty/error variants, spinners in 5 colors; `StatusSymbol` blank on Android.
7. No `TextField`: 5 restyled `TextInput`s; input stroke ≈1.3:1 (unverified) below 3:1.
8. Event color: agenda rail + shadow vs Home wash; `TagBubble` text on a data color.
9. `components/` vs `chrome/` boundary unwritten; calendar header icons pink against navigation.md.
10. Lint guards seams, not visuals: nothing stops hex, raw `fontSize`, raw `TextInput`, or `useColorScheme` from `react-native`.

## Storybook recommendation

**Do not adopt Storybook now.** Grow the existing `/settings-gallery` into a general
`/developer/gallery` with fixtures written in CSF3 shape (`*.gallery.tsx`, local types, explicit
test-enforced registry). Reasons: the components worth cataloguing are SwiftUI/Compose controls
that only render on device, inside the app's real providers; web Storybook can't render them and
reverses ADR 007; `@storybook/react-native` 10.7 pulls a required `react-native-svg` peer that
autolinks native code into store binaries and moves the EAS fingerprint, and its examples target
SDK 57 (SDK 56 unverified). The gallery costs zero dependencies and zero fingerprint moves, and
works on preview store builds. Because fixtures are CSF3-shaped, moving to on-device Storybook later
is a config change. Revisit at ~40 fixtures, a second contributor, or Chromatic RN GA.

## Phase plan

0. Audit (this). 1. Defect fixes (Android time, pink text, Android status icon) + token additions +
platform type ramp + `useColorScheme` lint. 2. `/developer` page + gallery + fixtures for existing primitives.
3. Primitives: Button, Icon, StatusView, TextField, `NativeList*` rename, ListRow, Badge/ColorDot,
HeaderAction/FloatingAction, EventSurface. 4. Lint ratchet (`local/no-style-literals`, raw-primitive
bans with shrinking allowlist). 5. Screens: onboarding → forms → lists → details → Home →
Calendar chrome (renderer untouched). Six ADRs (A–F) listed in the roadmap.

## Owner decisions (2026-10-25)

1. **Dedicated folder:** design-system primitives, fixtures and gallery registry live in
   `mobile/src/design/` behind one `@/design` barrel (proposal §3). Tokens stay in `@/theme`;
   the native seam stays in `@/components/chrome`.
2. **Gallery gate:** visible on development and preview builds, hidden in production. It moves out
   of Settings into a dedicated **developer page** (`/developer`) that hosts the gallery and the
   existing dev tools (environment switch, dev import).
3. **Gallery strings are translated** (FR/EN, `gallery.*` namespace); no lint exemption.
4. **Agenda tile rail:** open; explained in assessment issue 8, decided in ADR F.
5. **No pixel-diff lane** for now.
6. **Delete the paging spike.**
7. **Type ramp numbers approved** as a starting point; final device check still happens in phase 1.5.

T01 (phase 1 defect fixes 1.1–1.3 plus the `(tabs)` back label and pink calendar header icons) is
dispatched as its own change.
