# Phase 0 Foundation — Scaffolding Review

> **What this is:** a deep review of the React Native foundation (`mobile/`) at the
> end of Phase 0 (the walking skeleton — roadmap steps 1–13, up to and including the
> splash capstone at `3b9b33a`). Reviewed by the Founding Engineer / Mobile Tech Lead
> as an RN/Expo expert, against **idiomatic Expo SDK 56 usage** and **our own stated
> rules** (the Architecture Book, R-1…R-6, the DoD).
>
> **What this is NOT:** none of this is actioned. Per the issue, this is a compiled
> list of observations for triage. Each item carries a severity and a suggested
> action; nothing here was changed. Convert the items we accept into OpenSpec changes
> (each through plan → apply → simplify → review) before touching code.
>
> **Calibration:** this is *scaffolding*, deliberately minimal, and most of it is very
> good. Severities are scaled to a foundation — nothing here is a release blocker. The
> point is to clear template cruft and small inconsistencies **now**, while the surface
> is tiny, before Phase 1 features copy the patterns. The bar is "leave the foundation
> idiomatic," not "rewrite it."

## TL;DR

The foundation is in strong shape and, in several places (seam discipline, typed i18n
parity, test quality, documentation), better than typical RN codebases. The findings
cluster into three honest themes:

1. **Half-migrated Expo-template leftovers** — the `Themed*` primitives and a couple of
   scripts/assets still carry starter-template cruft (dead props, unused variants, a
   hardcoded hex, the `reset-project` script). Cheap to prune, and pruning now stops
   Phase 1 features inheriting it.
2. **Token-layer / theming consistency** — two color-scheme sources of truth, two
   parallel theme systems (React Navigation vs `@/theme`), and tokens defined but not
   yet consumed (`Radii`, `BottomTabInset`) while a magic number is used where one of
   them belongs.
3. **A few small idiomatic/consistency nits** — import sourcing, web/native tab
   divergence, a renamed-but-not-relabeled asset.

Recommended priority order is in the last section.

---

## Strengths to preserve (don't "simplify" these away)

These are deliberate, idiomatic, and load-bearing. Calling them out so a future cleanup
pass doesn't mistake them for debt:

- **Seam discipline, lint-enforced.** `customFetch` (data), `@/storage`, `@/db`, and
  `@/components/chrome` are each a single import site with a `no-restricted-imports`
  boundary keeping the backend/alpha API out of feature code. This is more rigorous than
  most production RN apps and is the right call for a codebase that will churn native
  config feature-by-feature.
- **i18n typed parity.** Flat, greppable dotted keys with `keySeparator/nsSeparator:
  false`, plus **bidirectional** FR/EN parity enforced at `tsc` time (`src/i18n/index.ts`
  `type Catalog`). A missing *or* extra FR key fails the build. Elegant and zero-runtime.
- **Test quality.** Tests assert *resolved semantics* (`getByRole("header")`,
  `getByRole("progressbar", { name })`), not just "a prop was passed." The splash test
  (`splash-screen.test.tsx`) handles async dismissal deterministically under fake timers
  with explicit `act` — it paid off a real flake rather than papering over it.
- **Firebase lazy native resolution.** Every helper resolves the native module *inside
  its body*, so importing `@/firebase` never touches native code — correct for Jest and
  for tree-shaking.
- **Minimal, justified config.** `metro.config.js` / `babel.config.js` / `orval.config.ts`
  are the Expo defaults plus exactly one documented addition each. No config drift.
- **Documentation.** The Architecture Book + ADR log + changelog discipline is
  exceptional and is what made this review fast.

---

## A. Expo-template cruft (half-migrated primitives) — Low/Med

The i18n step (step 6) already deleted the demo helpers and reshaped the tabs, but the
`Themed*` primitives and a couple of scripts/assets were only partly cleaned. They still
read like the Expo starter, not the real app.

### A1. `ThemedView` has dead props `lightColor` / `darkColor` — **Low**
`src/components/themed-view.tsx:6-7,13-14` declares and destructures `lightColor?: string`
and `darkColor?: string`, but the body uses only `type?: ThemeColor` (`theme[type ??
"background"]`). The two props are never read here and have **zero call-site usages**
(grep-confirmed). They are leftovers from the Expo template's two-explicit-colors pattern,
superseded by our token-driven `type` prop.
**Action:** delete both props (type + destructure). One-liner; removes a confusing dual API.

### A2. `ThemedText` carries unused variants and a hardcoded hex — **Med (the hex)**
`src/components/themed-text.tsx`:
- Variants `link`, `linkPrimary`, `code` are **never used** anywhere in the app (only
  `default`, `title`, `subtitle`, `small`, `smallBold` are). Template leftovers.
