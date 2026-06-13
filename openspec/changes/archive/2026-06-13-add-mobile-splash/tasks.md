## 1. Native splash config (`app.config.ts`, CNG)

- [x] 1.1 Review the existing `expo-splash-screen` plugin block in `mobile/app.config.ts`
  (`backgroundColor: "#208AEF"`, Android image `./assets/images/splash-icon.png`). Keep the
  static native splash; set/confirm its `backgroundColor` to a brand value that reads
  acceptably in **both** light and dark (the native launch screen is pre-JS and cannot switch
  on scheme — document that limitation inline). Do not hand-edit `mobile/ios`/`mobile/android`
  (generated/gitignored; changes flow through prebuild only).
- [x] 1.2 Confirm `expo config --json` reflects the splash config for the dev variant; native
  projects regenerate on the next `npx expo prebuild` (e2e already prebuilds — no separate
  native task).

## 2. Readiness gate (`src/hooks/use-app-ready.ts`)

- [x] 2.1 Create `src/hooks/use-app-ready.ts` exporting `useAppReady(): boolean`. It resolves
  true once first-paint prerequisites are satisfied: **i18n** (already synchronous via
  `import "@/i18n"` — treated ready, with one place to gate a future async catalog), **fonts**
  (a no-op seam while the app uses system fonts; one-line change to add `expo-font`'s
  `useFonts` later), and **migrations** (the empty-bundle `runMigrations()` is instant today;
  expose a migration-readiness seam that is ready immediately and is the documented adoption
  point for the first feature that must block on a table — do **not** convert the app to the
  blocking `useMigrations()` hook now, per design D3 / storage change posture).
- [x] 2.2 Guarantee the gate **always** resolves (no branch can leave it pending) and include a
  watchdog timeout so a future slow gate can never leave the splash hung forever (design D3 risk).

## 3. Splash overlay (`src/components/splash-screen.tsx`)

- [x] 3.1 Create `src/components/splash-screen.tsx`. On module load call
  `SplashScreen.preventAutoHideAsync()` (SDK 56 `expo-splash-screen`) so the native splash stays
  up until JS is ready. Render a full-screen overlay that visually continues the native splash:
  background + text colors from `@/theme` via `useTheme` (scheme-appropriate light/dark — **no
  raw color literals, no alpha chrome APIs** at the call site), brand text from `t("app.name")`
  (already in the catalog; add a dedicated splash key only if copy differs from the app name —
  see task 5). Call `SplashScreen.hideAsync()` once the overlay has mounted (native→JS handoff,
  design D1).
- [x] 3.2 Reduced-motion branch (design D2): read `AccessibilityInfo.isReduceMotionEnabled()`
  (and subscribe to `reduceMotionChanged`). When **on**, schedule **no** animation — render the
  final frame and dismiss immediately once `useAppReady()` is true. When **off**, play a short
  (≤ ~300ms) opacity fade-out on dismissal. Final visual frame identical in both branches.
- [x] 3.3 Accessibility: expose an accessible status/label on the overlay so VoiceOver/TalkBack
  convey the loading state (resolved semantic, not a silent node); do **not** set
  `allowFontScaling={false}`. Any a11y copy is a `t()` key (the `i18next/no-literal-string` rule
  covers `accessibilityLabel`).
- [x] 3.4 Dismissal: the overlay removes itself / calls an `onReady` callback once `useAppReady()`
  resolves (and the fade, if any, completes). Keep `src/components/splash-screen.tsx` a
  `@/components` module — it is **not** a `src/app/` route (route-structure rule; the test lives
  beside it without entering the Metro route tree).

## 4. Mount in the root layout (`src/app/_layout.tsx`)

- [x] 4.1 Mount `<SplashScreen/>` above the `Stack` in `src/app/_layout.tsx` so it covers the
  whole app during startup. **Preserve** the existing `import "@/i18n"` side-effect and the
  `void runMigrations()` startup wiring (do not remove or reorder them). Keep `_layout.tsx` thin
  — startup wiring + providers + the overlay mount.

## 5. i18n catalogs (FR + EN)

