# 009 — First feature folder; Settings owns app preferences, consumed by infra seams

> Origin: the `add-mobile-settings-prefs` change (TIM-130), design D1 + D8
> (Phase-2 Feature A, data layer). Records the repo's first `src/features/` folder
> shape and the deliberate infra→feature import direction. The full wiring lives in
> the Architecture Book "Settings preferences"; this is the load-bearing decision.

## Status

Accepted.

## Context

Phase 2 opens with **Settings** (ADR [004](./004-phase-1-feature-order.md)), the first
feature past the foundation. Its data/logic layer (the persisted preference store and the
hooks features read) is built first; the screen and native controls are a separate issue
(A2/TIM-131). Two decisions in that layer are load-bearing — copied by every later feature
and costly to reverse — and so earn an ADR (R-4):

1. **Where a feature's code lives.** The repo has no `src/features/` yet. The first one
   sets the module shape the rest of Phase 2/2.5 copies and the golden-path exemplar later
   hardens. The feature-boundary lint (`eslint-plugin-boundaries`, TIM-135/D1) lands *on
   top of* this shape — so the shape must exist before the lint that enforces it.
2. **Who owns application preferences, and which way the import points.** The theme C1 seam
   (`@/hooks/use-color-scheme`) and the i18n runtime (`@/i18n`) — both **infra** — need to
   read the user's theme/language override. The override is semantically the **Settings
   feature's** state (ADR 004: Settings owns local prefs). So infra ends up importing the
   feature: the **opposite** of the usual feature→infra direction.

## Decision

1. **First feature folder: `src/features/settings/prefs/`.** A thin data/logic layer —
   `types.ts` (the two typed preference unions + flat namespaced `SETTINGS_KEYS` +
   defensive validators), `store.ts` (imperative get/set over `@/storage`, plus the pure
   `getInitialLocale()` startup read), `hooks.ts` (the reactive `useThemePreference` /
   `useLanguagePreference`). Tests colocate. **Deliberately thin** — one feature's data
   layer, not a blessed framework; the exemplar is earned from three features in Phase 1.5,
   not declared from one (migration-approach §4). *Rejected:* the store under
   `src/storage/settings.ts` (that's the *backend* seam, not a feature — preferences are
   Settings' domain and conflating them blocks the boundary lint later); a top-level
   `src/prefs/` cross-feature service (speculative from a sample size of one — R-2).

2. **Settings owns app preferences; the infra→feature import is accepted and recorded.**
   `@/hooks/use-color-scheme` and `@/i18n` import `@/features/settings/prefs`. This is
   accepted now because: (a) preferences are the Settings feature's domain, so the store
   rightly lives in the feature; (b) there is **no feature-boundary lint yet** (TIM-135),
   so nothing is violated today; (c) the alternative — a separate infra-level prefs service
   the feature wraps — would be the speculative cross-feature abstraction R-2 forbids from a
   sample of one. The edge is a **clean DAG** (no cycle): `@/i18n` init reads the *store*
   module only (`getInitialLocale` → `@/storage` + the `detect-locale` leaf, never the i18n
   instance), and `hooks.ts` imports the i18n instance for the runtime `changeLanguage` —
   `hooks.ts → @/i18n → store` closes no cycle because the store imports neither.

## Consequences

- The feature-module shape (`src/features/<feature>/<layer>/`) is set; the next Phase-2
  feature copies it and TIM-135's boundary lint formalizes it.
- Infra (`use-color-scheme`, `i18n`) depends on `features/settings/prefs`. TIM-135 must
  decide, when `eslint-plugin-boundaries` lands, either to **explicitly allow**
  infra→`features/settings/prefs` as a documented seam, or to **promote** the prefs store to
  an infra-level module — informed by whether a second feature also needs cross-cutting
  prefs. Recorded here so TIM-135 inherits the open question rather than discovering the edge.
- The i18n init path gains a synchronous MMKV read (safe — MMKV is synchronous; falls back
  to device detection on any non-`fr`/`en` value).
- Rollback is a plain revert (additive; no schema, no native, no data — the MMKV keys go
  unread).

## Revisit if

`eslint-plugin-boundaries` lands (TIM-135/D1) — resolve the infra→feature edge then (allow
it as a documented seam, or promote the store to infra). Or a second feature needs
cross-cutting preferences, which would argue for an infra-level prefs module over the
per-feature store.
