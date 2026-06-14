# Design — Settings screen (native @expo/ui pickers driving A1's prefs hooks, first @expo/ui chrome consumer)

## Context

This is **A2** of Feature A (Settings, ADR [004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md)):
the **screen + native controls** over the data/logic layer A1 (`add-mobile-settings-prefs` /
TIM-130) already shipped. A1 is done and covered — the first feature folder
(`mobile/src/features/settings/prefs/`), the typed theme + language preference store behind
`@/storage`, the reactive hooks (`useThemePreference`, `useLanguagePreference`), the C1
theme-override + i18n startup/runtime wiring, and the now-enforced K-3 coverage gate. **A2 builds on
that — it adds no prefs logic; it renders controls that drive A1's hooks.**

What A1 exposes (via `@/features/settings/prefs`) and A2 consumes verbatim:
- `useThemePreference()` → `{ preference: "system"|"light"|"dark", setPreference }` (reactive,
  MMKV-backed; setting it flows the override through the `@/hooks/use-color-scheme` C1 seam and
  re-themes the whole app).
- `useLanguagePreference()` → `{ preference: "system"|"fr"|"en", setPreference }` (reactive; setter
  persists **and** calls `i18n.changeLanguage` live).

Two things make A2 distinct from the splash (the prior DoD walk): it is the **first real interactive
product control**, so the DoD a11y obligations deferred "to the first interactive control" first bite
here; and it lands the **first `@expo/ui` consumer**, discharging the theming change's D6 deferral
(the chrome barrel's `@expo/ui` boundary note → a real wrapper body).

Constraints shaping the design:
- **Route-structure rule.** A tested screen lives in `src/components/<name>-screen.tsx` with a thin
  `src/app/<name>.tsx` re-export (keeps the colocated `*.test.tsx` out of the Metro route tree);
  non-tab routes are `Stack` siblings of `(tabs)` (a bare sibling under the native tabs is
  unreachable). Both are binding (Architecture Book "Navigation & route structure").
- **Chrome lint boundary (R-1).** `@expo/ui` (+ subpaths) is `no-restricted-imports`-banned outside
  `src/components/chrome/**` (`eslint.config.js` `chromeAlphaImportPatterns`). So the `@expo/ui`
  import **must** live in a chrome wrapper; the screen imports `@/components/chrome`.
- **K-3 coverage gate (ADR 003, enforced by A1).** `jest.config.js` enforces 90% lines+branches on
  the logic globs (`src/features/**`, `src/hooks/**`, `src/storage/**`, `src/db/**`, `src/i18n/**`,
  `src/firebase/**`, `src/theme/**`) and a 70% global floor; presentational paths
  (`src/components/**`, `src/app/**`) fall only under the 70% floor. A2's screen must not break this.
- **R-2 / R-3.** Add only the wrapper surface the screen needs (no speculative `@expo/ui` re-export
  zoo — R-2); the picker is a native control reviewed against each *platform*, not the Flutter
  Settings page (R-3).

## Goals / Non-Goals

**Goals:**
- A presentational Settings screen with two native picker controls (theme, language) driving A1's
  reactive hooks, reachable from the Profile tab and via a dev deep link.
- The first `@expo/ui` chrome wrapper (`src/components/chrome/expo-ui.tsx`) as the single import site,
  exported from the barrel — discharging theming-D6.
- Full i18n (FR + EN, `tsc`-typed parity) for the screen, controls, options, and the entry control.
- The a11y obligations that first bite for a real interactive control (touch target, translated
  labels, native-picker OS a11y), with the manual screen-reader axes inboxed.
- One CI proof test (screen + control→hook wiring) and a Maestro flow (render assertion).
- The full DoD walked — automatable axes done here, on-device axes inboxed + HUMAN-tagged.

**Non-Goals:**
- **No new prefs logic** — A2 renders over A1's hooks; the store/validators/hooks are untouched.
- **No new preference** — exactly theme + language (the two A1 ships). A third pref is A1's additive
  edit when a feature needs it.
- **No in-app preview-only state, no "apply" button** — selecting an option takes effect immediately
  (reactive hooks; matches native Settings idiom, R-3).
- **No generic settings-row framework / settings registry** — two hand-written control rows; the
  golden-path exemplar is earned from three features, not declared here (R-2, migration-approach §4).
- **No `@expo/ui` surface beyond what the two pickers need** — only `Host` + `Picker` + `Picker.Item`
  are re-exported; `Button`/`Switch`/`Slider`/`Icon`/the SwiftUI/Compose entry points are **not**
  wrapped until a consumer needs them (R-2). The chrome boundary already bans them everywhere.
- **No `app.config.ts` / babel / native config change** — `@expo/ui` autolinks and its babel-plugin
  is `Icon`-only (D3).
- **No K-3 `jest.config.js` change** — the screen is presentational (70% floor); the gate stays as A1
  set it.

## Decisions

### D1 — The screen is presentational, under `src/components/` — resolving route-structure ↔ ADR 003
The route-structure rule wants a tested screen at `src/components/<name>-screen.tsx` (thin route
re-export). ADR 009 / A1 established `src/features/settings/` for the feature's *logic*. These two
homes are not in conflict once the screen is correctly classified: **the Settings screen is
presentational** — it renders controls and delegates *all* state to A1's hooks (`useThemePreference`
/ `useLanguagePreference`); it owns no logic, no validation, no persistence. So it belongs at
**`src/components/settings-screen.tsx`** (behavior-tested under the 70% global floor, **exempt from
the 90% per-path gate** per ADR 003 — "presentational components are behavior-tested but exempt from
the 90% gate"), with a thin `src/app/settings.tsx` (`export { default } from "@/components/settings-screen"`).

Putting the *screen* under `src/features/settings/**` would drag it under the 90% logic glob and
contradict ADR 003 — a presentational screen forced to 90% lines+branches is exactly the cargo-cult
gate ADR 003's revisit clause warns against. The clean split is: **logic in `src/features/settings/`
(A1, 90%-gated), presentation in `src/components/settings-screen.tsx` (70% floor, ADR-003-exempt).**
This also matches every existing screen (`schools-screen.tsx`, `splash-screen.tsx`,
`firebase-debug-panel.tsx` all live in `src/components/`) — A2 follows the established placement, it
does not invent one.

*Alternatives:* a feature-folder screen `src/features/settings/screen/settings-screen.tsx` (rejected
— pulls presentation under the 90% logic gate, contra ADR 003; and the route-structure rule already
designates `src/components/` as the screen home so the route stays a thin re-export). Inline the
screen in `src/app/settings.tsx` (rejected — the route file can't carry a colocated test without
dragging `@testing-library/react-native` into the Metro route bundle; the route-screen rule exists
precisely to prevent this). The K-3 gate stays green either way because the screen never enters a 90%
glob.

### D2 — Reachability: root `Stack` sibling + an accessible Profile entry control + the dev deep link
Per the route-structure rule, a non-tab route must be a `Stack` sibling of `(tabs)` (a bare sibling
under the native tabs is registered but unreachable — verified on a simulator when the rule was
written). So:
- `src/app/_layout.tsx` gains `<Stack.Screen name="settings" />` alongside the existing
  `<Stack.Screen name="(tabs)" />` and `<Stack.Screen name="schools" />`.
- The **entry point** is on the **Profile tab** (`src/app/(tabs)/profile.tsx`): an accessible control
  navigating to `/settings`. It is an Expo-Router `<Link href="/settings">` wrapping a `Pressable`
  (or a `Pressable` calling `router.push`), declaring `accessibilityRole="link"` (or `"button"`) +
  a translated `accessibilityLabel` (`t("profile.settings.link")`), with a hit area ≥ **44pt iOS /
  48dp Android** (the touch-target minimum — A2 is the first real consumer of that obligation;
  `Pressable` `hitSlop` or padded layout supplies it). This is where the `react-native-a11y`
  touchable rules bite for the first product control (the only prior consumer was the `__DEV__`
  FirebaseDebugPanel).
- **Deep-link target** `timecalendar-dev://settings` (dev scheme, from `app.config.ts`
  `APP_VARIANT=development`), mirroring `schools` — the Maestro flow (D4) cold-launches through it.

*Alternatives:* a Settings tab (rejected — Settings is a secondary destination, not a primary
navigation peer of Home/Calendar/Profile; a tab is speculative chrome, R-2/R-3, and the Calendar tab
itself is still deferred). A header button (rejected — the tabs run under a root `Stack` with
`headerShown: false`; the Profile body control is the simplest accessible entry and matches where
account/settings lives on both platforms).

### D3 — `@expo/ui` integration: autolinks (no plugin), universal entry, `Icon`-only babel-plugin skipped
Verified against `mobile/node_modules/@expo/ui@56.0.17`:
- **It autolinks.** `@expo/ui` ships `expo-module.config.json` (`apple`/`android` native modules) →
  Expo autolinking picks it up with **no `app.config.ts` `plugins` entry** (exactly like
  `react-native-mmkv` v4, and unlike `expo-sqlite`/`expo-localization`/`expo-updates`, which *do*
  have config plugins). There is **no `app.plugin.js`** in the package. So **`app.config.ts` is not
  touched.** Native projects regenerate on the next `expo prebuild`; the e2e build already prebuilds.
- **The babel-plugin is `Icon`-only.** `@expo/ui/babel-plugin` rewrites `@expo/ui` `Icon` imports
  (SF Symbols / drawable XML resolution). A2 uses `Picker` only, not `Icon`, so the babel-plugin is
  **not** added to `babel.config.js`. (Recorded so a future `Icon` consumer knows to add it.)
- **The universal entry** (`import { Host, Picker } from "@expo/ui"`, resolving to `build/universal`)
  is chosen over the platform-specific `@expo/ui/swift-ui` / `@expo/ui/jetpack-compose` entries.
  `Host` bridges to SwiftUI (iOS) / Jetpack Compose (Android) and renders a plain `View` on
  web/RN-fallback/Jest; `Picker` is a single-select, value-based native control
  (`selectedValue: string|number`, `onValueChange(value)`, `Picker.Item{label,value}`,
  `appearance: "menu"|"wheel"` default `menu`, plus a `testID`). Universal is the right call (R-2):
  the same call site works on both platforms, the picker is identical SwiftUI/Compose chrome, and we
  have **no** need to drop to a platform-specific entry — that would be the speculative divergence R-2
  forbids. Should a control genuinely diverge later, the wrapper splits via composition (with an
  ADR), exactly as R-2 prescribes.

### D4 — The chrome wrapper: thin `Host` + `Picker` re-export, not a higher-level `SettingsPicker`
`src/components/chrome/expo-ui.tsx` is the **single import site** for `@expo/ui`. It re-exports the
universal `Host` and `Picker` (with `Picker.Item` re-attached, mirroring how `native-tabs.tsx`
re-attaches `NativeTabs.Trigger` via `Object.assign`), typed. It is **thin** — it does *not* bake in a
higher-level `SettingsPicker` (label + options + theming) because:
- **R-2 / single consumer.** A `SettingsPicker` abstraction designed from one screen's two pickers is
  the speculative cross-feature surface R-2 forbids from a sample size of one. The screen composes
  `Host` + `Picker` directly with its own labels/options; if a second feature wants the same
  composed shape, *that's* when the higher-level component is earned (and the golden-path exemplar,
  Phase 1.5, is where such composition is blessed).
