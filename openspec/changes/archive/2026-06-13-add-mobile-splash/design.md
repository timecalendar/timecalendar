# Design — mobile splash screen (the full-DoD capstone)

## Context

Foundation roadmap **step 13**, the Phase-0 capstone. Every cross-cutting system is wired and
green in CI; what has *not* happened is a single screen taken through the **entire** Definition
of Done (`.claude/rules/mobile/definition-of-done.md`) on both platforms. The splash is chosen
because it is trivial — the value is the DoD pass, not visual ambition (migration-approach §4,
Phase 0).

Current state:
- `app.config.ts` configures a **static native splash** via the `expo-splash-screen` config
  plugin: `backgroundColor: "#208AEF"`, Android image `./assets/images/splash-icon.png`. This
  is the OS-drawn launch screen, shown before any JS runs.
- The Expo-template **animated** splash overlay (`AnimatedSplashOverlay`) was **deleted** in the
  i18n step (step 6). There is no JS splash today; the app first-paints straight into the tabs.
- `_layout.tsx` already does the startup wiring: side-effect `import "@/i18n"` (synchronous
  i18next init) and a fire-and-forget `void runMigrations()` (empty migration bundle — instant
  and idempotent today; the storage change notes the hook form `useMigrations()` is what the
  *first feature needing a gate* adopts).
- Token layer `@/theme` (colors light/dark, `Spacing`, `Radii`, documented WCAG-AA pairs), the
  `ThemedText` heading-role contract, the `@/components/chrome` glass/alpha-API boundary, and
  the i18n flat-key catalogs are all live. The a11y section names the splash by name as the
  owner of the **reduced-motion** obligation (its first animation).

Constraints shaping the design:
- **R-3 native-correct, not a Flutter copy.** A simple brand splash that feels native; the
  point is the DoD walk. No speculative visual ambition.
- **Token + i18n sourcing only.** No raw colors / alpha APIs at the call site (the theme +
  chrome lint boundaries bite); brand string is a `t()` key (the `i18next/no-literal-string`
  rule bites).
- **Route-structure rule.** A route screen that needs a test is a thin entrypoint over a
  `@/components` module (`routes-not-importable` lint + the Metro-bundling caveat). The splash
  overlay is mounted by the existing root `_layout.tsx`, not a new route.
- **CNG.** `mobile/ios` and `mobile/android` are generated/gitignored; native splash config
  flows only through `app.config.ts` + `expo prebuild`.
