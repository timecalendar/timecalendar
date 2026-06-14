# Settings screen: native @expo/ui picker controls driving the prefs hooks, first @expo/ui chrome consumer, full DoD

## Why

Phase 2 opens with **Settings, Feature A** (ADR [004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md)).
A1 (`add-mobile-settings-prefs` / TIM-130, merged) landed Feature A's **data/logic layer** —
the first feature folder (`mobile/src/features/settings/prefs/`), the typed theme + language
preference store behind `@/storage`, the reactive `useThemePreference` / `useLanguagePreference`
hooks, the C1 theme-override + i18n startup/runtime wiring, and the now-enforced K-3 coverage gate.
A1 explicitly shipped **no screen, no route, no native control** and named A2 (this change) as their
owner. Feature A is not DoD-complete until A2 lands.

This change is the **screen + native controls** that drive A1's hooks. It is the **first feature
through the entire Definition of Done** *with a real interactive product control* (the splash, step
13, walked the DoD but had no user interaction). So it is where several DoD obligations the
foundation deferred to "the first real interactive control" first **bite**: touch-target minimums,
meaningful translated labels on a custom touchable, and the manual VoiceOver/TalkBack pass.

It also lands the **theming-D6 deferral by name**: `src/components/chrome/index.ts` today carries
only an `@expo/ui` *boundary note* (no wrapper body) — "when the first consumer arrives (likely
Settings, Phase 1.5), add an `expo-ui.tsx` wrapper here as the single import site for `@expo/ui`."
A2 is that first consumer. It adds the wrapper body `src/components/chrome/expo-ui.tsx` (the single
import site for `@expo/ui`, which the chrome lint boundary already bans elsewhere) and exports it
from the chrome barrel.

## What Changes

