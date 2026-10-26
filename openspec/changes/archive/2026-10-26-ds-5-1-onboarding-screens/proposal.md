# Onboarding welcome, connect and manual import on the design system (DS 5.1)

## Why

Roadmap slice 5.1 is the first Phase 5 screen migration: the first-run screens are the app's first
impression, and the audit counted three hand-rolled filled CTAs and two hand-built outlined
buttons on them. Slice 3.1 already moved every button on these screens to `Button`/`ButtonRow`,
and none of their files sits on a ratchet allowlist, so what is left is the residue the lint gates
cannot see: a deprecated `themeColor` prop, a hand-rolled 44/48 touch-target branch, a fixed
60-point top bar that clips Skip at accessibility text sizes, raw animation durations beside the
`Motion` tokens, a dead footer height, and stale or history-narrating comments. Phase 5's exit
criterion ("the scoped audit greps are clean") is also still prose; this slice encodes it as a
gate that every later slice extends.

## What Changes

- **Welcome** (`welcome-pages.tsx`, `welcome-page-indicator.tsx`, `welcome-controls.tsx`,
  `welcome-entrance.tsx`): the page body uses `tone="secondary"` instead of
  `themeColor="textSecondary"`; the indicator's `Platform.OS === "ios" ? 44 : 48` becomes
  `MinTouchTarget`; the entrance fade and indicator transition use `Motion.base` and `Motion.fast`;
  the Skip bar's fixed `height: 60` becomes `minHeight: MinTouchTarget + Spacing.three` (unchanged
  on iOS, 64 dp on Android, and it grows with the text instead of clipping); the footer's dead
  `minHeight: 64` is removed; the illustration card's `maxWidth: 480` becomes a named geometry
  constant beside the existing height cap.
- **Connect and manual import**: no visual change (both already compose `RootPage`, `PageIntro`,
  `Button`, `ButtonRow`). Their comments are reduced to the non-obvious why (the `safeIntranetUrl`
  gate), and the stale claim that Continue leads to `/onboarding/import` is corrected (Continue
  pushes the export guide). The thin route files `app/onboarding/{index,connect,import}.tsx` get
  the same comment correction.
- **New gate, R-1:** `mobile/src/design/screen-migration.contract.test.ts` lists the migrated
  screen files per slice and fails on any hit of the audit's drift patterns (raw color, numeric
  spacing/radius/typography, `fontWeight`/`fontFamily`, legacy shadows, scheme access, hairline,
  opacity/border-width/hitSlop literals, raw `ActivityIndicator`/`SymbolView`, `style={{`, raw
  44/48 touch targets, `themeColor=`, and the legacy `ThemedText` type aliases). Slice 5.1 seeds it
  with the welcome, connect and manual-import files; later slices append theirs.
- **Ratchets:** no allowlist row and no ceiling changes. None of the 5.1 files is on
  `style-literal`, `raw-primitive`, `raw-button`, `raw-text-input`, `ad-hoc-status`,
  `ad-hoc-separator`, `header-action` or `raw-event-color` allowlists today; the census is
  re-verified in task 0.
- **Architecture Book:** `features.md` onboarding bullet, `lint-format.md` (the migrated-screen
  contract, linked from the ratchet section), ADR 077 extended with the contract, dated
  `CHANGELOG.md` entry 2026-10-26.
- Labels, accessibility labels and hints, roles, routing, draft writes and every `onboarding-*`
  selector stay unchanged; no Maestro flow changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-onboarding-flow`: the brand-surface requirement names the current color roles (Skip and
  Next in `actionText` through the `text` button, body in the `secondary` tone); the accessibility
  requirement takes its transition timings from the `Motion` tokens and requires the Skip bar to
  grow with the text.
- `mobile-design-system-layer`: adds the requirement that migrated screens stay free of the audit's
  drift patterns, enforced by the migrated-screen contract test.

## Impact

- Code: `mobile/src/features/onboarding/ui/{welcome-pages,welcome-page-indicator,welcome-controls,welcome-entrance,connect-screen,manual-import-screen}.tsx`,
  `mobile/src/features/onboarding/ui/welcome-screen.test.tsx`,
  `mobile/src/app/onboarding/{index,connect,import}.tsx` (comments only),
  new `mobile/src/design/screen-migration.contract.test.ts`.
- Not touched: `step-styles.ts`, `institution-name-screen.tsx`, `programme-screen.tsx` and every
  other slice 5.2 file (institution name, programme, iCal URL, feedback), owned by a parallel
  change.
- No dependency, native, i18n-key or route change. Android top-bar height grows by 4 dp.
- Docs: `docs/mobile/architecture-book/{features.md,lint-format.md,CHANGELOG.md}`,
  `decisions/077-visual-style-lint-ratchet.md`, `decisions/README.md` (row text if needed).
