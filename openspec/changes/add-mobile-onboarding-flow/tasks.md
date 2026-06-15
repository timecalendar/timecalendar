# Tasks — Onboarding flow: a native-default brand/welcome surface over the existing school-selection Stack

All paths are in `mobile/` unless noted. Order follows the Migration Plan in `design.md`. This is
a **GROW** of Phase 2's onboarding surface — do not rebuild the school picker (ship 2's concern);
only add the welcome surface and re-order the Stack.

## 1. The onboarding feature folder — `src/features/onboarding/ui/` (presentation-only, splash-shaped; D1)

- [ ] 1.1 Create `src/features/onboarding/ui/welcome-screen.tsx` — the brand/welcome surface (D2).
  A centered single screen on the `@/theme` `background` token: `ThemedText type="title"`
  `{t("onboarding.welcome.title")}` (heading role via the encoded contract), a tagline
  `{t("onboarding.welcome.tagline")}`, the three value-proposition lines
  (`onboarding.welcome.value.calendar` / `.notifications` / `.welcome` — the Flutter intro's three
  messages re-authored as concise native copy, text only, no illustrations), and a primary CTA
  Pressable `{t("onboarding.welcome.cta")}` that does `router.push("/onboarding/school")`. Use
  `ThemedText`/`ThemedView`, `SafeAreaView`, `@/theme` tokens (`Spacing`/`Radii`/`MaxContentWidth`/
  brand `primary`). **No raw color literal**, no Material port (R-3). **Contrast (D2):** do NOT put
  white text on the bright `#E91E63` fill — use the brand as an accent (tinted text/border on a
  token surface, or a verified non-white-on-brand pairing); record the chosen pair inline. The
  surface ships **static** (no required animation → reduced-motion trivially met, D5). A stable
  `testID` on the CTA (e.g. `onboarding-welcome-cta`) for Maestro.
- [ ] 1.2 `src/features/onboarding/ui/index.ts` — the `ui/` sub-barrel:
  `export { default as WelcomeScreen } from "./welcome-screen"` (mirror
  `school-selection/ui/index.ts`).
- [ ] 1.3 `src/features/onboarding/index.ts` — the feature barrel: re-export the `ui/` surface
  (`export { WelcomeScreen } from "./ui"`). Comment the no-cycle note (mirror splash / school-
  selection): the `ui/` screen consumes `@/components`/`@/theme`/`expo-router`/i18n, never this
  barrel.

## 2. The Stack re-order — welcome is the entry, school moves to its own route (D3)

- [ ] 2.1 Replace `src/app/onboarding/index.tsx` to re-export the welcome screen:
  `export { WelcomeScreen as default } from "@/features/onboarding/ui"`. Update the header comment
  (thin route entrypoint; reachable via `timecalendar-dev://onboarding`).
- [ ] 2.2 Create `src/app/onboarding/school.tsx` re-exporting the **existing** school picker
  (moved from `index.tsx`): `export { SchoolPickerScreen as default } from "@/features/school-selection/ui"`.
  Header comment: reachable via `timecalendar-dev://onboarding/school`. **Do not touch**
  `SchoolPickerScreen` itself.
- [ ] 2.3 Leave `src/app/onboarding/groups.tsx` and `src/app/onboarding/_layout.tsx` **unchanged**.
- [ ] 2.4 Confirm the root layout (`src/app/_layout.tsx`) needs **no change** — `<Stack.Screen
  name="onboarding" />` is already a sibling of `(tabs)`, and the welcome surface lives inside the
  existing `onboarding` group.

## 3. Welcome CTA navigation (D3)

- [ ] 3.1 The CTA (§1.1) pushes `/onboarding/school` via `expo-router`'s `router.push`. Verify the
  school step's own `router.push("/onboarding/groups?schoolId=…")` is unchanged (it is — the school
  screen file is untouched).

## 4. i18n catalogs (FR + EN) — `src/i18n/locales/{en,fr}.json`

- [ ] 4.1 Add flat dotted `onboarding.welcome.*` keys to **both** `en.json` and `fr.json` (FR/EN
  parity is `tsc`-typed bidirectionally). At minimum: `onboarding.welcome.title`,
  `onboarding.welcome.tagline`, `onboarding.welcome.value.calendar`,
  `onboarding.welcome.value.notifications`, `onboarding.welcome.value.welcome`,
  `onboarding.welcome.cta`, `onboarding.welcome.ctaLabel` (the CTA accessibility label). Natural FR
  + EN copy; the value lines mirror the Flutter messages (view your calendar / get notifications /
  welcome to TimeCalendar) re-authored concisely. Final key names at the implementer's discretion
  following the flat convention.