- `linkPrimary` hardcodes `color: "#3c87f7"` (`themed-text.tsx:80`) — a raw hex in a
  style sheet, bypassing the `@/theme` token layer and the documented WCAG-AA pairs in
  `tokens.ts`. This is exactly the "colors come from tokens" posture the theming step
  established, violated in the one place a link color appears.
**Action:** prune the unused variants. If/when a link style is genuinely needed, add a
brand/link **token** (verified against the contrast pairs) rather than a literal. This
also keeps `ThemedText` honest to R-2 (don't carry variants no one earns).

### A3. Expo `reset-project` script still present — **Low**
`scripts/reset-project.js` and the `reset-project` npm script (`package.json`) are Expo
starter scaffolding (it moves the starter app into `app-example/`). It has no role in a
real app and is dead weight / mildly confusing.
**Action:** remove the script and the package.json entry.

### A4. Profile tab still points at the `explore` icon asset — **Low**
`src/components/app-tabs.tsx:25` uses
`require("@/assets/images/tabIcons/explore.png")` for the **Profile** trigger. The tab was
renamed `explore → profile` in the i18n step, but the icon asset name (and presumably the
glyph) is still the template's "explore" icon.
**Action:** add/point at a profile-appropriate icon asset; drop the `explore.png` leftover.

---

## B. Token layer consistency — Med

### B1. `Radii` and `BottomTabInset` tokens have zero consumers — **Med**
`src/theme/tokens.ts:84-92` defines and exports `Radii` (small/medium/large/pill) and
`BottomTabInset`, but **nothing in the codebase consumes either** (grep-confirmed). Per
the project's own R-2 ("no speculative divergence — earn it, don't declare it"), tokens
should land with their first consumer. The theming step introduced `Radii` as "radius is
a token, not a magic number," but then…
**Action:** either wire the first real consumer in the same breath (see B2) or defer these
two tokens until a feature needs them, consistent with how the storage/chrome seams were
kept minimal.

### B2. A magic number is used where `Radii` belongs — **Med**
`src/components/app-tabs.web.tsx` sets `borderRadius: Spacing.five` (line ~87) and
`borderRadius: Spacing.three` (line ~103) — borrowing the **spacing** scale for **corner
radius**. This is precisely the magic-number-as-radius that `Radii` was introduced to
eliminate, and it means the one place that *should* use `Radii` instead reaches into
`Spacing`.
**Action:** replace those `Spacing.*` border-radii with `Radii.*`. This simultaneously
gives B1's `Radii` its first real consumer.

---

## C. Theming / color-scheme duplication — Med

### C1. Two sources of truth for the color scheme — **Med**
`src/app/_layout.tsx:3` imports `useColorScheme` **directly from `react-native`** to drive
the React Navigation `ThemeProvider`. But `@/theme`'s `useTheme` reads the
`@/hooks/use-color-scheme` **wrapper** — and the web variant of that wrapper
(`use-color-scheme.web.ts`) exists specifically to recompute the scheme client-side for
**static rendering** (the hydration fix). So on web first paint, the navigation chrome
(raw hook) and the app content (wrapped hook) can momentarily disagree on light/dark.
**Action:** import `useColorScheme` from `@/hooks/use-color-scheme` in `_layout.tsx` too,
so there is one scheme source. (The wrapper is the whole reason it exists; the root layout
is the one place still bypassing it.)

### C2. Two parallel theme systems, only one tokenized — **Med**
`_layout.tsx:22` feeds React Navigation's `DefaultTheme` / `DarkTheme` into `ThemeProvider`
— stock React Navigation palettes — while `tokens.ts` is documented as the **single design
token home**. Navigation-chrome colors (header/background/border for the `Stack`, and any
future native-stack surfaces) are therefore **not** derived from our tokens and can drift
from `@/theme` (e.g. nav background ≠ `theme.background`).
**Action:** build the React Navigation theme object from `@/theme` tokens (spread
`DefaultTheme` and override `colors.background`/`card`/`text`/`border` from the token set),
or, if the divergence is intentional for now, document the boundary explicitly in the
theming section so it's a decision, not an accident. Today it's an accident.

---

## D. Readiness gate altitude — Low (watch)

### D1. `useAppReady` is currently `return true` wrapped in machinery — **Low**
`src/hooks/use-app-ready.ts`: `prerequisitesReady()` hardcodes `i18nReady = fontsReady =
migrationsReady = true`, so the `useState` + `useEffect` + 5s watchdog never do anything
today — the gate resolves synchronously on mount, every time. The design defends this as a
reusable seam with a load-bearing watchdog, and that rationale is legitimate.
**Action:** none now — this is a conscious seam, well-documented, and the splash genuinely
needs *a* gate. But flag it for the **first feature that touches it (Settings/onboarding)**:
if no real async prerequisite has materialized by then, re-evaluate whether the full
hook+watchdog earns its complexity over a smaller stub. Recording it so the simplify pass
on the first consuming feature revisits it rather than cargo-culting it forward.

---

## E. Idiomatic / consistency nits — Low

### E1. `app-tabs.web.tsx` import sourcing is inconsistent — **Low**
It imports `./themed-text` / `./themed-view` **relatively** (lines 12-13) and places the
`@/theme` import *after* them (line 15), whereas the rest of the codebase imports
`@/components/themed-text` and groups `@/` imports consistently. The `../` ban makes `./`
legal, so this passes lint, but it's stylistically off from every other file.
**Action:** normalize to `@/components/...` and the established import grouping. (Consider
whether an import-order lint rule — e.g. `import/order` or eslint-plugin-simple-import-sort
— is worth adding so this can't drift; that's a separate small tooling decision.)

### E2. Web vs native tab bar divergence is larger than "shared by convenience" — **Low**
`app-tabs.tsx` (native) is a thin 31-line native-tabs config (icons, labels);
`app-tabs.web.tsx` is a hand-rolled 106-line custom tab UI (brand header + custom
`Pressable`s + its own StyleSheet) that **re-declares** the brand string and tab labels.
This is a legitimate platform split (R-2 allows divergence via composition), but the web
side duplicates copy and structure rather than sharing a labels source.
**Action:** acceptable to leave for the skeleton, but if the web tab bar persists into
Phase 1, factor the shared label/brand data out so the two implementations can't drift,
and consider whether the divergence warrants a short ADR (R-2 says "split via composition
*with an ADR* when they genuinely differ").

### E3. `storage` setters are three near-identical wrappers — **Low (optional)**
`src/storage/index.ts` has `setString` / `setBoolean` / `setNumber` all delegating to
`storage.set(key, value)`, differing only in the value type. A single generic `set<T extends
string | boolean | number>` would be terser. **Counter-argument:** the explicit trio mirrors
the explicit *getters* (which genuinely differ — `getString`/`getBoolean`/`getNumber`) and
matches the documented "minimal typed API." Defensible either way.
**Action:** optional. Leave as-is unless a simplify pass prefers the generic; not worth a
dedicated change.

---

## F. Data-layer seam extension points (not bugs — forward notes) — Info

These are correct-for-a-scaffold gaps the **first real feature will reopen**; recording so
they aren't rediscovered as surprises.

### F1. `customFetch` has no timeout / `AbortSignal` plumbing — **Info**
`src/api/mutator.ts` calls `fetch` with no abort signal or timeout. TanStack Query passes a
`signal` to query functions; the generated client currently doesn't thread it. The first
cancellable/slow call (onboarding school search) will want this.

### F2. `customFetch` has no auth-token injection seam — **Info**
No place to attach an `Authorization` header. The Flutter app uses Firebase Auth; whichever
Phase reintroduces authenticated calls will extend the mutator (the right single place).

### F3. `@/firebase` exports `logMessage` with no consumer — **Info/Low**
`firebase/index.ts:30` `logMessage` is part of the seam surface but unused (only `logEvent`
and `crashTest` are consumed, by the debug panel; `recordError` by the migration runner).
Consistent with keeping the seam's API complete, but under the same R-2 logic applied to
storage ("no helper until a consumer needs it") it could be trimmed until a breadcrumb call
site appears. Minor; either keep as documented seam surface or trim — a deliberate call,
not a default.

---

## Suggested priority order

If we action these, batch them by theme so each is one tight OpenSpec change through the
dev cycle:

1. **Cleanup sweep (A1–A4, F3 optional)** — delete dead props/variants/script, fix the
   hardcoded hex, fix the profile icon. Pure subtraction, lowest risk, highest "stops
   Phase 1 inheriting cruft" value. Do first.
2. **Token + theming consistency (B1–B2, C1–C2)** — one change: route `_layout.tsx`
   through the scheme wrapper, derive the React Navigation theme from tokens, and give
   `Radii` its first consumer in the web tab bar (or defer the unused tokens). This is the
   most *architecturally* valuable batch because it removes the two-sources-of-truth risk
   before features build on the theme.
3. **Nits (E1–E2)** — import normalization + optional import-order lint; revisit web/native
   tab divergence only if it persists. Low urgency.
4. **D1 / F1 / F2** — no action now; attach to the first feature that touches the readiness
   gate / makes an authed or cancellable call. Recorded so they're not rediscovered.

Nothing here blocks starting Phase 1; items 1–2 are best done as a short cleanup interlude
(or folded into the first feature's groundwork) so the golden-path exemplar that Phase 1.5
extracts is drawn from a clean surface.