- **Theming honesty.** Unlike `NativeTabs` (where the wrapper injects `@/theme` colors because the
  consumer would otherwise reach the raw `Colors` map), the native `Picker` is **OS-chromed**
  (SwiftUI/Compose) — it adopts the platform's own light/dark appearance and there is no robust,
  documented color-prop surface to theme it the way the tab bar is themed. So the wrapper deliberately
  does **not** invent theming props for the picker — forcing colors onto a native control is the LCD
  laziness R-2 rejects, and the platform appearance is the correct R-3 default. (Recorded: if a
  future design genuinely needs a tinted picker and `@expo/ui` exposes the surface, the wrapper adds
  it then.)

The wrapper's job is therefore purely the **lint-boundary seam + the `Picker.Item` re-attach + the
types** — the minimum that makes `@expo/ui` reachable from one place. The chrome barrel
(`index.ts`) flips its `@expo/ui` note from "boundary, not a rendered stub" to "wrapper landed
(A2)", and exports `Host` + `Picker`.

*Alternatives:* re-export `@expo/ui` as a bare passthrough with no `Picker.Item` re-attach (rejected
— `Picker.Item` is a static compound member; without re-attach the consumer can't write
`Picker.Item`, the established native-tabs pattern); a fully-composed `SettingsPicker` (rejected —
R-2, above).

