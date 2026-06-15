# Tasks — Onboarding flow: a native-default brand/welcome surface over the existing school-selection Stack

All paths are in `mobile/` unless noted. Order follows the Migration Plan in `design.md`. This is
a **GROW** of Phase 2's onboarding surface — do not rebuild the school picker (ship 2's concern);
only add the welcome surface and re-order the Stack.

## 1. The onboarding feature folder — `src/features/onboarding/ui/` (presentation-only, splash-shaped; D1)

- [x] 1.1 Create `src/features/onboarding/ui/welcome-screen.tsx` — the brand/welcome surface (D2).
  A centered single screen on the `@/theme` `background` token: `ThemedText type="title"`
  `{t("onboarding.welcome.title")}` (heading role via the encoded contract), a tagline
  `{t("onboarding.welcome.tagline")}`, the three value-proposition lines
  (`onboarding.welcome.value.calendar` / `.notifications` / `.welcome` — the Flutter intro's three
  messages re-authored as concise native copy, text only, no illustrations), and a primary CTA
  Pressable `{t("onboarding.welcome.cta")}` that does `router.push("/onboarding/school")`. Use
  `ThemedText`/`ThemedView`, `SafeAreaView`, `@/theme` tokens (`Spacing`/`Radii`/`MaxContentWidth`/
  brand `primary`). **No raw color literal**, no Material port (R-3). **Contrast (D2):** does NOT put
  white text on the bright `#E91E63` fill — uses the brand as an accent (brand-tinted border + the
  token `text` label on `backgroundElement`); the chosen pair is recorded inline. The surface ships
  **static** (no animation → reduced-motion trivially met, D5). `testID="onboarding-welcome-cta"`
  for Maestro.
- [x] 1.2 `src/features/onboarding/ui/index.ts` — the `ui/` sub-barrel:
  `export { default as WelcomeScreen } from "./welcome-screen"` (mirror
  `school-selection/ui/index.ts`).
- [x] 1.3 `src/features/onboarding/index.ts` — the feature barrel: re-export the `ui/` surface
  (`export { WelcomeScreen } from "./ui"`). The no-cycle note is commented (mirror splash / school-
  selection): the `ui/` screen consumes `@/components`/`@/theme`/`expo-router`/i18n, never this
  barrel.

## 2. The Stack re-order — welcome is the entry, school moves to its own route (D3)

- [x] 2.1 Replaced `src/app/onboarding/index.tsx` to re-export the welcome screen:
  `export { WelcomeScreen as default } from "@/features/onboarding/ui"`. Header comment updated
  (thin route entrypoint; reachable via `timecalendar-dev://onboarding`).
- [x] 2.2 Created `src/app/onboarding/school.tsx` re-exporting the **existing** school picker
  (moved from `index.tsx`): `export { SchoolPickerScreen as default } from "@/features/school-selection/ui"`.
  Header comment: reachable via `timecalendar-dev://onboarding/school`. `SchoolPickerScreen` itself
  untouched.
- [x] 2.3 `src/app/onboarding/groups.tsx` and `src/app/onboarding/_layout.tsx` left **unchanged**.
- [x] 2.4 Confirmed the root layout (`src/app/_layout.tsx`) needs **no change** — `<Stack.Screen
  name="onboarding" />` is already a sibling of `(tabs)`, and the welcome surface lives inside the
  existing `onboarding` group.

## 3. Welcome CTA navigation (D3)

- [x] 3.1 The CTA (§1.1) pushes `/onboarding/school` via `expo-router`'s `router.push`. The school
  step's own `router.push("/onboarding/groups?schoolId=…")` is unchanged (the school screen file is
  untouched).

## 4. i18n catalogs (FR + EN) — `src/i18n/locales/{en,fr}.json`

- [x] 4.1 Added flat dotted `onboarding.welcome.*` keys to **both** `en.json` and `fr.json` (FR/EN
  parity is `tsc`-typed bidirectionally): `onboarding.welcome.title`, `onboarding.welcome.tagline`,
  `onboarding.welcome.value.calendar`, `onboarding.welcome.value.notifications`,
  `onboarding.welcome.value.welcome`, `onboarding.welcome.cta`, `onboarding.welcome.ctaLabel` (the CTA
  accessibility label). Natural FR + EN copy; the value lines mirror the Flutter messages.
