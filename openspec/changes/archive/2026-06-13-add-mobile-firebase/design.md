# Design — mobile Firebase (Crashlytics + Analytics)

## Context

`mobile/` has no crash reporting or analytics. This change wires `@react-native-firebase`
Crashlytics + Analytics, proves them, and records what tooling can't enforce — foundation
step 8. The Flutter app already uses Firebase (`firebase_core/analytics/auth/crashlytics/
messaging`) against the `timecalendar-samuelprak` project; the RN app reuses that project
for production and the existing `timecalendar-dev` project for the dev variant.

Constraints shaping the design:
- **CNG.** `mobile/ios` and `mobile/android` are generated + gitignored; all native config
  flows through `app.config.ts` + config plugins (`expo prebuild`). No hand-edited native.
- **Two app identities.** The dev variant ships `fr.samuelprak.timecalendar.dev`, the store
  app `fr.samuelprak.timecalendar`. Android's google-services Gradle plugin matches on
  package name, so the dev build needs a config that actually contains `.dev`.
- **R-2 / R-1.** No speculative scope (Crashlytics + Analytics only); encode in tooling
  before prose; the verification surface is real, not invented.
- **No real feature exists.** The skeleton walks — the only consumer is a dev-only panel.

## Goals / Non-Goals

**Goals:**
- Crashlytics + Analytics initialized on both platforms via config plugins, CI-green.
- A forced crash and a logged event both arrive in the Firebase console (manual proof).
- A thin, swappable `src/firebase/` seam; the SDK is not called directly at feature sites.
- Per-environment Firebase project separation, variant-switched in `app.config.ts`.
- One automated proof test; the `.dev` Firebase registration discharged.

**Non-Goals:**
- **No Auth, no Messaging** — deferred to the features that need them (R-2), despite the
  Flutter app using both.
- **No analytics consent / GDPR gate** — collection is on-by-default now to verify;
  a consent gate is owned by a later feature (recorded debt; the French user base makes it
  real).
- **No locale-aware or custom event taxonomy** — events are ad-hoc for verification only.
- **No JS error boundary / custom global handler** — RNFirebase installs one natively.

## Decisions

### D1 — `@react-native-firebase` (v24, modular API) over the Firebase JS SDK
RNFirebase wraps the native Firebase SDKs, which is what Crashlytics (native crash capture)
and on-device Analytics require; the Firebase JS/Web SDK can't report native crashes. The
**modular** API (`getCrashlytics`/`getAnalytics` + free functions) is used throughout — the
namespaced `firebase.crashlytics()` style is deprecated in v22+. *Alternative:* the JS SDK
— rejected, no native crash reporting, wrong tool for RN.

### D2 — One Firebase project per environment, variant-switched config files
Google's recommended practice: Analytics, Crashlytics, quotas and billing are
project-scoped, so dev noise must not pollute production data. Mapping:
- production `fr.samuelprak.timecalendar` → `timecalendar-samuelprak` (reuse Flutter files)
- dev `fr.samuelprak.timecalendar.dev` → `timecalendar-dev` (register the `.dev` apps)

`app.config.ts` selects `googleServicesFile` by `APP_VARIANT` (the `IS_DEV` branch already
existed for appId/scheme). The four files are committed in `mobile/firebase/` — client API
keys are not secret (embedded in the binary) and the Flutter app commits its pair too.
*Alternative:* one project, two apps — rejected: dev crashes/events pollute the prod
dashboards. *Alternative:* prod config for both — rejected: Android package mismatch breaks
the build and there's no dev/prod isolation.

### D3 — `useFrameworks: "static"` (mandatory), merged into `expo-build-properties`
The Firebase iOS SDK ships static frameworks, so RNFirebase requires static linking. Set in
the *existing* build-properties block (not a second one — it already carries the iOS
deployment floor, the Android minSdk floor, and the dev-only cleartext flag). This is the
highest-risk change (it alters pod linking app-wide); the documented escape if a pod breaks
is `ios.forceStaticLinking` for the RNFB pods.

### D4 — Thin `src/firebase/` wrapper, **no** startup side-effect
`src/firebase/index.ts` exposes `logEvent` / `logMessage` / `recordError` / `crashTest`
over the modular SDK — one seam, swappable, decoupled call sites (the step-10 "behind our
own abstractions" philosophy). Each helper resolves the native instance lazily inside its
body, so importing the module never touches native code (safe in Jest).

Deliberately **unlike i18n**: there is no `import "@/firebase"` in `_layout.tsx`, because
RNFirebase **auto-initializes** the native default app from the bundled config files and
**auto-installs the global JS exception handler** — so there is genuinely nothing to run at
startup. Forcing a side-effect import to mirror i18n would be cargo-culting; the honest
shape is a call-site module. (Revisit if a real startup action appears — e.g. a consent
toggle or a user-id attribute.)

### D5 — `firebase.json` `crashlytics_debug_enabled: true`
Crashlytics is disabled in debug builds by default. Enabling it lets a local `npm run ios/
android` (debug + Metro, dev variant) report a forced crash for convenient verification.
Release-config builds (the e2e jobs, EAS) report regardless. Handler chaining stays default.

### D6 — Dev-only verification surface on Profile
A `__DEV__`-gated `FirebaseDebugPanel` renders two labelled `Pressable`s on the Profile tab:
**Log test event** → `logEvent`, **Trigger test crash** → `crashTest`. Gated by `__DEV__`
so it never renders in production. It doubles as the **first live exercise** of the four
`react-native-a11y` touchable rules (role + translated label on each Pressable). *Alternative:*
a throwaway temporary edit for verification — rejected; a persistent dev-only panel keeps
dogfood verification repeatable and honestly exercises the a11y rules.

### D7 — Proof in CI vs. manual on-device
`src/firebase/firebase.test.ts` mocks the native modules (`jest/setup-firebase.ts`, suite-
wide, mirroring `setup-i18n`) and asserts the wrapper drives the SDK with the expected args
— init + wrapper + SDK call wiring proven in CI. CI **cannot** assert an event/crash arrives
in the Firebase console, so that half is a documented manual on-device step (DebugView for
the event, the Crashlytics dashboard for the crash). The Maestro e2e is unchanged — it
asserts a seeded school name; Firebase just must not break app launch.

## Risks / Trade-offs

- **`useFrameworks: "static"`** alters pod linking app-wide → validate first after
  `prebuild`; escape is `forceStaticLinking`. Highest-risk item.
- **Committed config files are a blocking manual prereq** → native builds/e2e fail until the
  four files exist in `mobile/firebase/`; documented in its README. CI `test-mobile` is
  unaffected (tsc/lint/Jest don't read them).
- **Analytics on by default vs. GDPR** → deliberate for verification; consent gate is later
  recorded debt. The store app inherits the Flutter app's existing posture meanwhile.
- **Committing client API keys** → non-secret (shipped in the binary); consistent with the
  Flutter app.
- **`.dev` apps must be registered manually** → console-only work; can't be scripted here.

## Migration Plan

Additive; rollback = revert + remove the deps. Order: add deps → `app.config.ts` (plugins +
static frameworks + variant `googleServicesFile`) → `firebase.json` → `src/firebase/`
wrapper + Jest mock + proof test → dev panel + catalog labels → Architecture Book + roadmap.
Gate on `tsc`, `npm run lint` (zero warnings), `npm test`. Then the manual on-device proof
once the `.dev` config files are in place.

## Open Questions

None blocking. Deferred (recorded, not built): Auth, Messaging, analytics consent gate,
custom event taxonomy, native dSYM symbolication beyond what the Crashlytics plugin wires.