### D5 — Maestro flow: deep-link + render assertion; deliberately no native-picker toggle round-trip
`mobile/.maestro/settings.yaml` mirrors `schools.yaml`: `stopApp` → `openLink:
timecalendar-dev://settings` (with the iOS "Open" confirmation tap) → `extendedWaitUntil` the
localized **title** and the two control rows are visible (stable seeded text and/or `testID`s on the
pickers — `Picker` accepts `testID`). **What it proves:** the route is reachable via deep link, the
screen mounts, the `@expo/ui` `Host`/`Picker` render natively on both platforms (a native render
failure would crash or blank the screen), and the app launches past the splash to a real product
screen. **What it deliberately does NOT do:** drive a picker selection and assert the theme/language
actually changed. Native `@expo/ui` pickers open OS-level SwiftUI/Compose popups whose internal
elements are **not** reliably addressable by Maestro across both iOS and Android — a toggle flow
would be flaky, and a flaky e2e is worse than none (it erodes trust in the gate). The control→hook
**wiring** is instead proven deterministically by the Jest proof test (D6), which drives
`onValueChange` directly. State this split in the flow's header comment so the reviewer knows the
omission is a decision, not an oversight. (If, during implementation, a stable selector for the
native picker proves reliable on *both* platforms, a toggle round-trip may be added as a bonus — but
only if reliable; do not ship a flaky flow.)