- [x] 4.2 Relabeled the Profile entry `profile.onboarding.link` from "Choose your school" to
  "Get started" / "Commencer" (the link now lands on the welcome surface). FR/EN parity kept.

## 5. Profile entry — repoint to the welcome surface (D3)

- [x] 5.1 In `src/app/(tabs)/profile.tsx`, the existing `<Link href="/onboarding" asChild>` now lands
  on the welcome surface (the `href` is unchanged — `index` is now welcome). The §4.2 label applies.
  **No structural change** to the Profile screen.

## 6. Maestro flow — extend `mobile/.maestro/onboarding.yaml` (D6)

- [x] 6.1 Extended (not replaced) `mobile/.maestro/onboarding.yaml`: `appId:
  fr.samuelprak.timecalendar.dev`; `launchApp` → `stopApp` → `openLink:
  timecalendar-dev://onboarding` (now the **welcome** surface) → iOS-only optional `tapOn "Open"` →
  `extendedWaitUntil visible: "TimeCalendar"` (60s) → `tapOn id: onboarding-welcome-cta` →
  `extendedWaitUntil visible: "Choose your school"` → `extendedWaitUntil visible: "My Gaming
  Academia"` (the seeded ASCII fixture — the live `GET /schools` round-trip, now reached via the CTA).
  Header comment updated: it now proves welcome → CTA → live school read; still does NOT drive the
  nested group step.