- **The DoD is the bar.** Every axis is walked explicitly: automatable now → tasks; irreducibly
  on-device → inboxed + HUMAN-tagged. No third state (the DoD's one honest rule).

## Goals / Non-Goals

**Goals:**
- A polished first-paint: the static native splash hands off to a JS overlay that fades out
  exactly when the app is ready, with **no visible flash** of unstyled or empty content.
- The splash **honors reduced motion**: when `AccessibilityInfo.isReduceMotionEnabled` is true,
  no animation runs — the overlay shows the final frame and dismisses immediately. (The app's
  first animation; the a11y section's reduced-motion obligation, discharged here.)
- Brand sourced from `@/theme` tokens + an i18n `t()` key; light/dark correct.
- A reusable **readiness gate** (`useAppReady()`) — the pattern features inherit for "render
  only when prerequisites are satisfied."
- One CI proof test mirroring the prior proofs (i18n / a11y / firebase / theming).
- The **full DoD walked** on both platforms — automatable axes done in this change, manual
  on-device axes inboxed + HUMAN-tagged, every axis accounted for (✅ or ➖ N/A + reason).

**Non-Goals:**
- **No animated brand mark / Lottie / video.** A minimal token-styled brand (app name + the
  existing splash icon) is enough; an elaborate animation is visual ambition this step rejects
  (R-3 / Phase-0 triviality). The overlay's only motion is a fade-out (skipped under reduced
  motion).
- **No premature `useMigrations()` gate.** The migration bundle is empty and `runMigrations()`
  is instant today; the splash readiness gate accounts for migration readiness through the
  existing seam without forcing the hook form before a feature genuinely needs to block on a
  table (storage change's recorded posture). See D3.
- **No in-app theme/locale switching, no persisted state** — Settings (Phase 1.5) concerns.
- **No new lint rule.** Reduced-motion-as-lint is unsound (runtime layout/behavior); recorded as
  prose with this change as its owner, consistent with the a11y section's existing posture.
- **No analytics event taxonomy** beyond an optional single splash-shown breadcrumb (D6).

## Decisions

### D1 — A JS animated overlay over the static native splash (not native-splash-only)
`expo-splash-screen` draws a **static** native splash before JS loads; it cannot animate brand
content or coordinate dismissal with app-level readiness. The chosen shape (the SDK-56
documented pattern): keep the native static splash, and on the JS side call
`SplashScreen.preventAutoHideAsync()` at module load so the native splash stays up until JS is
ready, then render a **JS overlay** (`src/components/splash-screen.tsx`) that visually continues
the native splash (same token background + brand), and `hideAsync()` the native splash once the
overlay has mounted — the overlay then fades itself out when `useAppReady()` resolves. This
gives a seamless native→JS handoff with no flash, and a place to honor reduced motion.

*Alternative — native splash only, no overlay:* rejected. It can't fade or honor reduced motion
in JS, and gives a hard cut to first content; it also wouldn't exercise the reduced-motion DoD
axis (the explicit reason this step owns it). *Alternative — `expo-splash-screen` `fade`/
`setOptions` only:* the built-in fade is iOS-only and uncontrollable in JS; it can't gate on
i18n/fonts/migrations readiness. We use `setOptions`/`hideAsync` for the native handoff and own
the JS fade ourselves.

### D2 — Reduced-motion is a branch, not a config flag (the app's first animation)
The overlay reads `AccessibilityInfo.isReduceMotionEnabled()` (and subscribes to the
`reduceMotionChanged` event for correctness, though a splash is short-lived). When reduced
motion is on, the fade-out `Animated` timing is **skipped** — the overlay renders the final
frame and unmounts as soon as `useAppReady()` is true (an instant, motionless dismiss). When off,
a short opacity fade (≤ ~300ms) plays on dismiss. The final visual frame is **identical** in
both branches, so reduced-motion users lose only the motion, never content. This is encoded in
the **component** (authorial behavior tied to the animation), not lint — lint cannot know which
View animates; same R-1 reasoning that keeps the heading role in `ThemedText`. This change is
the **first live consumer** of the reduced-motion obligation the a11y section recorded; the
prose deferral note there is updated to point at the new Splash section.

### D3 — `useAppReady()` readiness gate coordinated with existing startup wiring
A single hook `src/hooks/use-app-ready.ts` returns a boolean that is true once first-paint
prerequisites are satisfied:
- **i18n** — already synchronous (`import "@/i18n"` initializes before render); the hook treats
  it as ready and exists so a future async-catalog change has one place to gate.
- **Fonts** — if/when custom fonts are loaded (`expo-font`'s `useFonts`), the gate waits on
  them; today the app uses system fonts, so this is ready immediately (recorded N/A-with-reason,
  wired as a no-op seam so adding a font later is a one-line change).
- **Migrations** — `runMigrations()` is fire-and-forget with an **empty** bundle today (instant,
  idempotent). The gate does **not** prematurely convert the app to the blocking
  `useMigrations()` hook (storage change's deliberate posture — the first feature that must read
  a table before paint adopts that). Instead the gate exposes a migration-readiness seam that is
  ready immediately now and is the documented adoption point for that future feature.

The hook is the reusable "render-only-when-ready" pattern features inherit. *Alternative — inline
the readiness checks in `_layout.tsx`:* rejected; a named hook is testable in isolation and is
the pattern, not a one-off. *Alternative — force `useMigrations()` now:* rejected — speculative
divergence (R-2); the empty-bundle runner gates nothing today and the storage change explicitly
parks the hook-form adoption on the first feature that needs it.

### D4 — Route-structure compliance: overlay component + existing `_layout.tsx` mount
The splash is **not** a new route — it is an overlay mounted by the existing root `_layout.tsx`
(`src/app/_layout.tsx`) above the `Stack`, so it covers the whole app during startup. The
visual + behavior live in `src/components/splash-screen.tsx` (tested via
`src/components/splash-screen.test.tsx`), keeping `*.test.tsx` out of the `src/app/`
Metro-bundled route tree (the route-structure rule's Metro caveat). `_layout.tsx` stays thin:
it conditionally renders `<SplashScreen onReady={…}/>` (or the overlay self-manages via
`useAppReady()`), preserving the existing `import "@/i18n"` and `void runMigrations()` lines.

### D5 — Brand sourced from tokens + i18n; light/dark correct
Background uses a `@/theme` token (not the literal `#208AEF` hardcoded in `app.config.ts`'s
native config — the native static splash keeps its single literal because a native launch screen
can't read JS theme tokens or the OS scheme; that asymmetry is documented). The JS overlay
resolves its colors through `useTheme` so dark mode shows the dark token, and renders the app
name via `t("app.name")` (already in the catalog) — no new hardcoded string. The native static
`backgroundColor` is set to a brand value that reads acceptably under both schemes (the native
splash is pre-JS, so it can't switch on scheme — documented limitation; the JS overlay
immediately corrects to the scheme-appropriate token). Contrast of the overlay's brand text on
its background is added to the documented WCAG-AA pairs in `src/theme/tokens.ts` (or verified
against an existing pair) — the artifact the DoD's manual contrast review checks.

### D6 — Observability: at most one breadcrumb, no required analytics event (N/A with reason)
The splash is not a user action; a "splash shown" analytics event would be a pointless box-tick
(the DoD's explicit anti-pattern). **Product analytics is recorded ➖ N/A** for the splash with
that reason. Observability is satisfied transitively: a startup failure (e.g. migration error)
already reaches Crashlytics via the existing `@/firebase` seam in `runMigrations()`; the splash
adds no new error path. The CI proof asserts the splash render does not throw; Crashlytics
non-regression (app still launches, the global handler still installed) is part of the manual
on-device pass.

### D7 — One CI proof test; the rest of native-correctness is manual on-device
`src/components/splash-screen.test.tsx` mirrors the i18n/a11y/firebase/theming proofs:
- Renders the overlay through the **real** theme + i18n + accessibility tree and asserts the
  **localized** brand string (`t("app.name")` value) renders — not the raw key.
- Asserts the overlay exposes its accessible status/label (the resolved semantic, not merely a
  prop passed).
- **Reduced-motion branch:** with `AccessibilityInfo.isReduceMotionEnabled` mocked `true`, the
  overlay renders without scheduling a fade animation and dismisses immediately once ready; with
  it `false`, the fade path is taken. (Asserts the *branch is honored*, the layer lint can't see.)
- Asserts the overlay **dismisses** (unmounts / calls `onReady`) once `useAppReady()` resolves.

CI **cannot** assert pixel-perfection, native feel, real-device reduced-motion, screen-reader
focus/announcement quality, contrast-by-eye, or low-end-Android jank — those are the
irreducibly-manual DoD axes, inboxed and HUMAN-tagged (`2026-06-13-splash-dod-manual.md`).

### D8 — The explicit DoD walk is a first-class deliverable
`tasks.md` contains a section that walks **every** DoD axis by name, each marked ✅ (a task in
this change), ➖ N/A + reason, or `(HUMAN: see inbox/…)`. This is what makes the splash "the
first feature through the entire DoD" legible and auditable, and is itself the template the
Phase-1 features copy. The manual axes are not skipped — they are explicitly deferred to the
inbox with what/why/how-to-verify, and the implementer/reviewer skip-and-continue rather than
block (the planner can't run a simulator or a screen reader).

## Risks / Trade-offs

- **Native static splash can't switch on color scheme** → a single brand background is chosen
  that reads acceptably light/dark; the JS overlay corrects to the scheme token within the first
  frame after JS loads. Documented limitation, not debt.
- **`preventAutoHideAsync()` without a matching `hideAsync()` hangs the splash forever** → the
  readiness gate must *always* resolve (every branch of `useAppReady()` terminates); a watchdog
  timeout is a considered safety net (dismiss after N seconds even if a gate stalls) so a future
  slow gate can never brick launch. Covered by the proof test's dismissal assertion.
- **Reduced-motion branch is runtime-only** → can't be a lint rule (the a11y section's existing
  reasoning); covered by the proof test's mocked-`AccessibilityInfo` branch + the manual
  real-device check (inbox).
- **`expo-splash-screen` touched at import time** → may need a Jest mock (`jest/`) so the proof
  test doesn't hit native `preventAutoHideAsync`; mirrors the existing `setup-firebase`/
  `setup-i18n`/`setup-db` mock pattern.
- **CNG config change** (native splash background/asset) → regenerates native projects on the
  next `prebuild`; e2e already prebuilds. No hand-edited native.
- **Over-polish creep** → explicitly bounded by D1/Non-Goals: fade only, no brand animation.

## Migration Plan

Additive; rollback = revert (delete the overlay + hook + test, restore `_layout.tsx`, revert the
catalog key and any `app.config.ts` tweak). Order: refine native splash config in
`app.config.ts` (token-matched background) → add `src/hooks/use-app-ready.ts` →
`src/components/splash-screen.tsx` (overlay + reduced-motion branch + accessible status) →
mount in `_layout.tsx` (preserve i18n + `runMigrations` wiring) → catalog key(s) FR + EN →
Jest mock if needed + `src/components/splash-screen.test.tsx` proof → Architecture Book "Splash"
section + a11y reduced-motion note update + changelog + roadmap step 13 → write the inbox note +
walk the DoD in tasks.md. Gate on `npx tsc --noEmit`, `npm run lint` (zero warnings),
`npm test`. Then the manual on-device DoD pass (inbox) closes Phase 0.

## Open Questions

None blocking. Deferred (recorded, not built): an animated brand mark (rejected as visual
ambition), `useMigrations()` blocking-gate adoption (owned by the first feature that reads a
table before paint), a `no-restricted-syntax` reduced-motion/`allowFontScaling` lint guard (added
the day an offender appears — the a11y section's existing posture), in-app theme/locale switching
(Settings, Phase 1.5).