### D6 — Jest: a suite-wide `@expo/ui` mock so the universal control renders; the proof test drives wiring
`@expo/ui`'s native module has no off-device JS — importing it at module top reaches the native
binding and throws under Jest (exactly the `setup-firebase` / `setup-splash` / `setup-storage`
situation). So `jest/setup-expo-ui.ts` (suite-wide, registered in `jest.config.js`
`setupFilesAfterEnv`) mocks `@expo/ui` such that:
- `Host` renders its `children` (a plain pass-through, matching the real universal web/RN fallback);
- `Picker` renders something assertable (e.g. a `View`/element carrying its `testID`) and **invokes
  `onValueChange` when driven** — the mock exposes a way for the test to trigger a selection (e.g.
  the mock `Picker` renders its `Picker.Item` children as pressable elements, or accepts a test-only
  trigger), so the component test can assert `setPreference` was called with the chosen value;
- `Picker.Item` is a data-only/render marker (`label` + `value`), re-attached as `Picker.Item`.

The mock must let the **real** universal API shape work so the test exercises the genuine
screen→wrapper→hook path (mock at the native seam, not the screen — mirroring the "mock at the
`customFetch` seam" testing posture). The implementer inspects the existing `setup-*.ts` files for
the established pattern and confirms registration ordering (after the storage/i18n setups, since the
screen reaches A1's hooks → `@/storage` + `@/i18n`).

**The proof test** (`src/components/settings-screen.test.tsx`) asserts:
1. the screen renders the **localized** title (`t("settings.title")` *value*, not the raw key) and
   both control labels — through the real theme + i18n tree;
2. both pickers render with their option set, and the **currently-selected value reflects the
   hook's current preference** (default `"system"`);
3. driving the **theme** picker's `onValueChange("dark")` calls `useThemePreference().setPreference`
   with `"dark"` (the screen→hook wiring) — spy on the hook/store setter, or assert the stored value
   changed through the seam;
4. driving the **language** picker's `onValueChange("fr")` calls the language setter (which persists
   + would `changeLanguage` — `i18n` is real in the suite; assert the setter was invoked with `"fr"`).

This proves the **wiring** (screen renders + control selection drives the right A1 hook) in CI
(`test-mobile`: tsc + lint + Jest, R-1). CI **cannot** prove the native picker's feel, the OS-level
popup, real VoiceOver/TalkBack, on-device contrast, or the Maestro-through-the-native-picker — those
are the **on-device** half (inboxed, D7).

### D7 — CI-provable vs. manual DoD split (mirrors splash / firebase / theming)
The DoD is walked in `tasks.md` §8 (automatable) + §9 (manual, inboxed). The split:
- **Automatable (done as tasks, green in CI):** Architecture (route-structure + chrome/theme/i18n
  boundaries, ADR 010 recorded), Types (`tsc`), Lint (`--max-warnings 0`: no hardcoded strings, a11y
  props on the entry touchable, no `@expo/ui` outside chrome, no parent-relative imports, route not
  imported from a test), Unit/component (the D6 proof test; coverage stays green — screen is
  presentational under the 70% floor, the 90% logic gate is untouched), i18n (FR+EN parity), a11y
  *automatable half* (a11y lint passes; entry control has role+label; native pickers carry OS a11y),
  Observability (the screen adds no new swallowed error path — A1's hooks/MMKV are infallible-by-API,
  so ➖ N/A for a new error path, recorded with reason).
- **Manual / on-device (inboxed + HUMAN-tagged, skip-and-continue):** manual **VoiceOver** (iOS) +
  **TalkBack** (Android) passes over the screen *and* the Profile→Settings entry control (focus
  order, picker announcement, the touchable's announced role/label); **native-picker
  feel/native-correctness** on iOS (SwiftUI menu) + Android (Compose dropdown), light + dark;
  **touch-target** on-device check on the entry control (44pt/48dp by finger); **contrast** eyeball
  on both schemes; the **Maestro-through-native-picker** toggle (only if it can be made reliable —
  D5); **performance/no-jank** on a low-end Android. In
  `docs/react-native-migration/inbox/2026-06-14-settings-screen-dod-manual.md`, with
  what/why/how-to-verify each.
- **Product analytics:** the DoD axis is **considered**, not blanket-N/A. A "settings changed" event
  (which preference, to what value) is a *meaningful* product event — but firing it requires the
  on-device DebugView verification half the CI can't assert, and A1's setters are the natural firing
  point. **Decision:** A2 does **not** add analytics now — it keeps the screen a pure A1-hook
  consumer (no new logic in the presentational layer, D1), and a "settings_changed" event belongs in
  A1's setters (logic layer) where it can be unit-proven through the `@/firebase` seam. Recorded as a
  **deferred-with-owner** item (not silent N/A): the event is owned by a small follow-up edit to
  A1's `store.ts` setters when the analytics taxonomy is defined, so the manual DebugView check has
  something to verify. (This avoids cargo-culting an event into the presentational screen and avoids
  silently skipping the axis.)

### D8 — `@expo/ui` adoption + the universal-entry choice earns an ADR (010)
This is the **first `@expo/ui` consumer** and it makes two load-bearing, reused-by-later-features
calls: (a) `@expo/ui` is adopted as the native-controls library *through the chrome wrapper seam*
(every later native control — Personal Events' date/time pickers, B/C controls — copies this), and
(b) the **universal entry** is chosen over the platform-specific entries (the default posture every
later control inherits). Both are R-4 load-bearing (affect patterns reused across features) and
costly to reverse (a different controls library, or a platform-split default, would ripple through
every feature). So they earn ADR [010](../../../.claude/rules/mobile/decisions/010-expo-ui-chrome-wrapper.md)
(next free number — A1 took 009, verified in the ADR README index). The ADR records: adopt `@expo/ui`
behind `src/components/chrome/expo-ui.tsx`; default to the universal entry; the wrapper stays thin
(no premature higher-level components, no forced theming of OS-chromed controls); `@expo/ui` autolinks
(no plugin) and its babel-plugin is `Icon`-only; revisit if a control genuinely needs a
platform-specific entry or `@expo/ui` proves unstable enough to warrant a fallback (the chrome seam
is exactly the place a fallback would live).

## Risks / Trade-offs

- **`@expo/ui` is alpha and OS-chromed (highest risk).** The chrome wrapper localizes the churn to
  one file (the whole point of the seam) and the boundary lint keeps it there. The native picker's
  appearance is the platform's, reviewed on-device (R-3) — accepted, not a bug. If `@expo/ui` breaks
  under a future SDK, the blast radius is `expo-ui.tsx`; the ADR-010 revisit clause names the
  fallback path (a non-`@expo/ui` control behind the same wrapper API).
- **Native picker not deterministically drivable in Maestro.** Mitigated by D4/D5: the e2e proves
  *render + reachability* (real value), the Jest proof proves *control→hook wiring* (deterministic);
  no flaky toggle flow is shipped.
- **The Jest mock could pass while the real native control is broken.** Inherent to mocking a native
  module (same as firebase/splash). Mitigated: the mock reproduces the real *API shape* so the
  screen↔hook wiring is genuinely exercised, and the on-device axes (inbox) + the Maestro render
  assertion catch a broken native render. Recorded so the reviewer treats the manual pass as load
  bearing.
- **First real touch-target / screen-reader obligations.** A2 is where these first bite (DoD a11y
  axis). The automatable half is the a11y lint + the explicit role/label on the entry control; the
  irreducible half (announced order, finger-size hit test) is inboxed — accepted as the on-device
  cost of the first interactive control, exactly as the splash inboxed its on-device axes.
- **Autolink-no-plugin assumption.** Verified against `node_modules/@expo/ui` (`expo-module.config.json`
  present, no `app.plugin.js`). The implementer **confirms a clean `npx expo prebuild` + a dev build
  renders the picker** before handoff (config-shape, not lint — R-1); if autolinking unexpectedly
  needs a plugin, that is a one-line `app.config.ts` add, recorded as the contingency.

## Migration Plan

Additive; rollback = revert (no schema, no native source hand-edits, no data — the new route/keys/mock
simply disappear). Order: add `src/components/chrome/expo-ui.tsx` + barrel export (the seam first) →
add the FR/EN i18n keys → build `src/components/settings-screen.tsx` (compose `Host`+`Picker` over A1's
hooks) + the thin `src/app/settings.tsx` route → wire `<Stack.Screen name="settings" />` in
`_layout.tsx` and the accessible entry control in `profile.tsx` → add `jest/setup-expo-ui.ts`
(register in `jest.config.js`) → write `settings-screen.test.tsx` (render + wiring) → write
`.maestro/settings.yaml` → verify a clean `expo prebuild` + dev build renders the picker on both
platforms → ADR 010 + README row, Architecture Book (chrome `@expo/ui` note + Settings-screen note +
barrel flip) + changelog, roadmap step 1 update, inbox file. Gate on `npx tsc --noEmit`,
`npm run lint` (zero warnings), `npm test` (proof test + the K-3 gate still green). No `app.config.ts`
/ babel change; no OpenAPI regen; no server/web/`app/` touch.

## Open Questions

None blocking. Deferred (recorded, not built): a higher-level composed `SettingsPicker` (earned by a
second consumer / the Phase-1.5 exemplar — D4); a platform-specific `@expo/ui` entry or a non-`@expo/ui`
fallback control (only if a control diverges or `@expo/ui` proves unstable — ADR 010 revisit);
theming/tinting the native picker (only if a design needs it and `@expo/ui` exposes the surface — D4);
the `@expo/ui` `Icon` babel-plugin (added by the first `Icon` consumer — D3); a `settings_changed`
analytics event in A1's setters (when the analytics taxonomy is defined — D7); a Maestro
native-picker toggle round-trip (only if reliable on both platforms — D5); the manual on-device DoD
axes (inbox — D7).
