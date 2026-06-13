# Splash screen — one trivial screen taken through the entire DoD on both platforms

## Why

Foundation roadmap **step 13** is the **capstone of Phase 0**: every cross-cutting system is
now wired and green in CI (api-client, lint, tests, i18n, a11y, Firebase, storage, theming,
EAS config), but **no screen has yet been driven through the entire Definition of Done**. The
splash is deliberately trivial so that the polish IS the foundation, not feature-fighting — it
is the first feature to exercise the DoD end-to-end on iOS and Android. This change also
discharges a debt the Architecture Book recorded by name: *"the real splash (step 13) … must
honor `AccessibilityInfo.isReduceMotionEnabled`"* (a11y section) — the splash is the first
animation in the app, so it owns the reduced-motion obligation.

History: the Expo-logo splash animation (`AnimatedSplashOverlay`) was **deleted** in the i18n
step (step 6), and `app.config.ts` today carries only a static native splash via the
`expo-splash-screen` config plugin. This change builds the real first-paint experience on top
of that static native splash and walks every DoD axis explicitly — the automatable axes as
real tasks, the irreducibly on-device ones inboxed and HUMAN-tagged.

## What Changes

- **A polished animated splash overlay** (`src/components/splash-screen.tsx`), a JS overlay
  that renders over the static native splash and fades out once the app is ready (fonts +
  i18n init + the storage migration runner). It honors **reduced motion**: when
  `AccessibilityInfo.isReduceMotionEnabled` is true it renders the same final frame with **no
  animation** and hides immediately (no fade). Branded at the **token level** (`@/theme`
  colors + the `app.name` i18n string) — no raw colors, no alpha APIs reached directly (the
  chrome/theme lint boundaries enforce this). R-3 native-correct: a simple, native-feeling
  brand splash, not a Flutter copy.
- **Route entrypoint over a `@/components` module** per the route-structure rule: the overlay
  lives in `src/components/splash-screen.tsx` (tested there) and is mounted by
  `src/app/_layout.tsx` (the existing root `Stack`), coordinated with the existing startup
  wiring (`import "@/i18n"`, `runMigrations()`). The native side uses
  `expo-splash-screen`'s `preventAutoHideAsync()` / `setOptions()` / `hideAsync()` (SDK 56 API).
- **A `useAppReady()` readiness gate** (`src/hooks/use-app-ready.ts`): a single hook that
  resolves when fonts, i18n, and the storage migration runner (`useMigrations()`) are all
  ready — the moment the overlay is allowed to dismiss. This is the pattern features inherit
  for "render only when prerequisites are satisfied."
- **i18n**: any splash copy is a `t()` key (FR + EN complete, `tsc`-typed parity).
- **a11y**: the splash exposes an accessible status/label so assistive tech announces it
  rather than reading a silent node; reduced-motion honored at runtime; no `allowFontScaling`
  override. Manual VoiceOver/TalkBack passes inboxed.
- **One CI proof test** (`src/components/splash-screen.test.tsx`) mirroring the i18n / a11y /
  firebase / theming proofs: asserts the splash renders the localized brand string through the
  real theme + a11y tree, that the **reduced-motion branch** renders without animating (mocking
  `AccessibilityInfo`), and that the overlay dismisses once ready.
- **Architecture Book** gains a **"Splash"** section (the overlay-over-native-splash pattern,
  the readiness gate, the reduced-motion contract, token/i18n sourcing, what CI proves vs.
  what is manually verified on-device); the a11y section's reduced-motion deferral note is
  updated to point at it; the Rule changelog gets an entry; roadmap step 13 marked done.
- **The explicit DoD walk** is the heart of this change: the automatable axes (tokens/theming
  applied, light/dark, i18n, a11y roles/labels, reduced-motion, types/lint/tests, CI proof,
  Crashlytics non-regression) are real tasks; the irreducibly-manual on-device axes (manual
  VoiceOver + TalkBack passes, on-device pixel / native-correctness check on iOS + Android,
  real-device reduced-motion check, contrast eyeball, performance/jank on a low-end Android,
  analytics-arrival verification) are **inboxed and HUMAN-tagged**.

## Capabilities

### New Capabilities

- `mobile-splash`: the mobile app's first-paint / splash experience — the native static splash
  + the JS animated overlay, the readiness gate that coordinates with i18n init and the storage
  migration runner, the **reduced-motion contract** (the app's first animation), token + i18n
  sourcing of the brand, the accessible-status semantics, and what CI proves about the splash
  vs. what is verified manually on-device (the full DoD walk on both platforms).

### Modified Capabilities

<!-- none. mobile-a11y already owns the reduced-motion obligation in prose; this change is its
first live consumer (the first animation) but does not change that capability's requirements —
it discharges a recorded deferral. mobile-theming and mobile-i18n are consumed unchanged. The
Architecture Book gains a Splash section — normal book evolution, not a requirement change. -->

## Impact

- `mobile/`: new `src/components/splash-screen.tsx` (+ `.test.tsx`), `src/hooks/use-app-ready.ts`;
  `src/app/_layout.tsx` mounts the overlay and coordinates dismissal with the existing
  `runMigrations()` / i18n wiring; `en.json` / `fr.json` gain the splash copy key(s);
  `expo-splash-screen` config in `app.config.ts` may be refined (token-matched background) — a
  CNG/config change that regenerates native projects on the next `prebuild`. Possible
  `jest/`-level mock for `expo-splash-screen` if the module is touched at import time.
- `.claude/rules/mobile/architecture.md`: a "Splash" section added; the a11y reduced-motion
  deferral note updated to point at it. `.claude/rules/mobile/architecture-changelog.md`: an
  entry. The DoD checklist is *exercised*, not changed.
- `docs/react-native-migration/01-roadmap/01-foundation.md`: step 13 marked done (Phase 0 exit).
- `docs/react-native-migration/inbox/2026-06-13-splash-dod-manual.md`: the manual on-device DoD
  items (VoiceOver + TalkBack, on-device pixel/native-correctness on iOS + Android, real-device
  reduced-motion, contrast eyeball, low-end-Android jank, analytics-arrival) — what / why / how
  to verify.
- No server / web / `app/` code touched. Native projects are CNG/gitignored and regenerate on
  the next `prebuild`.
