## 1. The @expo/ui chrome wrapper (the seam first) — `src/components/chrome/expo-ui.tsx`

- [x] 1.1 Create `mobile/src/components/chrome/expo-ui.tsx` as the **single import site** for
  `@expo/ui`. Import the **universal** entry (`import { Host, Picker } from "@expo/ui"` — resolves to
  `build/universal`; design D3). Re-export `Host` and `Picker` (typed), with `Picker.Item` re-attached
  as a static compound member (mirror `native-tabs.tsx`'s `Object.assign(..., { Trigger })`). Keep it
  **thin** (D4): no higher-level `SettingsPicker`, no forced theming of the OS-chromed picker — just the
  seam + `Picker.Item` re-attach + types. Add the file header comment explaining it is the single
  import site and why the picker is not themed (R-3: native control adopts platform appearance).
- [x] 1.2 Export the wrapped controls from the chrome barrel `mobile/src/components/chrome/index.ts`
  (`export { Host, Picker } from "@/components/chrome/expo-ui"`). **Flip the existing `@expo/ui`
  note** in `index.ts` from "boundary, not a rendered stub" to "wrapper landed (A2) — single import
  site `expo-ui.tsx`".
- [x] 1.3 Confirm the chrome lint boundary is satisfied: `@expo/ui` is imported only inside
  `src/components/chrome/**` (the `timecalendar/chrome-seams` block already re-sets
  `no-restricted-imports` without the ban for that dir — no eslint.config.js change needed).

## 2. i18n catalogs (FR + EN) — `src/i18n/locales/{en,fr}.json`

- [x] 2.1 Add flat dotted keys to **both** `en.json` and `fr.json` (FR/EN parity is `tsc`-typed
  bidirectionally — a missing/extra key in either fails the typecheck). At minimum:
  - `settings.title`
  - `settings.theme.label`, `settings.theme.system`, `settings.theme.light`, `settings.theme.dark`
  - `settings.language.label`, `settings.language.system`, `settings.language.fr`, `settings.language.en`
  - `profile.settings.link` (the Profile→Settings entry label / accessibility label)
  Final key names are at the implementer's discretion **following the existing flat convention**
  (the string in code is the string in the catalog). Pick natural FR + EN copy
  (e.g. EN `settings.theme.system` → "System", FR → "Système").

## 3. Settings screen — `src/components/settings-screen.tsx`

- [x] 3.1 Create `mobile/src/components/settings-screen.tsx` as a **presentational** component
  (design D1 — it owns no logic; all state comes from A1's hooks). Compose, from
  `@/components/chrome`, a `<Host>` wrapping two `<Picker>` controls (theme, language). Source labels
  via `t()`; layout from `@/theme` tokens (`Spacing`, `SafeAreaView`, `ThemedView`/`ThemedText`,
  `MaxContentWidth`) like `schools-screen.tsx` / `profile.tsx`. No raw color literals.
- [x] 3.2 Wire the **theme** picker: `selectedValue={useThemePreference().preference}`,
  `onValueChange={setPreference}`, with `<Picker.Item label={t("settings.theme.system")} value="system" />`
  etc. for `system`/`light`/`dark`. Wire the **language** picker the same over
  `useLanguagePreference()` for `system`/`fr`/`en`. `appearance="menu"` (cross-platform default).
  Give each `Picker` a stable `testID` (for the Maestro flow / test).
- [x] 3.3 Add a localized title (`<ThemedText type="title">{t("settings.title")}</ThemedText>`) and a
  localized label above each control. Do **not** set `allowFontScaling={false}` (a11y Dynamic-Type
  posture). The screen is **not** a `src/app/` route — keep it in `@/components` (route-structure rule;
  the test lives beside it without entering the Metro route tree).

## 4. Route + reachability

- [x] 4.1 Create the thin route `mobile/src/app/settings.tsx`:
  `export { default } from "@/components/settings-screen"` (no logic, no colocated test — route-screen
  rule).
- [x] 4.2 In `mobile/src/app/_layout.tsx`, add `<Stack.Screen name="settings" />` as a sibling of the
  existing `<Stack.Screen name="(tabs)" />` / `<Stack.Screen name="schools" />` (non-tab routes must be
  `Stack` siblings of `(tabs)` — route-structure rule; a bare sibling under the native tabs is
  unreachable). Keep `_layout.tsx` thin (preserve the `import "@/i18n"`, `void runMigrations()`, and
  `<SplashScreen />` wiring).
- [x] 4.3 Add the **accessible entry control** to `mobile/src/app/(tabs)/profile.tsx`: an Expo-Router
  `<Link href="/settings">` wrapping a `Pressable` (or a `Pressable` calling `router.push("/settings")`)
  declaring `accessibilityRole` (`"link"` or `"button"`) + `accessibilityLabel={t("profile.settings.link")}`
  and a hit area ≥ **44pt iOS / 48dp Android** (padding or `hitSlop`). This is the first real consumer
  of the a11y touchable rules + the touch-target obligation (design D2). Use `@/theme` tokens for styling
  (no raw colors).

## 5. Jest mock — `jest/setup-expo-ui.ts`

- [x] 5.1 Create `mobile/jest/setup-expo-ui.ts` mocking `@expo/ui` suite-wide (its native module has no
  off-device JS — mirror `setup-firebase.ts` / `setup-splash.ts` / `setup-storage.ts`). The mock must let
  the **universal** API render so the proof test works: `Host` renders its `children` (pass-through);
  `Picker` renders an assertable element carrying its `testID` and lets the test **drive
  `onValueChange`** (e.g. render `Picker.Item` children as pressable/triggerable elements, or expose a
  test trigger); `Picker.Item` is a render marker (`label` + `value`), re-attached as `Picker.Item`.
  Mock at the native seam, not the screen (testing posture).
- [x] 5.2 Register `setup-expo-ui.ts` in `mobile/jest.config.js` `setupFilesAfterEnv` (after the
  storage/i18n setups, since the screen reaches A1's hooks → `@/storage` + `@/i18n`). Confirm ordering
  doesn't break the existing suites.

## 6. CI proof test — `src/components/settings-screen.test.tsx` (R-1)

- [x] 6.1 Render the Settings screen through the **real** theme + i18n trees; assert the **localized**
  title and both control labels render (translated *values*, not raw keys — like the splash/themed-text
  proofs).
- [x] 6.2 Assert each control reflects the **current** preference (default `"system"` for both) — the
  selected value matches the hook's current preference.
- [x] 6.3 Drive the **theme** picker's `onValueChange("dark")` and assert `useThemePreference().setPreference`
  is called with `"dark"` (spy the store/hook setter, or assert the stored value changed through the
  `@/storage` seam) — the screen→hook wiring.
- [x] 6.4 Drive the **language** picker's `onValueChange("fr")` and assert the language setter is invoked
  with `"fr"` (it persists + would `changeLanguage` — `i18n` is real in the suite).
- [x] 6.5 Confirm the **K-3 coverage gate stays green** with the new screen (it is presentational under
  `src/components/**` → the 70% global floor; the 90% logic globs are untouched). `jest.config.js`
  `coverageThreshold` SHALL NOT change.

## 7. Maestro flow — `mobile/.maestro/settings.yaml`

- [x] 7.1 Create `mobile/.maestro/settings.yaml` mirroring `schools.yaml`: `appId:
  fr.samuelprak.timecalendar.dev`; `stopApp` → `openLink: timecalendar-dev://settings` → the iOS-only
  `tapOn: "Open"` confirmation (in a `runFlow when: platform: iOS`) → `extendedWaitUntil` the localized
  **title** and the controls (stable text and/or the picker `testID`s) are visible (generous timeout,
  like schools). Header comment: it proves reachability + render only; it deliberately does **not** drive
  a native-picker selection (non-deterministic across platforms — design D5; wiring is proven by the Jest
  test). If a stable native-picker selector proves reliable on **both** platforms during
  implementation, a toggle round-trip MAY be added as a bonus — only if reliable; do not ship a flaky
  flow.

## 8. Definition-of-Done walk — automatable axes (do them)

A2 is the first feature through the full DoD **with a real interactive control**. Each axis is ✅ a task,
➖ N/A-with-reason, or deferred to the inbox (§9). No third state (`definition-of-done.md`).

- [x] 8.1 **Architecture** — follows the Architecture Book (route-structure, chrome/theme/i18n
  boundaries, the presentational-screen placement of D1); load-bearing decisions recorded in `design.md`
  (D1–D8); the `@expo/ui` adoption + universal-entry choice recorded as **ADR 010** (§10). Respects
  import/module boundaries.
- [x] 8.2 **Types** — `npx tsc --noEmit` clean in `mobile/`; no unjustified `any` (the `@expo/ui`
  universal types cover `Host`/`Picker`).
- [x] 8.3 **Lint** — `npm run lint` clean in `mobile/` (`--max-warnings 0`): no hardcoded strings, a11y
  props valid on the Profile entry touchable, `@expo/ui` only inside `chrome/`, no parent-relative
  imports, route not imported from a test, import order.
- [x] 8.4 **Unit/component tests** — the proof test (§6) green; the **K-3 gate stays green** (8.4 / 6.5)
  — the screen is presentational (70% floor), the 90% logic globs are untouched (ADR 003).
- [x] 8.5 **i18n** — zero hardcoded strings (lint); FR + EN complete (`tsc` bidirectional parity). ✅ via §2.
- [x] 8.6 **Accessibility (automatable half)** — a11y lint passes; the Profile entry control declares a
  role + translated label; the native pickers carry OS accessibility; `allowFontScaling` not disabled.
  Manual screen-reader / touch-target-by-finger / contrast halves → §9 (inbox).
- [x] 8.7 **Theming / light-dark** — the screen renders scheme-appropriate `@/theme` tokens; the native
  picker adopts the platform's light/dark appearance (D4 — not force-themed, R-3). No raw color literals.
- [x] 8.8 **Native correctness (automatable half)** — uses native `@expo/ui` controls via the wrapper
  (R-2/R-3); the on-device feel/native-correctness review is §9 (inbox).
- [x] 8.9 **Observability** — ➖ **N/A + reason**: the presentational screen adds no new error path
  (A1's hooks / MMKV writes are synchronous and infallible-by-API; theme/language change cannot throw),
  so wiring `@/firebase` here would be cargo-cult. Recorded N/A-with-reason (design D7).
- [x] 8.10 **Product analytics** — **deferred-with-owner** (not silent N/A): a "settings_changed" event
  (which pref, to what value) is a meaningful product event, but its natural firing point is A1's setters
  (logic layer, unit-provable through `@/firebase`), and verifying arrival needs on-device DebugView.
  A2 keeps the presentational screen a pure A1-hook consumer and does not add the event; it is owned by a
  small follow-up edit to A1's `store.ts` setters when the analytics taxonomy is defined (design D7).
  Record this in the DoD record.
- [x] 8.11 **Documentation** — Architecture Book updates + changelog (§10); ADR 010 (§10). Record that
  the DoD axes are walked here (this §8 + §9 is the audit trail).
- [x] 8.12 **Native config sanity** — run `npx expo prebuild --clean` and a dev build; confirm the
  native picker renders on iOS + Android and `@expo/ui` autolinked **without** an `app.config.ts`
  plugin entry (design D3 — config-shape, verified by build, not lint). If autolinking unexpectedly
  needs a plugin, add the one-line `plugins` entry (the recorded contingency) and note it.

## 9. Definition-of-Done walk — manual on-device axes (inboxed, HUMAN-tagged)

Irreducibly on-device; implementer/reviewer **skip-and-continue** (do not block). All items, with
what/why/how-to-verify, are in
`docs/react-native-migration/inbox/2026-06-14-settings-screen-dod-manual.md`.

- [ ] 9.1 Manual **VoiceOver** pass (iOS) — the Profile entry control + the screen + the native picker
  announcement/focus order. (HUMAN: see inbox/2026-06-14-settings-screen-dod-manual.md)
- [ ] 9.2 Manual **TalkBack** pass (Android). (HUMAN: see inbox/2026-06-14-settings-screen-dod-manual.md)
- [ ] 9.3 On-device **native-picker feel / native-correctness** — iOS (SwiftUI menu), light + dark.
  (HUMAN: see inbox/2026-06-14-settings-screen-dod-manual.md)
- [ ] 9.4 On-device **native-picker feel / native-correctness** — Android (Compose dropdown), light +
  dark. (HUMAN: see inbox/2026-06-14-settings-screen-dod-manual.md)
- [ ] 9.5 **Touch-target** on-device check — the Profile→Settings control is comfortably tappable
  (44pt/48dp by finger). (HUMAN: see inbox/2026-06-14-settings-screen-dod-manual.md)
- [ ] 9.6 **Color-contrast** eyeball — screen text on background, both schemes, against the documented
  AA pairs in `tokens.ts`. (HUMAN: see inbox/2026-06-14-settings-screen-dod-manual.md)
- [ ] 9.7 **Performance / no-jank** — open Settings + switch theme/language on a low-end Android; no jank,
  the re-theme/re-language is smooth. (HUMAN: see inbox/2026-06-14-settings-screen-dod-manual.md)
- [ ] 9.8 **E2E** — run the new `mobile/.maestro/settings.yaml` (+ confirm `schools.yaml` still passes)
  through `ci-mobile-e2e.yml` (on-demand, `run-e2e` label / on main). Optionally evaluate whether a
  native-picker toggle is reliable enough to add (design D5). (HUMAN: see inbox/2026-06-14-settings-screen-dod-manual.md)

## 10. Docs + ADR (R-1 pointers + ownership)

- [x] 10.1 **ADR** `.claude/rules/mobile/decisions/010-expo-ui-chrome-wrapper.md` (copy `TEMPLATE.md`;
  next free number — A1 took 009): adopt `@expo/ui` as the native-controls library **behind the
  `src/components/chrome/expo-ui.tsx` wrapper seam**; default to the **universal entry** over the
  platform-specific entries; the wrapper stays thin (no premature higher-level components, no forced
  theming of OS-chromed controls); `@expo/ui` autolinks (no plugin) and its babel-plugin is `Icon`-only;
  Consequences (every later native control copies this seam) + Revisit-if (a control genuinely needs a
  platform-specific entry, or `@expo/ui` proves unstable enough to warrant a fallback behind the same
  wrapper). Add the index row to `.claude/rules/mobile/decisions/README.md`.
- [x] 10.2 **Architecture Book — "Theming & native-chrome"**: replace the `@expo/ui` *boundary-only*
  note with the landed wrapper (`expo-ui.tsx` is the single import site for the universal `@expo/ui`
  controls; A2 is the first consumer — discharging theming-D6; the picker is not force-themed, R-3;
  `@expo/ui` autolinks, babel-plugin `Icon`-only). Pointer to ADR 010.
- [x] 10.3 **Architecture Book — "Settings preferences"**: add a short **"Settings screen"** note (the
  presentational screen at `src/components/settings-screen.tsx` + thin route; native `@expo/ui` pickers
  driving A1's hooks; the route-structure ↔ ADR-003 presentational placement of D1; Profile→Settings
  reachability + the dev deep link; what CI proves vs. on-device). Pointer style (R-1), not duplication.
- [x] 10.4 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (Live section): the
  Settings screen + the first `@expo/ui` chrome wrapper (theming-D6 discharged) + ADR 010; note A2 is
  the first interactive control through the DoD and the a11y obligations that first bite here.
- [x] 10.5 Update `docs/react-native-migration/01-roadmap/02-pattern-establishment.md` step 1: A2 screen
  + native controls landed; **Feature A's full DoD pass is pending the inboxed on-device axes** (§9).
- [x] 10.6 Create `docs/react-native-migration/inbox/2026-06-14-settings-screen-dod-manual.md` (mirror
  `2026-06-13-splash-dod-manual.md`): the §9 items, each with What / Why / How-to-verify / Blocks
  (per the inbox README convention).

## 11. Local verification (gates)

- [x] 11.1 `npx tsc --noEmit` clean in `mobile/`.
- [x] 11.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`).
- [x] 11.3 `npm test` green in `mobile/` (the settings proof + all existing suites; the K-3 gate green).
- [x] 11.4 `npx expo prebuild --clean` succeeds and a dev build renders the picker (§8.12).

## 12. Validate

- [x] 12.1 `npx openspec validate add-mobile-settings-screen --strict` passes.