- [ ] 4.2 Review the Profile entry label `profile.onboarding.link` (currently "Choose your
  school"). Since the link now lands on the welcome surface, decide whether to relabel (e.g.
  "Get started" / "Onboarding") — record the choice; keep FR/EN parity if changed. (Repointing the
  `href` is §5; the label is copy only.)

## 5. Profile entry — repoint to the welcome surface (D3)

- [ ] 5.1 In `src/app/(tabs)/profile.tsx`, confirm the existing `<Link href="/onboarding" asChild>`
  now lands on the welcome surface (the `href` is unchanged — `index` is now welcome). Apply the
  §4.2 label decision. **No structural change** to the Profile screen beyond the label.

## 6. Maestro flow — extend `mobile/.maestro/onboarding.yaml` (D6)

- [ ] 6.1 Extend (do not replace) `mobile/.maestro/onboarding.yaml`: `appId:
  fr.samuelprak.timecalendar.dev`; `launchApp` → `stopApp` → `openLink:
  timecalendar-dev://onboarding` (now the **welcome** surface) → iOS-only optional `tapOn "Open"`
  (in `runFlow when: platform: iOS`) → `extendedWaitUntil visible: <welcome title>` (60s timeout) →
  `tapOn` the CTA (its stable text or `id: onboarding-welcome-cta`) → `extendedWaitUntil visible:
  <school step title>` → `extendedWaitUntil visible: "My Gaming Academia"` (the seeded ASCII
  fixture from `server/src/modules/school/fixtures/school.fixtures.yml` — the live `GET /schools`
  round-trip, unchanged from Phase 2, now reached via the CTA). Update the header comment: it now
  proves welcome → CTA → live school read; still does NOT drive the nested group step (group
  selectors vary by fixture — the Phase-2 rationale stands). Requires the harness server up
  (`ci/e2e-server.sh up`) + a release-config dev-variant build (`mobile/e2e/run_e2e.sh`).
