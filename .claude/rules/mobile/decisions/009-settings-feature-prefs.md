# 009 — First feature folder; Settings owns app preferences, consumed by infra seams

> Origin: the `add-mobile-settings-prefs` change (TIM-130), design D1 + D8
> (Phase-2 Feature A, data layer). Records the repo's first `src/features/` folder
> shape and the deliberate infra→feature import direction. The full wiring lives in
> the Architecture Book "Settings preferences"; this is the load-bearing decision.

## Status

Accepted. **⚠️ Revisit fired (2026-06-14, `add-mobile-feature-boundaries-lint` /
TIM-135):** `eslint-plugin-boundaries` landed, firing this ADR's revisit. The parked
infra→feature edge is resolved **(a) allow it as a documented seam** (not promote the
store to infra) — see the updated Consequences below and design D7 of that change. The
revisit-if is narrowed to "a *second* feature needs cross-cutting prefs."

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
  feature copies it and TIM-135's boundary lint (`add-mobile-feature-boundaries-lint`,
  landed 2026-06-14) now formalizes it.
- Infra (`use-color-scheme`, `i18n`) depends on `features/settings/prefs`. **Resolved
  (TIM-135): allowed as a documented seam.** When `eslint-plugin-boundaries` landed, the
  infra→`features/settings/prefs`[`/store`] edge was chosen to be **allowed** rather than
  promoting the prefs store to an infra-level module — encoded as the *absence* of a
  disallow naming the infra elements as `from` (boundary B-4, `default: "allow"`). Reasons
  (latent in this ADR): it is a **sample of one** cross-cutting-prefs consumer, so promoting
  would be the speculative cross-feature abstraction R-2 forbids (this ADR already rejected a
  `src/prefs/` service "speculative from a sample size of one"); the edge is already a clean
  DAG (no cycle), so allowing it blesses what is already true; and promotion would move
  feature-owned domain state (a user *preference*) out of the feature that owns it — the
  opposite of the feature-module pattern. See the Architecture Book "Lint & format →
  Feature-module boundaries" and that change's design D7.
- The i18n init path gains a synchronous MMKV read (safe — MMKV is synchronous; falls back
  to device detection on any non-`fr`/`en` value).
- Rollback is a plain revert (additive; no schema, no native, no data — the MMKV keys go
  unread).

## Revisit if

(The `eslint-plugin-boundaries` trigger fired and is resolved — see Status.) A **second**
feature needs cross-cutting preferences, which would argue for an infra-level prefs module
over the per-feature store (and would re-open the promote-to-infra option this revisit chose
*against* from a sample of one).
