TimeCalendar should be a modern Expo SDK 56 app on React Native 0.85 with New Architecture, Hermes, Expo Router, TanStack Query v5, Zustand, MMKV, Expo UI (SwiftUI/Compose), FlashList v2, Reanimated 4, expo-notifications, Sentry, and PostHog wired from day one. [docs.expo](https://docs.expo.dev/guides/using-hermes/)
Below is a decision-ready blueprint you can start implementing tomorrow.

***

## Reference stack (one-page summary)

| Area | Chosen tool / approach | Version (mid‑2026) | Notable alternative |
| --- | --- | --- | --- |
| Runtime / SDK | Expo SDK 56 (RN 0.85, React 19.2, Hermes, New Arch only) | Expo SDK 56, RN 0.85, Hermes default [expo](https://expo.dev/sdk/56) | SDK 55 (RN 0.83) if you must support older devices [expo](https://expo.dev/sdk/55) |
| Navigation | Expo Router (file‑based, typed routes) | expo-router as bundled with SDK 56 [expo](https://expo.dev/sdk/56) | Raw React Navigation (only via expo-router/react-navigation) [docs.expo](https://docs.expo.dev/router/migrate/sdk-55-to-56/) |
| Server state | TanStack Query (React Query) | @tanstack/react-query v5.8x (current stable 5.81.5 mid‑2025) [tanstack](https://tanstack.com/blog/announcing-tanstack-query-v5) | RTK Query (if you were all‑in on Redux) |
| API client & types | Orval → TanStack Query hooks from OpenAPI | orval v8+ with `client: 'react-query'` [orval](https://orval.dev/guides/react-query) | openapi-typescript + openapi-fetch-gen [github](https://github.com/openapi-ts/openapi-typescript) |
| Client/global state | Zustand | zustand v5.0.x (5.0.12 latest Mar 2026) [grounded-api](https://grounded-api.dev/npm/zustand) | Jotai 2.x for atomic state [jotai](https://jotai.org) |
| Local key‑value storage | react-native-mmkv | v4.3.1, no known vulns as of Apr 2026 [security.snyk](https://security.snyk.io/package/npm/react-native-mmkv) | AsyncStorage community module [github](https://github.com/react-native-async-storage/async-storage) |
| Secure storage | expo-secure-store | ~15.0.x / 55.x track, actively maintained [npmjs](https://www.npmjs.com/package/expo-secure-store) | Encrypted MMKV (custom) |
| Biometric auth | expo-local-authentication | latest SDK 56 bundle [github](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/local-authentication.mdx) | Platform-native flows (OS‑level only) |
| Calendars (UI) | @howljs/calendar-kit (TimelineCalendar) on top of FlashList | calendar-kit 1.x using FlashList, Reanimated, gesture-handler [blog.csdn](https://blog.csdn.net/gitblog_01050/article/details/142015967) | Custom timeline on FlashList v2; react-native-big-calendar [madewithreactjs](https://madewithreactjs.com/react-native-big-calendar) |
| List virtualization | FlashList | @shopify/flash-list v2.x, NA‑ready, JS‑only [shopify](https://shopify.engineering/flashlist-v2) | FlatList (baseline) |
| Animations | React Native Reanimated + new RN 0.85 backend | react-native-reanimated 4.x, NA‑only [github](https://github.com/software-mansion/react-native-reanimated) | Animated API (for trivial cases) |
| Gestures | react-native-gesture-handler | Latest 2.x with NA support [github](https://github.com/software-mansion/react-native-gesture-handler/releases) | RN built‑in Pressable + ScrollView only |
| Date/time | Temporal polyfill + date-fns(-tz) | @js-temporal/polyfill latest, date-fns & date-fns-tz [github](https://github.com/js-temporal/temporal-polyfill/blob/main/CHANGELOG.md) | Luxon (heavier) [npm-compare](https://npm-compare.com/@js-temporal/polyfill,date-fns,date-fns-tz,dayjs,luxon,moment) |
| Recurrence | rrule.js | rrule latest from jkbrzt/rrule [github](https://github.com/jkbrzt/rrule) | Hand‑rolled recurrence (don’t) |
| Notifications | expo-notifications + Expo push service | expo-notifications ~56.0.x [docs.expo](https://docs.expo.dev/versions/latest/sdk/notifications/) | Notifee (advanced local APIs), OneSignal [pkgpulse](https://www.pkgpulse.com/guides/notifee-vs-expo-notifications-vs-onesignal-react-native-2026) |
| Theming baseline | StyleSheet + light design tokens | React Native StyleSheet.create [necolas.github](https://necolas.github.io/react-native-web/docs/styling/) | NativeWind v5, Tamagui [nativewind](https://www.nativewind.dev/v5) |
| Native look & feel | Expo UI (SwiftUI + Compose primitives) | @expo/ui stable in SDK 56 [expo](https://expo.dev/sdk/56) | react-native-paper 5 (MD3) – now “aging” [medium](https://medium.com/call-stack/react-native-paper-5-0-whats-new-6e0df8c075e9) |
| Error/crash tracking | Sentry | Sentry Expo integration guides 2026 [docs.sentry](https://docs.sentry.io/platforms/react-native/manual-setup/expo/) | Bugsnag, Firebase Crashlytics |
| Product analytics | PostHog | posthog-react-native w/ Expo support [posthog](https://posthog.com/docs/libraries/react-native) | Amplitude, Mixpanel |
| Feature flags | Statsig | statsig React Native SDK [docs.statsig](https://docs.statsig.com/client/ReactNative) | PostHog feature flags [posthog](https://posthog.com/docs/libraries/react-native) |
| Unit/component tests | Jest + React Native Testing Library | Jest + @react-native/jest-preset, RNTL v14+ [reactnative](https://reactnative.dev/blog/2026/04/07/react-native-0.85) | Vitest (not first‑class on RN yet) |
| E2E | Maestro | Maestro OSS, multi‑platform, simple YAML [github](https://github.com/mobile-dev-inc/maestro) | Detox (heavier but powerful) [medium](https://medium.com/@3jacksonsmith/mastering-detox-for-react-native-step-by-step-guide-to-e2e-testing-webview-logins-with-robot-97f7a9898a17) |
| Perf regression tests | Reassure + Flashlight | Reassure (by Callstack), Flashlight for Android [dev](https://dev.to/callstackengineers/continuous-app-performance-monitoring-made-simple-with-reassure-2o67) | Manual profiling only |
| Lint/format | ESLint 9.x + Prettier | ESLint 9.x [eslint](https://eslint.org/blog/2025/06/eslint-v9.29.0-released/) | Biome (single tool, still maturing for RN) [github](https://github.com/biomejs/biome) |
| Builds & OTA | EAS Build/Submit/Update + Hermes bytecode diffing | EAS Build, expo-updates with diffing from SDK 55+ [expo](https://expo.dev/sdk/55) | Manual Xcode/Gradle builds |
| Env/secrets | EAS env vars + EAS secrets, minimal .env | EAS environment variables guide 2026 [docs.expo](https://docs.expo.dev/eas/environment-variables/) | react-native-config |

***

## 1. Foundations & currency

**Recommendation**

- Target Expo SDK 56 with React Native 0.85, React 19.2, Hermes, and New Architecture only. New Architecture is not optional anymore in SDK 55+. [docs.expo](https://docs.expo.dev/guides/new-architecture/)
- Node.js: use >= 20.19.4 (RN 0.85 minimum). [reactnative](https://reactnative.dev/blog/2026/04/07/react-native-0.85)
- TypeScript: strict mode on (noImplicitAny, strictNullChecks, noUncheckedIndexedAccess, exactOptionalPropertyTypes).  
- Use Hermes (Expo default) on both platforms. [reactnative](https://reactnative.dev/blog/2022/07/08/hermes-as-the-default)

**Why**

- SDK 56 brings Expo UI stable, New Architecture everywhere, and RN 0.85’s shared animation backend, which matters for calendar performance and smooth gestures. [expo](https://expo.dev/sdk/56)
- Hermes gives smaller bundles, better startup, and lower memory, which is critical on low‑end Android devices used by students. [dev](https://dev.to/davekurian/react-native-ecosystem-advances-with-expo-sdk-56-and-react-192-updates-in-2026-3df5)
- RN 0.85 drops support for older Node and some obsolete APIs (e.g. StyleSheet.absoluteFillObject), so aligning your Node baseline prevents upgrade pain later. [bacancytechnology](https://www.bacancytechnology.com/blog/react-native-0-85)

**Specific libraries / versions / status**

- `"expo": "~56.x.x"` (as generated by `npx create-expo-app`). [expo](https://expo.dev/sdk/56)
- React Native 0.85 via Expo SDK 56. [reactnative](https://reactnative.dev/blog/2026/04/07/react-native-0.85)
- TypeScript 5.5+ w/ `jsx: "react-native"`.  
- Hermes JS engine enabled by default in Expo SDK >= 48 and explicitly documented for Expo 2026. [docs.expo](https://docs.expo.dev/guides/using-hermes/)

**Avoid (with reason)**

- Expo SDK < 55: still supports legacy architecture or lacks new OTA diffing & Expo UI. [expo](https://expo.dev/sdk/55)
- RN 0.82 or below: legacy architecture still around, but frozen and no new fixes after June 2025. [github](https://github.com/reactwg/react-native-new-architecture/discussions/290)
- JavaScript (no TS): you lose type‑safety for OpenAPI‑generated clients and router types – unacceptable for a large student app.

**Difficulty**

- Foundations: **easy** in 2026 – Expo CLI scaffolds this stack in one command. [dev](https://dev.to/davekurian/react-native-ecosystem-advances-with-expo-sdk-56-and-react-192-updates-in-2026-3df5)

***

## 2. Project architecture

**Recommendation**

- Use Expo Router as the top‑level app structure and follow its “app directory” convention (`app/(auth)`, `app/(app)/calendar`, etc.). [docs.expo](https://docs.expo.dev/router/installation/)
- Feature‑first structure: group by domain (calendar, auth, settings), not by technology.  
- Keep “clean architecture” lightweight: domain logic in plain TS modules, React hooks as the boundary, no heavyweight DDD layers.

**Why**

- Expo Router is now the default recommended navigation structure in Expo templates and tightly integrated with SDK 55+. [nativeweekly.beehiiv](https://nativeweekly.beehiiv.com/p/march-6-2026-issue-14)
- File‑based routing with nested layouts gives you a natural module boundary and eliminates a ton of boilerplate route config. [docs.expo](https://docs.expo.dev/router/reference/typed-routes/)
- Over‑abstracted architectures slow small senior teams more than they help; this app is a rich client, not a microservices backend.

**Concrete structure**

- `/app` — Expo Router routes  
  - `/app/(auth)/sign-in.tsx`  
  - `/app/(app)/calendar/day.tsx`, `/week.tsx`, `/agenda.tsx`  
  - `/app/(app)/settings/index.tsx`  
- `/features/calendar` — hooks, components, domain logic  
  - `components/DayTimeline.tsx`, `WeekTimeline.tsx`, `AgendaList.tsx`  
  - `hooks/useCalendarEvents.ts` (TanStack Query)  
  - `hooks/useCalendarGestures.ts` (Reanimated + gesture-handler)  
  - `domain/recurrence.ts` (Temporal + rrule)  
- `/features/auth` — token management, secure storage, screens  
- `/lib` — cross‑cutting infra: axios/fetch client, queryClient, logging, theming.  
- `/assets` — fonts, icons, illustrations.  
- `/tests` — shared test utilities, mocks.

**Idiomatic React/RN 2026 patterns**

- Hooks everywhere; no class components.  
- Use Suspense for data fetching once you are comfortable with TanStack Query v5’s suspense support; otherwise start non‑suspense and migrate gradually. [tanstack](https://tanstack.com/blog/announcing-tanstack-query-v5)
- Error boundaries per route segment, especially around calendar screens to isolate failures.

**Avoid**

- “Clean architecture” with 5+ layers (entity, repository, gateway, interactor, etc.) – overkill.  
- Giant `utils` or `services` directories that mix concerns.  
- Ambiguous colocation like `components/common` with no discipline.

**Difficulty**

- Architecture: **easy** if you follow Expo Router + feature folders.

***

## 3. Navigation

**Recommendation**

- Use Expo Router as the only navigation layer, leveraging layouts, stacks, tabs, and typed routes. [docs.expo](https://docs.expo.dev/versions/latest/sdk/router/)
- Use Expo Router’s `expo-router/react-navigation` export when you need deeper React Navigation primitives (e.g. custom navigators). [docs.expo](https://docs.expo.dev/router/migrate/sdk-55-to-56/)
- Configure deep linking & universal/app links via Expo config (`app.json` / `app.config.ts`) + router support.

**Why**

- Expo Router in SDK 56 no longer allows direct application imports from `@react-navigation/*` – you must go through expo-router entrypoints, and Expo even codemods this for you. [docs.expo](https://docs.expo.dev/versions/latest/sdk/router/)
- Typed routes support generates route types from the file system, reducing runtime navigation bugs. [docs.expo](https://docs.expo.dev/router/reference/typed-routes/)
- Deep linking and app links are built into Expo’s config pipeline and work across EAS Build targets. [docs.expo](https://docs.expo.dev/router/installation/)

**Specific APIs**

- Use `Link`, `useRouter`, `useLocalSearchParams` from `expo-router` for navigation & params. [docs.expo](https://docs.expo.dev/router/reference/typed-routes/)
- Use layout routes:  
  - `app/(auth)/_layout.tsx` for auth stack  
  - `app/(app)/_layout.tsx` for main app (tabs/stack)  
- Deep linking: configure `scheme`, `host`, and `paths` in `app.config.ts` and let Expo Router map them.

**Avoid**

- Direct `@react-navigation/*` imports in app code on SDK 56+; Expo Router will error and the official migration guide tells you to repoint to `expo-router/*` entrypoints. [docs.expo](https://docs.expo.dev/router/migrate/sdk-55-to-56/)
- React Navigation v5/early v6 tutorials; Expo Router has changed how you should think about structure in 2026.

**Difficulty**

- Core navigation: **easy**.  
- Complex native‑feeling nested navigation (modals, sheets, etc.): **medium**, but manageable with Expo Router + Expo UI.

***

## 4. State management

**Recommendation**

- Server state: TanStack Query v5 is your only server‑state tool. [linkedin](https://www.linkedin.com/posts/armen-melkumyan-715975193_reactquery-tanstack-reactjs-activity-7348700707304144896-WGMt)
- Global/client state: Zustand v5 for simple, minimal stores. No Redux for this app.  
- Local persistence: react-native-mmkv for fast, synchronous key‑value; expo-sqlite for structured offline data if needed. [github](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/sqlite.mdx)

**Why**

- TanStack Query solves caching, retries, background refetch, and offline for REST so you don’t invent it yourself. [dreamix](https://dreamix.eu/insights/tanstack-query-v5-migration-made-easy-key-aspects-breaking-changes/)
- Zustand is tiny, actively maintained (v5 with frequent 2025‑2026 releases), and widely adopted in RN, with good compatibility with hooks and Suspense. [dev](https://dev.to/ersuman/zustand-in-react-native-a-modern-state-management-solution-p6g)
- MMKV is ~30x faster than AsyncStorage and designed for RN, with recent 4.3.1 release and zero known vulnerabilities. [github](https://github.com/mrousavy/react-native-mmkv)

**Concrete patterns**

- Use TanStack Query for anything from the API: events, timetables, user profile, etc.  
- Use Zustand for:  
  - UI filters (selected day/week, current calendar view)  
  - Ephemeral UI (open sheet IDs)  
  - Cross‑screen “session” state that doesn’t belong on the server  
- Persist only what you must:  
  - Tokens → expo-secure-store  
  - User preferences (theme overrides, hidden calendars) → MMKV  
  - Cached queries → TanStack Query persister + MMKV or AsyncStorage.

**Avoid**

- Redux Toolkit + RTK Query for this app: adds boilerplate and mental overhead; RTK Query’s OpenAPI codegen is nice but we already commit to TanStack Query. [redux.js](https://redux.js.org/introduction/getting-started)
- Recoil: still usable, but the ecosystem momentum is clearly behind TanStack Query + Zustand/Jotai; Recoil doesn’t add anything compelling for this use case. [codercrafter](https://codercrafter.in/blogs/react-native/recoil-state-management-a-react-developers-guide-for-2025)
- `useContext` as a global state solution; you will end up with performance issues and complex prop drilling.

**Difficulty**

- State management: **easy–medium** – mostly wiring and discipline.

***

## 5. Data fetching & API

**Recommendation**

- Use TanStack Query v5 + OpenAPI‑driven codegen via Orval.  
- Wrap the generated client in a thin “API” layer for auth (attach tokens, error normalization).  
- Implement offline‑first where it matters (recent weeks, favorites) via query persistence + staleTime tuning.

**Why**

- TanStack Query v5 is smaller, more ergonomic, and adds unified object API and better Suspense support. [tanstack](https://tanstack.com/blog/announcing-tanstack-query-v5)
- Orval can generate `@tanstack/react-query` hooks directly from your OpenAPI spec, avoiding hand‑rolled query keys and request typing. [orval](https://orval.dev/guides/react-query)
- Offline support is a first‑class scenario in TanStack Query; examples and discussions show how to persist cache to storage in RN. [github](https://github.com/TanStack/query/discussions/8147)

**Specific stack**

- Orval config with `client: 'react-query'`, `mode: 'tags-split'` to get hooks split by tag (e.g. `useCalendarGetEvents`). [zenn](https://zenn.dev/collabostyle/articles/b08a64a1d3ad1c)
- HTTP client: fetch or axios; keep a single configured instance where you inject auth headers and handle refresh.  
- TanStack Query setup:  
  - Global `QueryClient` in `app/_layout.tsx`.  
  - Default `retry: 2`, `staleTime` tuned per resource (short for quick‑changing schedules, longer for static metadata).  
  - Use `queryClient.setQueryData` plus optimistic `onMutate` / `onError` / `onSettled` for event create/update/delete flows. [dreamix](https://dreamix.eu/insights/tanstack-query-v5-migration-made-easy-key-aspects-breaking-changes/)

**Error/retry/cache‑invalidation**

- Standard pattern: events → query key `['events', { range: day/week, tz }]`; create/update → invalidate `['events']` with partial match after mutation.  
- For optimistic updates of event edits:  
  - Snapshot old data in `onMutate`.  
  - Immediately update the cache.  
  - Roll back on error, refetch on settle. [linkedin](https://www.linkedin.com/posts/armen-melkumyan-715975193_reactquery-tanstack-reactjs-activity-7348700707304144896-WGMt)

**Avoid**

- Manual `useEffect` + `fetch` for server state – you’ll re‑implement TanStack Query badly.  
- Codegen tools tied to Redux (RTK Query generator) since you are not using Redux here. [blog.mmmcorp.co](https://blog.mmmcorp.co.jp/2023/02/27/react-orval/)

**Difficulty**

- With Orval wired: **easy** – the hard parts are schema quality and backend consistency.

***

## 6. Auth & security

**Recommendation**

- Token model: short‑lived access token + long‑lived refresh token, both stored in expo-secure-store; keep access token also in memory. [npmjs](https://www.npmjs.com/package/expo-secure-store)
- Use axios/fetch interceptors to attach tokens and handle 401 → refresh → retry logic.  
- Biometric unlock for local re‑authentication using expo-local-authentication + secure-store. [clerk](https://clerk.com/docs/guides/development/local-credentials)
- OAuth/identity providers: use expo-auth-session with PKCE enabled (`usePKCE: true`) for any external IdP (e.g. university SSO, Auth0). [docs.expo](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- Security baseline mapped roughly to MASVS basics; skip heavy MASVS-RESILIENCE controls unless your org requires them. [mas.owasp](https://mas.owasp.org/MASVS/)

**Why**

- expo-secure-store is specifically designed to store encrypted key‑value pairs, with recent versions and active maintenance. [classic.yarnpkg](https://classic.yarnpkg.com/en/package/expo-secure-store)
- expo-local-authentication gives you unified biometric prompts over Face ID / Touch ID / Android Biometric Prompt. [github](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/local-authentication.mdx)
- expo-auth-session is the officially documented Expo approach for OAuth flows, with built‑in PKCE support. [deepwiki](https://deepwiki.com/expo/examples/5.2-auth0-integration)

**Token storage & flow**

- On login:  
  - Receive access + refresh tokens from REST API.  
  - Store both in secure-store; put access token in a Zustand store for quick access.  
- On app launch:  
  - Read tokens from secure-store; if present and not expired, hydrate Zustand and proceed; otherwise show sign‑in.  
- On 401 from API:  
  - Use a single “refresh in progress” gate to avoid refresh storms.  
  - If refresh fails, clear tokens from storage and redirect to login.

**Biometric unlock**

- On app open (when there’s a session), optionally gate access behind `LocalAuthentication.authenticateAsync` and only hydrate sensitive data upon success. [stackoverflow](https://stackoverflow.com/questions/75987668/expo-local-authentication-on-android-skipping-face-authentication)

**Security hardening options (choose based on risk appetite)**

- Jailbreak/root detection: react-native-root-jail-detect (TurboModule/NA‑compatible) or JailMonkey (older but still used). [github](https://github.com/GantMan/jail-monkey)
- TLS certificate pinning: react-native-cert-pinner or react-native-ssl-pinning if you have a narrow set of backend hosts. [snyk](https://snyk.io/blog/getting-started-react-native-security/)
- Code/asset protection: rely on platform store encryption, basic obfuscation, and not shipping secrets in the client.

**Avoid**

- Storing tokens in AsyncStorage or MMKV without encryption — trivial to extract on rooted/jailbroken devices.  
- Rolling your own OAuth flow in WebView rather than using expo-auth-session; you’ll get redirects, PKCE, and browser session handling wrong. [github](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/auth-session.md)
- Over‑investing in MASVS-RESILIENCE for a student calendar app unless there’s regulatory pressure; jailbreak detection and pinning can and should be feature flags. [medium](https://medium.com/appknox-hq/an-actionable-guide-to-owasp-masvs-v2-appknox-390efac5178a)

**Difficulty**

- Baseline auth & secure storage: **medium** (refresh edge cases).  
- Biometric unlock & root detection: **medium–hard** depending on QA surface.

***

## 7. Theming & native design fidelity

**Recommendation**

- Use Expo UI (`@expo/ui`) for “chrome” components that should look fully native: nav bars, sheets, lists, pickers, date/time controls, bottom tabs. [app.daily](https://app.daily.dev/posts/expo-ui-is-now-stable-swiftui-and-jetpack-compose-from-a-single-import-vyqnlufhb)
- Base styling on React Native’s StyleSheet plus small design tokens (spacing, radii, typography), not on a heavy cross‑platform UI kit. [necolas.github](https://necolas.github.io/react-native-web/docs/styling/)
- For Android, adopt Material 3 dynamic color from system wallpaper for your base palette where possible; on iOS, use glassmorphism‑style blur/tint that matches “Liquid Glass.” [source.android](https://source.android.com/docs/core/display/dynamic-color?hl=de)

**Why**

- Expo UI is stable as of SDK 56 and exposes genuine SwiftUI and Jetpack Compose components behind a single JS API, with Material 3 dynamic colors and native driven state hooks. [docs.expo](https://docs.expo.dev/versions/latest/sdk/ui/)
- Android 12+ provides system dynamic color APIs that Compose Material 3 uses (`dynamicDarkColorScheme` / `dynamicLightColorScheme`), which Expo UI can leverage under the hood. [developer.android](https://developer.android.com/develop/ui/compose/designsystems/material3)
- Apple’s latest design guidance adds Liquid Glass appearances for UIKit/SwiftUI buttons and bars; Expo UI can map to those rather than you faking glass in JS. [buymeacoffee](https://buymeacoffee.com/reactbd/apple-liquid-glass-ui-design-trends-2025-developer-implementation-guide?l=it)
- StyleSheet is still the recommended baseline for performance and RN‑for‑web compatibility; CSS‑in‑JS libraries add runtime overhead. [medium](https://medium.com/@fjmorant/styles-and-performance-in-react-native-unlocking-the-best-of-both-worlds-2263632a12bb)

**Styling stack**

- Theme module exporting:  
  - semantic colors (`primary`, `surface`, `accent`)  
  - spacing scale (4, 8, 12, 16…)  
  - typography scale (label, body, title)  
- Use `StyleSheet.create` for component styles; inline styles only for dynamic one‑offs. [newline](https://www.newline.co/30-days-of-react-native/day-04-styles)
- For advanced utility‑style authoring, if the team insists, use NativeWind v5, which explicitly supports RN’s new styling features, but keep it constrained to app UI, not system primitives. [dev](https://dev.to/aramoh3ni/taming-the-beast-a-foolproof-nativewind-react-native-setup-v52-2025-4dd8)

**Avoid**

- react-native-paper as your primary design system: MD3 support is good, but repository activity slowed and community questions point out compatibility issues with recent RN versions, and it will push you toward a Material look on iOS. [medium](https://medium.com/call-stack/react-native-paper-5-0-whats-new-6e0df8c075e9)
- Unistyles 3: impressive C++/Fabric styling engine, but the maintainer explicitly limits support to RN 0.84 / Expo SDK 55 and ends support Dec 31, 2025 – you are on 0.85 / SDK 56. [reactnativecrossroads](https://reactnativecrossroads.com/posts/introducing-unistyles-3/)
- Styled‑components in RN for large lists; runtime style processing is costly on New Architecture and hurts calendar performance. [youtube](https://www.youtube.com/watch?v=DCCWkTbNzhI)

**Difficulty**

- Achieving “native Chrome” with Expo UI: **easy–medium** (API still relatively fresh).  
- Perfectly mimicking iOS 26 Liquid Glass & Android dynamic color in custom calendar surfaces: **medium** (visual polish & perf tuning).

***

## 8. Calendar feature deep‑dive

**Recommendation**

- Use TimelineCalendar from `@howljs/calendar-kit` to bootstrap day/week views, then customize styling to match OS idioms. [blog.csdn](https://blog.csdn.net/gitblog_01050/article/details/142015967)
- Use FlashList v2 for agenda/event lists and any “infinite” lists. [shopify](https://shopify.engineering/flashlist-v2)
- Gesture stack: react-native-gesture-handler + Reanimated 4, plus RN 0.85’s shared animation backend. [docs.swmansion](https://docs.swmansion.com/react-native-reanimated/)
- Date/time: Temporal (via @js-temporal/polyfill) for domain logic + date-fns(-tz) for formatting and simple manipulations. [bryntum](https://bryntum.com/blog/javascript-temporal-is-it-finally-here/)
- Recurring events: rrule.js as the recurrence engine, storing canonical RRULE strings server‑side. [github](https://github.com/jkbrzt/rrule)

**Why**

- Calendar Kit is built exactly with the stack you want: FlashList, gesture-handler, Reanimated; supports pinch‑to‑zoom timelines, drag‑and‑drop event creation and editing out of the box. [reactscript](https://reactscript.com/timeline-calendar-kit/)
- FlashList v2 is a JS‑only new-architecture list with no size estimates required, designed for NA and extensively battle‑tested in Shopify’s apps. [shopify.github](https://shopify.github.io/flash-list/docs/usage/)
- Temporal is finally shipping in major desktop browsers in 2025‑2026, and the polyfill has been updated to match the spec; using it in RN via polyfill gives you robust timezone‑aware logic instead of ad‑hoc Date math. [npm-compare](https://npm-compare.com/@js-temporal/polyfill,date-fns,date-fns-tz,dayjs,luxon,moment)
- rrule.js is a mature implementation of iCalendar recurrence rules with good timezone semantics and a long history. [gist.github](https://gist.github.com/jamesdixon/17ef6b6a42b772ca7a27)

**Rendering strategies**

- Day/week view:  
  - Use TimelineCalendar’s week mode; map events to columns by resource/day.  
  - Use virtualization for vertical scrolling (time) and horizontal paging (days/weeks).  
- Agenda:  
  - FlashList of grouped events (`[{ date, events[] }]`), with sticky headers for dates.  
  - Use `estimatedItemSize` or rely on v2’s no‑estimate mode. [npmjs](https://www.npmjs.com/package/@shopify/flash-list)

**Gestures & animations**

- Use gesture-handler’s pan, long‑press, tap, and pinch recognizers for:  
  - Drag‑to‑create / drag‑to‑resize events  
  - Horizontal swipes between days/weeks  
  - Pinch‑to‑zoom timeline granularity  
- Use Reanimated 4 worklets for smooth, 120fps scroll & zoom effects and to debounce state updates off the JS thread. [github](https://github.com/software-mansion/react-native-reanimated)

**Date/time & timezone**

- Store all event instants in UTC on the server; use Temporal’s `ZonedDateTime` with IANA zones for client presentation. [github](https://github.com/js-temporal/temporal-polyfill/blob/main/CHANGELOG.md)
- Handle DST and cross‑timezone scheduling via Temporal, not custom offsets.  
- Use date-fns for formatting (`format`), plus date-fns-tz for timezone conversions where Temporal polyfill overhead is not justified in simple code paths. [npm-compare](https://npm-compare.com/@js-temporal/polyfill,date-fns,date-fns-tz,dayjs,luxon,moment)

**Avoid**

- Moment.js – project is legacy/maintenance mode and flagged widely as such. [community.jenkins](https://community.jenkins.io/t/moment-js-is-is-a-legacy-project-are-there-plans-to-update-it/1269)
- RN’s old ListView and components from pre‑NA libraries that depend on it. [github](https://github.com/facebook/react-native/issues/29877)
- Implementing your own recurrence engine; RRULE semantics are tricky.

**Difficulty**

- Basic calendar views: **medium** (integration + UX).  
- Highly performant dense schedules (hundreds of events/day): **still hard** – requires profiling FlashList and careful memoization.

***

## 9. Notifications

**Recommendation**

- Use expo-notifications for both local reminders and remote push (via Expo push service + FCM/APNs). [docs.expo](https://docs.expo.dev/guides/using-push-notifications-services/)
- Keep local scheduling simple: event start reminders + “time to leave” (if you have location heuristics later).  
- Gracefully degrade if push delivery is delayed or throttled, especially on Android OEMs.

**Why**

- `expo-notifications` is the officially supported library for Expo apps, documented for SDK 56 and tested with Expo’s push service and direct FCM/APNs sends. [docs.expo](https://docs.expo.dev/push-notifications/what-you-need-to-know/)
- Expo has already migrated to FCM v1 in response to Google’s deprecation of the legacy API, so you don’t have to maintain low‑level FCM code. [expo](https://expo.dev/blog/expo-push-notifications-migrating-to-fcm-v1)
- Docs clearly explain platform differences and constraints (e.g. background restrictions, OS‑level grouping). [docs.expo](https://docs.expo.dev/push-notifications/what-you-need-to-know/)

**Implementation notes**

- Use `getExpoPushTokenAsync` once user opts in to push; send token to backend. [docs.expo](https://docs.expo.dev/versions/latest/sdk/notifications/)
- For local reminders: schedule via `scheduleNotificationAsync` with `trigger` set to a timestamp relative to event start. [docs.expo](https://docs.expo.dev/versions/latest/sdk/notifications/)
- For background handling, use notification handlers to route taps into the correct calendar screen.

**What is still hard/unreliable**

- Guaranteed delivery time for push notifications is still not possible; OS and OEM throttling apply, especially on low‑end Android devices. [pkgpulse](https://www.pkgpulse.com/guides/notifee-vs-expo-notifications-vs-onesignal-react-native-2026)
- Complex local notifications (Android channels, grouping, full‑screen intents) may require a move to Notifee for specific flows in the future. [pkgpulse](https://www.pkgpulse.com/guides/notifee-vs-expo-notifications-vs-onesignal-react-native-2026)

**Avoid**

- Legacy Expo notifications API `import { Notifications } from 'expo';` – deprecated since SDK 38 and removed in later SDKs. [dev](https://dev.to/expo/expo-sdk-38-is-now-available-5aa0)
- Mixing multiple notification stacks (Expo + OneSignal + Notifee) unless you have a strong reason.

**Difficulty**

- Basic reminders & push: **medium** (cloud config and credentials).  
- Battle‑tested “can’t miss” alarm‑style behavior: **still hard** due to OS policies.

***

## 10. Developer experience & quality

**Recommendation**

- Linting/formatting: ESLint 9 + `@typescript-eslint` + Prettier; consider Biome as a long‑term consolidation, but not yet primary for RN. [github](https://github.com/biomejs/biome)
- Unit/component testing: Jest + @react-native/jest-preset + React Native Testing Library v14. [jsdelivr](https://www.jsdelivr.com/package/npm/@react-native/jest-preset)
- E2E: Maestro for cross‑platform flows. [github](https://github.com/mobile-dev-inc/maestro)
- Performance regression: Reassure integrated with RNTL tests; Flashlight for targeted Android performance profiling. [theodo](https://www.theodo.com/en-fr/blog/measuring-react-native-performance-with-flashlight)
- Accessibility & i18n: treat as first‑class; use RN a11y props and a central i18n solution.

**Why**

- ESLint 9+ and Prettier are still the de facto standard tooling with rich ecosystems (eslint-plugin-react, eslint-plugin-react-native, eslint-plugin-testing-library). [eslint](https://eslint.org/blog/2025/06/eslint-v9.29.0-released/)
- Biome’s formatter+lint combo is appealing, but RN‑specific rule coverage still lags behind ESLint plugins. [biomejs](https://biomejs.dev/linter/)
- RN 0.85 introduced a dedicated Jest preset package, and the ecosystem is aligning there. [microsoft.github](https://microsoft.github.io/rnx-kit/docs/tools/jest-preset)
- React Native Testing Library is actively evolving for React 19 and new renderers, with v14 targeting future renderers and dropping deprecated APIs. [github](https://github.com/callstack/react-native-testing-library/discussions/1698)
- Maestro is simpler to adopt than Detox, particularly in an Expo/EAS pipeline. [medium](https://medium.com/@3jacksonsmith/mastering-detox-for-react-native-step-by-step-guide-to-e2e-testing-webview-logins-with-robot-97f7a9898a17)
- Reassure is specifically built for RN performance regression testing, integrating with Testing Library. [dev](https://dev.to/callstackengineers/continuous-app-performance-monitoring-made-simple-with-reassure-2o67)

**Concrete choices**

- ESLint config:  
  - `extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'plugin:react-native/all']`  
  - Testing rules: `eslint-plugin-testing-library` for test files. [callstack.github](https://callstack.github.io/react-native-testing-library/docs/start/quick-start)
- Jest: 
  - `preset: '@react-native/jest-preset'` + `setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect']`. [reactnativetesting](https://reactnativetesting.io/component/setup/)
- E2E:
  - Maestro test flows for auth, first‑run, calendar CRUD, notification tap‑through. [github](https://github.com/mobile-dev-inc/maestro)

**Avoid**

- Pure Biome replacing ESLint/Prettier today in a RN project unless you’re ready to invest in missing rule coverage. [github](https://github.com/biomejs/biome)
- No tests: migrating from Flutter is already a big change; you want confidence.

**Difficulty**

- Basic setup: **easy**.  
- Continuous performance regression coverage: **medium** (needs discipline in test writing).

***

## 11. Build, release & delivery

**Recommendation**

- Use EAS Build for all binaries; never build manually except in emergencies. [docs.expo](https://docs.expo.dev/build/introduction/)
- Use EAS Submit for store uploads and EAS Update for OTA updates with Hermes bytecode diffing. [expo](https://expo.dev/changelog/sdk-54)
- Use EAS environment variables & secrets for config, avoid hard‑coded .env files in the repo. [docs.expo](https://docs.expo.dev/eas/environment-variables/)
- OTA strategy: use channels (`preview`, `production`) and rollout/rollback discipline.

**Why**

- EAS Build is now the standard Expo workflow and brings CI‑friendly iOS/Android builds without local Xcode/Android Studio maintenance. [docs.expo](https://docs.expo.dev/build/introduction/)
- Hermes bytecode diffing can shrink update payloads by ~75%, materially improving UX for students on slow connections. [expo](https://expo.dev/blog/ship-smaller-ota-updates-bundle-diffing-comes-to-ota-updates-in-sdk-55)
- Environment variables and secrets are directly integrated into EAS and Expo docs describe using them across Build and Updates. [stackoverflow](https://stackoverflow.com/questions/78945940/how-to-use-eas-secret-variables-when-in-eas-json-however-i-dont-want-to-confuse)

**Key points for migration from Flutter**

- Keep the same bundle identifier / package name and signing keys; then the stores treat it as an update, not a new app. [youtube](https://www.youtube.com/watch?v=pqX43hSEmuc)
- With EAS, configure your iOS and Android credentials to reuse the existing keys where possible.

**Avoid**

- Mixing EAS Update with manual store‑published binaries outside EAS; you’ll lose traceability.  
- Shipping secrets in app code or in non‑encrypted config files.

**Difficulty**

- Once EAS is set up: **easy**. The hard part is store policies, not the tooling.

***

## 12. Observability & product analytics

**Recommendation**

- Crash/error tracking: Sentry with Expo integration and EAS source map uploads. [docs.sentry](https://docs.sentry.io/platforms/react-native/manual-setup/expo/)
- Performance & RUM: use Sentry’s performance features + occasional Flashlight runs for Android. [docs.expo](https://docs.expo.dev/guides/using-sentry/)
- Product analytics: PostHog react-native client with MMKV or AsyncStorage for persistence. [posthog](https://posthog.com/docs/libraries/react-native)
- Feature flags/remote config: Statsig for more advanced experimentation; PostHog feature flags if you prefer one tool. [docs.statsig](https://docs.statsig.com/client/ReactNative)

**Why**

- Sentry has first‑party documentation for Expo‑managed projects and handles uploads/source maps with EAS. [posthog](https://posthog.com/docs/error-tracking/upload-source-maps/react-native)
- PostHog’s React Native library supports Expo projects and allows pluggable storage (AsyncStorage, MMKV). [posthog](https://posthog.com/docs/libraries/react-native)
- Statsig offers a dedicated RN client for feature gating and experiments. [docs.statsig](https://docs.statsig.com/client/ReactNative)

**Wiring without bloating startup**

- Lazy‑load analytics after the first screen paint.  
- Use sampling for performance traces.  
- Keep event schemas small and disciplined.

**Avoid**

- Multiple analytics SDKs doing the same thing (e.g., Amplitude + Mixpanel + PostHog); it hurts bundle size and startup.  
- Logging secrets or PII in Sentry events.

**Difficulty**

- Baseline Sentry + PostHog: **medium** (mostly configuration).  
- Rigorous experiment analytics & attribution: **still hard**.

***

## 13. Migration from Flutter

**Recommendation**

- Do a big‑bang rewrite of the client UI in React Native / Expo, **not** an incremental hybrid of Flutter + RN.  
- Reuse assets, design tokens, and mental models; do not attempt automated code conversion.  
- Preserve app identity (package/bundle IDs, signing keys) so stores deliver the new RN app as an update to existing Flutter users. [devmatrix.us](https://www.devmatrix.us.com/flutterflow/migrate/move-from-flutterflow-to-react-native)

**Why**

- Flutter and RN have entirely different rendering and widget/component models; there is no realistic automated translation beyond toy tools. [codeconverter](https://codeconverter.io/convert/flutter-to-react-native)
- Incremental migration (embedding Flutter into RN or vice versa) is complex and rarely worth it outside huge organizations. [daydreamsoft](https://www.daydreamsoft.com/blog/migrating-a-native-app-to-flutter-or-react-native-a-complete-guide-for-businesses)
- Guides on migrating from existing apps emphasize keeping identifiers and signatures consistent to preserve users and reviews. [youtube](https://www.youtube.com/watch?v=pqX43hSEmuc)

**Practical steps**

- Inventory Flutter features and screens; map to RN feature modules.  
- Extract design tokens (colors, spacing, typography) where they align with native OS guidelines; discard purely Material‑styled decisions on iOS.  
- Reuse API contracts; leave backend untouched.  
- Validate parity via Maestro E2E flows that mirror your existing regression tests.

**Avoid**

- Trying to maintain Flutter and RN clients in parallel long‑term for the same product; you’ll double your surface area.  
- “One‑off” Flutter modules embedded in RN; it complicates builds and debugging.

**Difficulty**

- Full UI rewrite: **hard**, but linear if you stay disciplined in feature mapping.

***

## 14. Risk register & DO‑NOT‑USE list

### What’s easy now vs. still hard (2026)

| Area | Status in 2026 | Notes |
| --- | --- | --- |
| New Architecture & Hermes | Easy | Expo SDK 55+ forces New Arch; Hermes default and well‑documented. [docs.expo](https://docs.expo.dev/guides/new-architecture/) |
| File‑based routing | Easy | Expo Router is first‑class and built into templates. [docs.expo](https://docs.expo.dev/router/installation/) |
| Secure storage & biometrics | Medium | expo-secure-store & expo-local-authentication make it straightforward; flows still need careful UX. [npmjs](https://www.npmjs.com/package/expo-secure-store) |
| Offline caching (TanStack Query) | Medium | Tooling is there; requires design work for cache windows & conflict resolution. [tanstack](https://tanstack.com/query/v4/docs/framework/react/examples/offline) |
| Native‑looking UI | Medium | Expo UI + system theming help, but you must be deliberate with custom calendar design. [expo](https://expo.dev/sdk/56) |
| Complex calendar gestures | Still hard | Libraries help, but dense schedules and gesture edge cases remain non‑trivial. [blog.csdn](https://blog.csdn.net/gitblog_01050/article/details/142015967) |
| Push delivery guarantees | Still hard | OS and OEM constraints still limit reliability on mobile. [docs.expo](https://docs.expo.dev/push-notifications/what-you-need-to-know/) |
| Performance regressions | Medium | Reassure/Flashlight exist, but you must maintain tests and baselines. [dev](https://dev.to/callstackengineers/continuous-app-performance-monitoring-made-simple-with-reassure-2o67) |

### DO‑NOT‑USE (2026) and safer replacements

| What to avoid | Why | Replacement |
| --- | --- | --- |
| Legacy Expo notifications (`import { Notifications } from 'expo'`) | Deprecated for years; new API is expo-notifications. [dev](https://dev.to/expo/expo-sdk-38-is-now-available-5aa0) | `expo-notifications` |
| React Native core AsyncStorage | Removed from RN core; use community / MMKV instead. [reactnative](https://reactnative.dev/docs/asyncstorage) | `@react-native-async-storage/async-storage` or `react-native-mmkv` [security.snyk](https://security.snyk.io/package/npm/react-native-mmkv) |
| ListView | Removed / deprecated; old dependencies that use it will break. [github](https://github.com/facebook/react-native/issues/29877) | FlatList / SectionList / FlashList [shopify](https://shopify.engineering/flashlist-v2) |
| Moment.js | Marked as legacy/maintenance mode. [community.jenkins](https://community.jenkins.io/t/moment-js-is-is-a-legacy-project-are-there-plans-to-update-it/1269) | Temporal polyfill + date-fns(-tz), Luxon [bryntum](https://bryntum.com/blog/javascript-temporal-is-it-finally-here/) |
| Unistyles 3 on SDK 56 | Author explicitly limits support to RN 0.84 / Expo 55 and ends support 2025‑12‑31. [reactnativecrossroads](https://reactnativecrossroads.com/posts/introducing-unistyles-3/) | StyleSheet + NativeWind or Tamagui [necolas.github](https://necolas.github.io/react-native-web/docs/styling/) |
| Heavy styled-components for lists | Adds runtime style cost; hurts NA performance. [medium](https://medium.com/@fjmorant/styles-and-performance-in-react-native-unlocking-the-best-of-both-worlds-2263632a12bb) | StyleSheet / NativeWind / Tamagui |
| Direct `@react-navigation/*` imports in SDK 56+ | Expo Router disallows and shims them only in node_modules; considered transitional. [docs.expo](https://docs.expo.dev/versions/latest/sdk/router/) | `expo-router/*` entrypoints |
| Old React Native architecture | Frozen as of June 2025; no new bugfixes. [docs.expo](https://docs.expo.dev/guides/new-architecture/) | New Architecture (Fabric/TurboModules) – default in RN 0.82+ & Expo SDK 55+ [docs.expo](https://docs.expo.dev/guides/new-architecture/) |

***

## 15. Additional mandatory topics

### TypeScript configuration

**Recommendation**

- Strict TS with incremental builds and path aliases for features.

**Key settings**

- `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.  
- `"moduleResolution": "bundler"` for RN 0.85/Metro. [bacancytechnology](https://www.bacancytechnology.com/blog/react-native-0-85)
- Paths like `@features/*`, `@lib/*`, etc., wired into metro.config.

**Difficulty**: **easy**.

***

### Networking & TLS

**Recommendation**

- Use a single HTTP client layer (axios or fetch wrapper) to centralize auth, logging, and optional certificate pinning.

**Why**

- Centralizing is essential if you later add react-native-cert-pinner or react-native-ssl-pinning, which hook into low‑level networking to pin certificates against known hosts. [github](https://github.com/approov/react-native-cert-pinner)

**Difficulty**: **medium** if pinning is required.

***

### Accessibility & internationalization

**Recommendation**

- Use RN’s a11y props (`accessibilityLabel`, `accessibilityRole`, etc.) by default on interactive elements and visually inspect with platform screen readers.  
- i18n: use one of the established RN i18n libraries (e.g. i18next) and avoid building your own.  
- Consider French and English as first languages given your context; keep all strings in translation files from day one.

**Why**

- RN has improved accessibility APIs and 0.85 adds more robust event handling; using them early prevents refactors later. [wix.github](https://wix.github.io/react-native-calendars/docs/Intro)

**Difficulty**: **medium** (needs process, not just code).

***

## Phased adoption roadmap

### Phase 1 – Foundations (Week 1–2)

- Scaffold Expo SDK 56 app with TS, Hermes, New Architecture (default). [docs.expo](https://docs.expo.dev/guides/new-architecture/)
- Wire Expo Router with basic `(auth)` and `(app)` layouts & placeholder screens. [docs.expo](https://docs.expo.dev/router/installation/)
- Set up TS strict config, ESLint + Prettier, Jest + RNTL baseline tests. [eslint](https://eslint.org/blog/2025/10/eslint-v9.39.0-released/)
- Configure EAS Build & environments, connect to existing app identifiers and signing (matching Flutter app). [daydreamsoft](https://www.daydreamsoft.com/blog/migrating-a-native-app-to-flutter-or-react-native-a-complete-guide-for-businesses)

### Phase 2 – Core features (Week 3–6)

- Integrate TanStack Query v5 and Orval‑generated API client against existing REST OpenAPI. [github](https://github.com/orval-labs/orval)
- Implement auth flow (sign‑in, token storage, refresh) with expo-secure-store. [secure](https://secure.software/npm/packages/expo-secure-store)
- Bring in TimelineCalendar (day/week), agenda view with FlashList v2, gestures & animations via gesture-handler + Reanimated. [github](https://github.com/software-mansion/react-native-gesture-handler/releases)
- Add Temporal polyfill + rrule for recurrence and timezone logic. [kener](https://kener.ing/docs/v4/maintenances/rrule-patterns)

### Phase 3 – DX, observability, and polish (Week 7–9)

- Add Sentry and PostHog; wire minimal key events. [docs.sentry](https://docs.sentry.io/platforms/react-native/manual-setup/expo/)
- Introduce Maestro for core E2E flows and Reassure tests for calendar performance. [medium](https://medium.com/@lindDev/compare-react-native-apps-performance-using-reassure-part-1-init-baseline-0eb351f73f12)
- Implement Expo UI primitives for auth & settings screens; refine theming with system light/dark and dynamic color mapping. [expo](https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui)
- Add biometric unlock and optional jailbreak/root detection if required. [dev](https://dev.to/rushikeshpandit/detecting-rooted-jailbroken-devices-in-react-native-how-i-built-it-and-what-i-learned-1jaa)

### Phase 4 – Release & long‑term hardening (Week 10+)

- Finalize notification flows, both local reminders and push; validate FCM v1/APNs credentials. [docs.expo](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- Tune OTA strategy (channels, rollout/rollback) and document release process. [youtube](https://www.youtube.com/watch?v=q72aeXsbF9c&vl=en)
- Tighten MASVS‑aligned checks as needed (secure storage review, TLS configuration, jailbreak detection, optional pinning). [approov](https://approov.io/blog/a-practical-guide-to-owasp-masvs-v2)
- Plan incremental improvements: experiment framework (Statsig/PostHog), additional calendar views, and further performance optimization using Flashlight. [theodo](https://www.theodo.com/en-fr/blog/measuring-react-native-performance-with-flashlight)

***

If you want, next step I can sketch concrete folder trees, example route files, and sample code for: Orval config, TanStack Query setup, token refresh interceptor, and a day view timeline wired to Temporal + rrule.