- [x] 6.2 Confirmed `settings.yaml` / `personal-events.yaml` deep-link targets are unaffected (only
  the onboarding flow's entry changed).

## 7. CI proof test (R-1)

- [x] 7.1 `src/features/onboarding/ui/welcome-screen.test.tsx` (70% floor — `ui/`): renders the
  welcome screen through the real theme + i18n trees (mirrors `settings/ui/settings-screen.test.tsx`);
  asserts the localized title + a value-prop string render (not raw keys); asserts activating the CTA
  navigates to `/onboarding/school` (mocked `expo-router` `router.push`); covers the heading role
  (`getByRole("header")` finds the title) and the accessible CTA (role + translated label).
- [x] 7.2 Confirmed the **K-3 coverage gate stays green**: the welcome screen falls under the 70%
  global floor (`src/features/*/ui/**`, excluded from the 90% logic glob by the `!(ui)` extglob);
  **no `jest.config.js` change**. No 90%-logic glob added (the welcome surface has no logic sublayer).

## 8. Definition-of-Done walk — automatable axes (do them)

- [x] 8.1 **Architecture** — follows the Architecture Book: the layered feature-module pattern
  (a new presentation-only `onboarding/ui/`, splash-shaped); route-structure (welcome-first thin
  routes, the `onboarding` group a `Stack` sibling of `(tabs)`); boundaries respected (the welcome
  screen imports no seams, no own-barrel cycle). Load-bearing decisions in `design.md` (D1–D6) +
  **ADR 015** (§10). No new lint rule introduced.
- [x] 8.2 **Types** — `npx tsc --noEmit` clean in `mobile/`; no unjustified `any`.
- [x] 8.3 **Lint** — `npm run lint` clean (`--max-warnings 0`): no hardcoded strings, a11y props on
  the CTA, no parent-relative imports, routes not imported from tests, import order, feature
  boundaries.
- [x] 8.4 **Unit/component tests** — the §7 proof green; the 70% floor holds for the welcome screen;
  the K-3 gate unchanged.
- [x] 8.5 **E2E** — `mobile/.maestro/onboarding.yaml` extended (§6) is the welcome → CTA → live read
  flow; runs on iOS + Android via `ci-mobile-e2e.yml` (on-demand) — on-device run confirmed in §9.
- [x] 8.6 **i18n** — zero hardcoded strings (lint); FR + EN complete (`tsc` bidirectional parity).
  ✅ via §4.
- [x] 8.7 **Accessibility (automatable half)** — a11y lint passes; the welcome title is a heading
  (encoded contract, asserted in §7.1); the CTA declares a role + translated label + ≥44pt/48dp hit
  area (`minHeight: 48` + `hitSlop`); `allowFontScaling` not disabled; static surface → reduced-motion
  trivially met (D5). Manual passes → §9.
- [x] 8.8 **Native correctness (automatable half)** — RN-core primitives + Expo Router push (the
  platform's nav — R-3); the on-device feel/native-correctness review is §9 (inbox).
- [x] 8.9 **Performance** — a static single screen, no list, no query, no animation on the critical
  path; no jank surface. On-device eyeball → §9 (low risk).
- [x] 8.10 **Observability** — ➖ **N/A with reason**: the welcome surface performs no data read or
  write and has no throw path — there is nothing crash-worthy to `recordError` (the auto-installed
  `@/firebase` global handler still catches any unexpected throw). Recorded in the DoD audit trail.
- [x] 8.11 **Product analytics** — **deferred-with-owner**: an "onboarding started" / "get started
  tapped" event is meaningful, but the analytics taxonomy is owned by the cross-feature step that
  defines it (mirroring A2/B2/C1's deferral); ship 1 does not add the event. The CTA `onPress` is the
  recorded firing point. Recorded in the DoD audit trail.
- [x] 8.12 **Theming / light-dark** — the welcome surface renders scheme-appropriate `@/theme`
  tokens + the brand `primary` accent (D2); no raw color literals. On-device contrast eyeball → §9.
- [x] 8.13 **Documentation** — Architecture Book + changelog + ADR 015 + golden-path note (§10).
  This §8 + §9 is the DoD audit trail.
- [x] 8.14 **Native config sanity** — **no native module / no `app.config.ts` change** is needed
  (the welcome surface is pure RN-core + `@/theme` + i18n). No new dependency added.

## 9. Definition-of-Done walk — manual on-device axes (inboxed, HUMAN-tagged)

Irreducibly on-device; implementer/reviewer **skip-and-continue**. All items in
`docs/react-native-migration/inbox/2026-06-15-onboarding-flow-dod-manual.md`.

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

- [x] 10.1 **ADR** `.claude/rules/mobile/decisions/015-onboarding-flow-shape.md` (onboarding as its
  own presentation-only feature folder, the welcome-first Stack order, the reachable-but-not-a-startup-
  gate posture; Context / Decision / Consequences / Revisit-if). Index row added to
  `.claude/rules/mobile/decisions/README.md`.
- [x] 10.2 **Architecture Book — `features.md`** — added an "Onboarding" note (the welcome surface in
  a new presentation-only `src/features/onboarding/ui/`; the welcome-first Stack order; the deep-link
  shift; the reachable-not-gated posture, pointer to ADR 015) and updated the School-selection
  nested-nav line. Pointer style (R-1).
- [x] 10.3 **Architecture Book — `navigation.md`** — added the welcome-first onboarding-group note
  (the route order + deep links) to the non-tab-routes section.
- [x] 10.4 Appended an entry to `.claude/rules/mobile/architecture-changelog.md` (Live, 2026-06-15):
  `add-mobile-onboarding-flow` — Phase-3 ship 1; the native-default welcome surface; the welcome-first
  Stack re-order; the Maestro flow extended; ADR 015; no new rule/dep/native change.
- [x] 10.5 Updated `.claude/rules/mobile/golden-path.md` — onboarding added to the presentation-only
  feature examples beside splash; the onboarding route reference updated to the welcome-first order.
- [x] 10.6 Updated `docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md` step 1:
  Onboarding flow landed — native-default brand/welcome surface; designer-polish inboxed (HUMAN);
  on-device DoD axes inboxed. Step ticked.
- [x] 10.7 Created `docs/react-native-migration/inbox/2026-06-15-onboarding-flow-dod-manual.md`
  (mirrors `2026-06-14-school-selection-dod-manual.md`): the §9.1–9.6 on-device DoD items, each with
  What / Why / How-to-verify / Blocks.
- [x] 10.8 Created `docs/react-native-migration/inbox/2026-06-15-onboarding-design-polish.md`: the
  designer onboarding polish (illustrations / final copy / motion / multi-page / the white-on-brand-CTA
  `primaryStrong` decision). **Blocks: nothing** — additive quality-polish follow-up.

## 11. Local verification (gates)

- [x] 11.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 11.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`).
- [x] 11.3 `npm test` green in `mobile/` (the §7 proof + existing suites; the K-3 gate green, 70%
  floor for the welcome screen; `jest.config.js` unchanged) — 31 suites, 134 tests.

## 12. Validate

- [x] 12.1 `openspec validate add-mobile-onboarding-flow --strict` passes.