- **A presentational Settings screen — `src/components/settings-screen.tsx`** (tested beside it),
  exposed as a thin route `src/app/settings.tsx` (`export { default } from "@/components/settings-screen"`).
  The screen is **presentational** (it renders controls and delegates all state to A1's hooks), so it
  lives under `src/components/**` — covered by behavior tests under the 70% global floor, **exempt from
  the 90% logic gate** per ADR [003](../../../.claude/rules/mobile/decisions/003-coverage-threshold.md)
  (logic stays in `src/features/settings/`, which A1 owns). See design D1 for the route-structure ↔
  ADR-003 tension this resolves.
- **Two native picker controls** (theme, language) via the **first `@expo/ui` chrome-wrapper
  consumer**. The new wrapper `src/components/chrome/expo-ui.tsx` is the single import site for
  `@expo/ui` (the universal `Host` + `Picker` + `Picker.Item`), re-exported (typed) from the chrome
  barrel; the screen imports `@/components/chrome`, never `@expo/ui`. Each picker is single-select,
  value-based, `appearance: "menu"`, and drives the matching A1 hook's `setPreference` from
  `onValueChange`. `Picker` is a native control → OS-accessible (SwiftUI on iOS / Compose on Android).
- **In-app theme + language switcher** wired to A1's reactive hooks: selecting a theme option calls
  `useThemePreference().setPreference` (the C1 seam re-resolves, the whole app re-themes); selecting a
  language calls `useLanguagePreference().setPreference` (persists + `i18n.changeLanguage` live). A2
  adds **no new prefs logic** — it only renders controls over the existing hooks.
- **Reachability** (route-structure rule): `<Stack.Screen name="settings" />` added to
  `src/app/_layout.tsx` (a `Stack` sibling of `(tabs)`); an accessible Profile→Settings entry control
  on `src/app/(tabs)/profile.tsx` (an Expo-Router `Link`/`Pressable` with `accessibilityRole` + a
  translated label, meeting the 44pt/48dp touch-target minimum). Deep-link target
  `timecalendar-dev://settings` for Maestro (mirrors `schools`).
- **i18n** — new flat dotted keys for the title, the two control labels, and each option label, plus
  the Profile→Settings entry label, FR + EN complete (`tsc`-typed bidirectional parity).
- **a11y** — native pickers carry OS accessibility; the custom Profile→Settings touchable carries an
  explicit role + translated label and a ≥44pt/48dp hit target. Manual screen-reader / on-device axes
  inboxed + HUMAN-tagged.
- **Jest** — a suite-wide `jest/setup-expo-ui.ts` mock (registered in `jest.config.js`) so the
  universal `Host` / `Picker` / `Picker.Item` render under Jest and the component test can assert the
  screen and drive `onValueChange`. Mirrors `setup-firebase` / `setup-splash` / `setup-storage`.
- **One CI proof test** (`src/components/settings-screen.test.tsx`): the screen renders the localized
  title + both controls through the real theme + i18n tree; driving a picker's `onValueChange` calls
  the matching A1 hook's setter (wiring proven — the screen → hook → seam path).
- **A Maestro flow** (`mobile/.maestro/settings.yaml`): deep-link to `timecalendar-dev://settings`,
  assert the localized title + the controls render (stable `testID`s / text). It deliberately does
  **not** attempt a native-picker toggle round-trip (native pickers are non-deterministic to drive
  across iOS+Android — design D4).
- **Architecture Book** gains an `@expo/ui` wrapper note under **"Theming & native-chrome"** (the
  D6 deferral discharged) and a **"Settings screen"** sub-section under **"Settings preferences"**;
  the chrome barrel note flips from "boundary only" to "wrapper landed"; a **changelog** entry; ADR
  [010](../../../.claude/rules/mobile/decisions/010-expo-ui-chrome-wrapper.md) records the `@expo/ui`
  adoption + the universal-entry choice; roadmap step 1 marked "A2 screen landed; Feature A DoD pass
  pending on-device". The manual on-device DoD axes are inboxed.

## Capabilities

### New Capabilities

- `mobile-settings-screen`: the Settings feature's UI layer — the presentational Settings screen and
  its thin route, the two native `@expo/ui` picker controls (theme, language) driving A1's reactive
  preference hooks, the **first `@expo/ui` chrome-wrapper** (`src/components/chrome/expo-ui.tsx`, the
  single import site, exported from the barrel — discharging the theming-D6 deferral), the
  Profile→Settings reachability (root `Stack` sibling + an accessible entry control + the dev deep
  link), the FR/EN control/option strings, the a11y obligations that first bite for a real interactive
  control, and what CI proves (screen + control→hook wiring) vs. what is verified manually on-device
  (native-picker feel/contrast, VoiceOver/TalkBack, Maestro-through-the-native-picker).

### Modified Capabilities

<!-- none. mobile-settings-prefs (A1) is consumed unchanged — A2 renders controls over its existing
hooks and adds no prefs logic, so its requirements do not change. mobile-theming gains an @expo/ui
wrapper under its native-chrome seam (the D6-deferred body) — normal seam evolution per R-1/R-2, not
a contract change to an existing requirement; the new wrapper is owned by and described in this
change's spec. mobile-architecture-book gains a "Settings screen" note + the @expo/ui wrapper note —
normal book evolution. -->

## Impact

- `mobile/`: new `src/components/settings-screen.tsx` (+ `.test.tsx`); new thin route
  `src/app/settings.tsx`; new chrome wrapper `src/components/chrome/expo-ui.tsx` + barrel export in
  `src/components/chrome/index.ts`; `src/app/_layout.tsx` gains `<Stack.Screen name="settings" />`;
  `src/app/(tabs)/profile.tsx` gains the accessible Settings entry control; `en.json` / `fr.json`
  gain the settings/option/entry keys; new `jest/setup-expo-ui.ts` registered in `jest.config.js`;
  new `mobile/.maestro/settings.yaml`.
- **`app.config.ts`: no change.** `@expo/ui` ships an `expo-module.config.json` and **autolinks**
  (like `react-native-mmkv` v4) — it needs **no** `plugins` entry. Its babel-plugin is only for the
  `@expo/ui` `Icon` component (which A2 does not use), so `babel.config.js` is unchanged. Native
  projects regenerate on the next `npx expo prebuild` (e2e already prebuilds); never hand-edit
  `mobile/ios` / `mobile/android`. (Verified against `node_modules/@expo/ui` — see design D3.)
- **No new dependency** — `@expo/ui@56.0.17` is already installed.
- `.claude/rules/mobile/architecture.md`: an `@expo/ui` wrapper note added to "Theming &
  native-chrome"; a "Settings screen" note added to "Settings preferences".
  `.claude/rules/mobile/architecture-changelog.md`: an entry appended.
  `.claude/rules/mobile/decisions/010-expo-ui-chrome-wrapper.md`: new ADR + README index row.
- `docs/react-native-migration/01-roadmap/02-pattern-establishment.md`: step 1 updated (A2 screen
  landed; Feature A DoD pass pending the inboxed on-device axes).
- `docs/react-native-migration/inbox/2026-06-14-settings-screen-dod-manual.md`: the manual on-device
  DoD axes (VoiceOver + TalkBack on the screen + the Profile entry control, native-picker
  feel/native-correctness iOS + Android, light/dark + contrast eyeball, touch-target on-device check,
  Maestro-through-native-picker if it can be made reliable) — what / why / how to verify.
- No server / web / `app/` code touched. No OpenAPI change. No K-3 jest-config change (the screen is
  presentational, under the 70% global floor — the gate stays exactly as A1 set it).