- [x] 5.1 If a dedicated splash string is needed beyond `app.name`, add the key to
  `src/i18n/locales/en.json` **and** `src/i18n/locales/fr.json` (flat dotted key, e.g.
  `splash.brand` / `splash.status.loading`). FR/EN parity is `tsc`-typed bidirectionally — a
  missing or extra key in either fails the typecheck. Reuse `app.name` if the copy is identical
  (no gratuitous key).

## 6. Jest mock (if needed)

- [x] 6.1 If `expo-splash-screen` or `AccessibilityInfo` is touched at import time in a way that
  breaks Jest, add a suite-wide mock under `jest/` (mirror `setup-firebase.ts`/`setup-i18n.ts`/
  `setup-db.ts` and register it in `jest.config.js`'s `setupFilesAfterEnv`). Mock
  `preventAutoHideAsync`/`hideAsync`/`setOptions` to no-op promises; default
  `isReduceMotionEnabled` to false (tests override per-case).

## 7. CI proof test (`src/components/splash-screen.test.tsx`, R-1)

- [x] 7.1 Create `src/components/splash-screen.test.tsx` mirroring the i18n/a11y/firebase/theming
  proofs. Render the overlay through the **real** theme + i18n + accessibility tree and assert
  the **localized** brand string renders (the `t("app.name")`/splash-key *value*, not the raw
  key).
- [x] 7.2 Assert the accessible status/label **resolves** in the rendered accessibility tree
  (resolved semantic, not merely a prop passed — like the `themed-text` header proof).
- [x] 7.3 Assert the **reduced-motion branch** is honored: with `AccessibilityInfo
  .isReduceMotionEnabled` mocked **true**, no fade animation is scheduled and the overlay
  dismisses immediately once ready; with it **false**, the fade path is taken. (The layer lint
  can't see this.)
- [x] 7.4 Assert the overlay **dismisses** (unmounts / calls `onReady`) once the readiness gate
  resolves.

## 8. Definition-of-Done walk — automatable axes (do them; this is the capstone)

The splash is the first feature through the **entire** DoD. Each axis is ✅ a task here, ➖ N/A
with a reason, or deferred to the inbox (§9). No third state (`definition-of-done.md`).

- [x] 8.1 **Architecture** — follows the Architecture Book (route-structure, theme/chrome
  boundaries, i18n, a11y); the load-bearing decisions are recorded in `design.md` (D1–D8). No
  new ADR needed (no novel cross-cutting decision — the splash consumes existing seams and
  discharges the recorded reduced-motion deferral); state that explicitly in the DoD record.
- [x] 8.2 **Types** — `npx tsc --noEmit` clean in `mobile/`; no unjustified `any`.
- [x] 8.3 **Lint** — `npm run lint` clean in `mobile/` (`--max-warnings 0`): no hardcoded
  strings, a11y props valid, no raw colors/alpha APIs outside `chrome/`, no parent-relative
  imports, route not imported from a test.
- [x] 8.4 **Unit/component tests** — the proof test (§7) green; coverage reported, **not gated**
  (K-3 threshold owned by the first logic-bearing feature, Settings — record ➖ N/A-with-reason).
- [x] 8.5 **i18n** — zero hardcoded strings (lint), FR + EN complete (`tsc` parity). ✅ via §5.
- [x] 8.6 **Accessibility (automatable half)** — a11y lint passes; accessible status present;
  reduced-motion honored at runtime (§3.2–3.3) and proven (§7.3); `allowFontScaling` not
  disabled. Manual screen-reader/touch-target/contrast halves → §9 (inbox).
- [x] 8.7 **Theming / light-dark** — overlay renders scheme-appropriate tokens; the brand
  text-on-background contrast pair is added to / verified against the documented WCAG-AA pairs
  in `src/theme/tokens.ts` (design D5). ✅ via §3.1.
- [x] 8.8 **Observability** — startup errors still reach Crashlytics via the existing `@/firebase`
  seam (`runMigrations` unchanged); the splash adds no new swallowed error path. ✅ (non-regression).
- [x] 8.9 **Product analytics** — ➖ **N/A + reason**: a splash is not a user action; a
  "splash shown" event would be a pointless box-tick (design D6, the DoD's explicit anti-pattern).
  Record the N/A in the DoD checklist.
- [x] 8.10 **Documentation** — Architecture Book "Splash" section + changelog (§10); no ADR
  (8.1). Record that the DoD axes are walked here (this §8 + §9 is the audit trail).

## 9. Definition-of-Done walk — manual on-device axes (inboxed, HUMAN-tagged)

These are irreducibly on-device; the implementer/reviewer **skip-and-continue** (do not block).
All eight items, with what/why/how-to-verify, are in
`docs/react-native-migration/inbox/2026-06-13-splash-dod-manual.md`.

- [ ] 9.1 Manual **VoiceOver** pass (iOS) — focus/announcement quality. (HUMAN: see inbox/2026-06-13-splash-dod-manual.md)
- [ ] 9.2 Manual **TalkBack** pass (Android). (HUMAN: see inbox/2026-06-13-splash-dod-manual.md)
- [ ] 9.3 On-device **pixel / native-correctness** review — iOS, light + dark. (HUMAN: see inbox/2026-06-13-splash-dod-manual.md)
- [ ] 9.4 On-device **pixel / native-correctness** review — Android, light + dark. (HUMAN: see inbox/2026-06-13-splash-dod-manual.md)
- [ ] 9.5 Real-device **reduced-motion** check — both platforms, OS setting honored. (HUMAN: see inbox/2026-06-13-splash-dod-manual.md)
- [ ] 9.6 **Color-contrast** eyeball — both schemes, against the documented AA pair. (HUMAN: see inbox/2026-06-13-splash-dod-manual.md)
- [ ] 9.7 **Performance / no-jank** on a low-end Android; splash never hangs. (HUMAN: see inbox/2026-06-13-splash-dod-manual.md)
- [ ] 9.8 **Observability arrival** non-regression — forced crash still arrives; no new startup error. (HUMAN: see inbox/2026-06-13-splash-dod-manual.md)
- [ ] 9.9 **E2E** — confirm the existing Maestro flow (`mobile/.maestro/schools.yaml`) still
  passes through the new splash (the app launches past the splash to the seeded school). The
  splash must not break the round-trip. CI: `ci-mobile-e2e.yml` (on-demand). (HUMAN: see inbox/2026-06-13-splash-dod-manual.md — run with the `run-e2e` label / on main)

## 10. Docs (R-1 pointers + ownership)

- [x] 10.1 Add a **"Splash"** section to `.claude/rules/mobile/architecture.md`: the
  overlay-over-native-splash pattern + the native→JS handoff (`preventAutoHideAsync`/`hideAsync`),
  the `useAppReady()` readiness gate (the reusable render-when-ready pattern + the migration-gate
  adoption note), the **reduced-motion contract** (encoded in the component, not lint — with the
  R-1 reason), token + i18n sourcing (and the native-static-splash scheme limitation), the
  accessible-status semantics, and **what CI proves vs. what is manual on-device** (mirror the
  i18n/a11y/firebase "Proof in CI" + "Deferred" shape). Note this change is the **first feature
  through the entire DoD**.
- [x] 10.2 Update the a11y section's **reduced-motion** "What lint can't encode" note: it
  previously said "the real splash (step 13) … must honor `isReduceMotionEnabled`" — repoint it
  to the new Splash section as the now-discharged owner.
- [x] 10.3 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (Live section):
  the Splash section + reduced-motion discharge.
- [x] 10.4 Mark **step 13 done** in `docs/react-native-migration/01-roadmap/01-foundation.md`
  with a one-line summary; note Phase-0 exit is gated on the §9 manual on-device DoD pass (inbox).

## 11. Local verification (gates)

- [x] 11.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 11.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`).
- [x] 11.3 `npm test` green in `mobile/` (splash proof + all existing suites).

## 12. Validate

- [x] 12.1 `openspec validate add-mobile-splash --strict` passes.