- [ ] 6.2 Confirm `settings.yaml` / `personal-events.yaml` deep-link targets are unaffected (they
  are — only the onboarding flow's entry changed).

## 7. CI proof test (R-1)

- [ ] 7.1 `src/features/onboarding/ui/welcome-screen.test.tsx` (70% floor — `ui/`): render the
  welcome screen through the real theme + i18n trees (mirror
  `settings/ui/settings-screen.test.tsx`); assert the localized title + at least one value-prop
  string render (not raw keys); assert activating the CTA navigates to `/onboarding/school`
  (mock `expo-router`'s `router.push` and assert the path). Cover the heading role
  (`getByRole("header")` finds the title — the encoded contract).
- [ ] 7.2 Confirm the **K-3 coverage gate stays green**: the welcome screen falls under the 70%
  global floor (it is `src/features/*/ui/**`, excluded from the 90% logic glob by the `!(ui)`
  extglob); **no `jest.config.js` change**. No 90%-logic glob is added (the welcome surface has no
  logic sublayer — D1).

## 8. Definition-of-Done walk — automatable axes (do them)

Ship 1 of Phase 3, through the full DoD. Each axis is ✅ a task, ➖ N/A-with-reason, or deferred to
the inbox (§9). No third state (`definition-of-done.md`).

- [ ] 8.1 **Architecture** — follows the Architecture Book: the layered feature-module pattern
  (a new presentation-only `onboarding/ui/`, splash-shaped); route-structure (welcome-first thin
  routes, the `onboarding` group a `Stack` sibling of `(tabs)`); boundaries respected (the welcome
  screen imports no seams, no own-barrel cycle). Load-bearing decisions in `design.md` (D1–D6) +
  **ADR 015** (§10). No new lint rule introduced (existing boundaries/i18n/a11y/coverage cover it).
- [ ] 8.2 **Types** — `npx tsc --noEmit` clean in `mobile/`; no unjustified `any`.
- [ ] 8.3 **Lint** — `npm run lint` clean (`--max-warnings 0`): no hardcoded strings, a11y props on
  the CTA, no parent-relative imports, routes not imported from tests, import order, feature
  boundaries.
- [ ] 8.4 **Unit/component tests** — the §7 proof green; the 70% floor holds for the welcome screen;
  the K-3 gate unchanged.
- [ ] 8.5 **E2E** — `mobile/.maestro/onboarding.yaml` extended (§6) is the welcome → CTA → live read
  flow; runs on iOS + Android via `ci-mobile-e2e.yml` (on-demand) — on-device run confirmed in §9.
- [ ] 8.6 **i18n** — zero hardcoded strings (lint); FR + EN complete (`tsc` bidirectional parity).
  ✅ via §4.
- [ ] 8.7 **Accessibility (automatable half)** — a11y lint passes; the welcome title is a heading
  (encoded contract, asserted in §7.1); the CTA declares a role + translated label + ≥44pt/48dp hit
  area; `allowFontScaling` not disabled; static surface → reduced-motion trivially met (D5). Manual
  VoiceOver / TalkBack / touch-by-finger / contrast halves → §9 (inbox).
- [ ] 8.8 **Native correctness (automatable half)** — RN-core primitives + Expo Router push (the
  platform's nav — R-3); the on-device feel/native-correctness review (welcome → school push, both
  platforms, light/dark) is §9 (inbox).
- [ ] 8.9 **Performance** — a static single screen, no list, no query, no animation on the critical
  path; no jank surface. On-device eyeball → §9 (low risk).
- [ ] 8.10 **Observability** — ➖ **N/A with reason**: the welcome surface performs no data read or
  write and has no throw path — there is nothing crash-worthy to `recordError` (the auto-installed
  `@/firebase` global handler still catches any unexpected throw). Record this N/A in the DoD audit
  trail (no silent skip).
- [ ] 8.11 **Product analytics** — **deferred-with-owner** (not silent N/A): an "onboarding
  started" / "get started tapped" event is meaningful, but the analytics taxonomy is owned by the
  cross-feature step that defines it (mirroring A2/B2/C1's deferral); ship 1 does not add the event.
  The CTA `onPress` is the recorded firing point. Record in the DoD audit trail.
- [ ] 8.12 **Theming / light-dark** — the welcome surface renders scheme-appropriate `@/theme`
  tokens + the brand `primary` accent (D2); no raw color literals. On-device contrast eyeball → §9.
- [ ] 8.13 **Documentation** — Architecture Book + changelog + ADR 015 + golden-path note (§10).
  Record that the DoD axes are walked here (this §8 + §9 is the audit trail).
- [ ] 8.14 **Native config sanity** — confirm **no native module / no `app.config.ts` change** is
  needed (the welcome surface is pure RN-core + `@/theme` + i18n). A `npx expo prebuild --clean`
  would show no native delta; if any unexpectedly appears, stop and record it (it would contradict
  the proposal's non-goal).

## 9. Definition-of-Done walk — manual on-device axes (inboxed, HUMAN-tagged)

Irreducibly on-device; implementer/reviewer **skip-and-continue** (do not block). All items, with
what/why/how-to-verify, in `docs/react-native-migration/inbox/2026-06-15-onboarding-flow-dod-manual.md`.

- [ ] 9.1 Manual **VoiceOver** pass (iOS) — the welcome title (heading), the value-prop lines, the
  CTA (role/label/focus order/announcement). (HUMAN: see inbox/2026-06-15-onboarding-flow-dod-manual.md)
- [ ] 9.2 Manual **TalkBack** pass (Android). (HUMAN: see inbox/2026-06-15-onboarding-flow-dod-manual.md)
- [ ] 9.3 On-device **native-correctness feel** — welcome → school push and back, both platforms,
  light + dark; safe areas; scheme-appropriate tokens. (HUMAN: see inbox/2026-06-15-onboarding-flow-dod-manual.md)
- [ ] 9.4 **Touch-target by finger** — the CTA (and the Profile entry link). (HUMAN: see inbox/2026-06-15-onboarding-flow-dod-manual.md)
- [ ] 9.5 **Color-contrast** eyeball — the welcome title/copy/CTA on background, both schemes,
  against the documented AA brand/token pairs in `tokens.ts`. (HUMAN: see inbox/2026-06-15-onboarding-flow-dod-manual.md)
- [ ] 9.6 **E2E** — run the extended `mobile/.maestro/onboarding.yaml` on iOS + Android (welcome →
  CTA → seeded school) and confirm `settings.yaml` / `personal-events.yaml` still pass, via
  `ci-mobile-e2e.yml` (on-demand / on main). (HUMAN: see inbox/2026-06-15-onboarding-flow-dod-manual.md)
- [ ] 9.7 **Designer onboarding polish** — real illustrations / final brand copy / optional motion
  or multi-page intro / the white-on-brand-CTA decision (would earn the `primaryStrong` `#C2185B`
  token). (HUMAN: see inbox/2026-06-15-onboarding-design-polish.md)

## 10. Docs + ADR (R-1 pointers + ownership)

- [ ] 10.1 **ADR** `.claude/rules/mobile/decisions/015-onboarding-flow-shape.md` (copy the
  `## Decision: ADR 015` block from this change's `design.md`; next free number — 014 was the last):
  onboarding as its own presentation-only feature folder (vs. growing school-selection), the
  welcome-first Stack order, the reachable-but-not-a-startup-gate posture; Context / Decision /
  Consequences / Revisit-if. Add the index row to `.claude/rules/mobile/decisions/README.md`.
- [ ] 10.2 **Architecture Book — `features.md` "School selection (read path)"** (and/or a short
  "Onboarding" note): record that the onboarding flow now opens with a **welcome surface** in a new
  presentation-only `src/features/onboarding/ui/` feature folder; the welcome-first Stack order
  (`index` = welcome, `/onboarding/school` = picker, `/onboarding/groups` = group); the deep-link
  shift (`timecalendar-dev://onboarding` → welcome, school at `…/onboarding/school`); the reachable-
  not-gated posture (pointer to ADR 015). Pointer style (R-1), not duplication.
- [ ] 10.3 **Architecture Book — `navigation.md`**: if the route examples reference the old
  onboarding deep links / the `index`=school assumption, update them to the welcome-first order.
- [ ] 10.4 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (Live section,
  dated 2026-06-15): `add-mobile-onboarding-flow` — Phase-3 ship 1; a native-default brand/welcome
  surface as the onboarding entry in a new presentation-only `src/features/onboarding/ui/` feature
  folder; the welcome-first Stack re-order (school moved to `/onboarding/school`); the Maestro flow
  extended (welcome → CTA → live read); ADR 015. Note no new rule/dep/native change.
- [ ] 10.5 **Update `.claude/rules/mobile/golden-path.md`** — add the welcome surface to the
  presentation-only-feature examples beside splash (the axis table / "closest references"): a new
  `src/features/onboarding/ui/` is the second `ui/`-only feature folder. Update any onboarding
  deep-link / route reference to the welcome-first order.
- [ ] 10.6 Update `docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md` step 1:
  Onboarding flow landed — native-default brand/welcome surface over the existing school step
  (Expo Router stack); **the designer-polish artifacts are inboxed (HUMAN)**; the on-device DoD axes
  inboxed. Tick step 1.
- [ ] 10.7 Create `docs/react-native-migration/inbox/2026-06-15-onboarding-flow-dod-manual.md`
  (mirror `2026-06-14-school-selection-dod-manual.md`): the §9.1–9.6 on-device DoD items, each with
  What / Why / How-to-verify / Blocks (per the inbox README convention).
- [ ] 10.8 Create `docs/react-native-migration/inbox/2026-06-15-onboarding-design-polish.md` (per
  the inbox README convention — What I need / Why / How to verify / Blocks): the designer onboarding
  polish (real illustrations/iconography, final brand copy, optional motion / multi-page intro, the
  white-on-brand-CTA `primaryStrong` decision). **Blocks: nothing** — the ship is complete and
  shippable with the native-default surface; this is the additive quality-polish follow-up.

## 11. Local verification (gates)

- [ ] 11.1 `npx tsc --noEmit` clean in `mobile/`.
- [ ] 11.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`).
- [ ] 11.3 `npm test` green in `mobile/` (the §7 proof + existing suites; the K-3 gate green, 70%
  floor for the welcome screen; `jest.config.js` unchanged).

## 12. Validate

- [ ] 12.1 `openspec validate add-mobile-onboarding-flow --strict` passes.
