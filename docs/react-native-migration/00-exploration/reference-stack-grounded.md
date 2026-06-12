# TimeCalendar → React Native: grounded reference stack

> Companion to `perplexity-research.md`. That report is a solid *generic* 2026 RN blueprint, but it was written blind to our codebase and made several recommendations that don't fit us. This document is the **corrected, project-specific** version: same breadth, grounded in what TimeCalendar actually is and the decisions we've made.
>
> Status: exploration / reference. **Not** a migration plan yet. Dates and versions reflect mid‑2026; pin exact versions against npm at project start (see §Versioning caveat).

---

## 0. What makes TimeCalendar different (the facts that drive every decision)

These were verified against the current Flutter app, the NestJS server, and the existing web app — not assumed.

| Fact | Evidence | Consequence |
| --- | --- | --- |
| **No authentication.** `dioProvider` sets only a `baseUrl` — no tokens, no interceptors, no `Authorization` header. | `app/lib/modules/dio/providers/dio_provider.dart` | The Perplexity "Auth & security" section (access/refresh tokens, secure-store, 401 refresh gates, biometric unlock, OAuth/PKCE) is **almost entirely N/A**. |
| **A "user" = a set of calendar subscription tokens.** Sync calls `syncCalendars(tokens: [...])`. | `calendar_sync_service.dart`, `user_calendar_repository.dart` | "Identity" is just durable local storage of calendar tokens. No login UI, no Firebase Auth (it's in `pubspec` but unused). |
| **Local-first, offline by design.** App renders from a local store; the network sync is fetch → `putEventsToDatabase` (drop+replace) → render from DB. | `calendar_event_repository.dart` (sembast `calendar_events` store), `calendar_sync_service.dart` | Offline is **structural**, not a nice-to-have. The local store is the source of truth for rendering. |
| **Personal events, hidden events, checklists are device-only.** No corresponding server module exists. | `personal_event/`, `hidden_event/`, `event_details/` repos all use sembast; server modules list has none of these | We need real **durable local storage for user-owned data**, independent of any server cache. |
| **Recurrence is expanded server-side.** `node-ical` parses ICS and expands RRULE; the client receives concrete event instances. | `server/src/modules/fetch/parsers/parse-ical.ts` + recurring `.ics` test fixtures | **No `rrule.js`, no Temporal polyfill on the client.** Display-only date/time. |
| **Monorepo + shared API client already exist.** Root `package.json` has `workspaces: ["web", "openapi/javascript"]`; web consumes `@timecalendar/api-client` with `@tanstack/react-query`. | root `package.json`, `web/package.json` | RN slots into the existing workspace. The OpenAPI codegen pipeline is already built. |
| **French university timetable app**, brand-led (Poppins, custom palette, color picker). | `pubspec.yaml`, `assets/fonts/Poppins-*`, `flutter_colorpicker` | i18n target is **French (+ English)**, not "Japanese/English" as the report hallucinated. |
| **~24 feature modules**, including an AI assistant webview and QR scanning. | `app/lib/modules/*` | Migration surface is large; the 10-week roadmap in the report is optimistic. |

### Decisions locked (from review)

1. **Keep Firebase** (Analytics, Crashlytics, FCM messaging). Server `firebase-admin` stays untouched. → use `@react-native-firebase/*`.
2. **No auth work** — we don't use Firebase Auth; identity is calendar tokens.
3. **Native chrome, keep brand.** Lean into platform-native navigation/controls (iOS Liquid Glass, Android Material), keep TimeCalendar accent identity + a custom calendar surface. **All in RN/TypeScript — no Swift/Kotlin.**
4. **Local-first, device-only.** Preserve full offline; personal/hidden/checklist data stays on-device. No new server work.
5. **Web stays separate.** RN owns its own generated API client; we do *not* couple RN hooks to web. (We can still reuse the OpenAPI spec.)
6. **Calendar timeline: likely custom.** The maintained-library landscape is thin (below); plan to build, salvaging primitives.
7. **Drop `rrule` + Temporal** on the client.

---

## 1. Reference stack (one-page summary)

| Area | Choice for TimeCalendar | Why it differs from the generic report |
| --- | --- | --- |
| Runtime / SDK | Latest **stable** Expo SDK at project start (SDK 55 stable mid‑2026; **SDK 56** in beta stabilizes Expo UI / Liquid Glass). New Arch, Hermes. | Report claimed "SDK 56 / RN 0.85 stable" — that's forward-dated. SDK 54 = RN 0.81; 56 is beta. Pin reality at start. |
| Navigation | **Expo Router** + **native tabs** (`expo-router` native tabs, alpha) for system Liquid Glass tab bars + SF Symbols. | Native tabs is the concrete mechanism for the "native chrome" decision. |
| Server state | **TanStack Query v5** | Same as web — shared mental model. |
| API client | **Orval** → generated TanStack Query hooks from our OpenAPI spec, RN-owned. | Report agreed on Orval; we confirm RN generates its **own** client (web stays separate). |
| Client/UI state | **Zustand** | Replaces simpler Riverpod notifiers. |
| Device-local structured data | **expo-sqlite + Drizzle ORM** (personal events, hidden events, checklists) | Report under-weighted this. sembast → SQLite tables. MMKV alone can't do it. |
| Key-value / prefs / tokens | **react-native-mmkv** (settings, hidden-event IDs, calendar tokens) | KV only; not a sembast replacement. |
| Server-event offline cache | TanStack Query + **per-query MMKV persister** (or treat sync as writes into SQLite) | Offline reads of synced events. |
| Identity / auth | **None.** Persist calendar tokens locally. | Entire auth section dropped. |
| Calendar (day/week timeline) | **Custom** (Reanimated 4 + gesture-handler + FlashList v2). Spike `@howljs/calendar-kit` v2 read-only first. | Both report-recommended libs are stagnant/edit-oriented; we view + add simple events. |
| Agenda / lists | **FlashList v2** | Matches today's `scrollable_positioned_list` + sticky headers. |
| Animations / gestures | **Reanimated 4** + **react-native-gesture-handler** | Same as report. |
| Date/time | **date-fns + date-fns-tz** (display only) | **No rrule, no Temporal** — recurrence is server-side. Matches server's `date-fns`. |
| QR scanning | **expo-camera** (barcode/QR) | Replaces `mobile_scanner` (add-calendar-by-QR). |
| AI assistant | **react-native-webview** | Replaces Flutter `webview_flutter`; mind the known local-dev cert/network gotcha. |
| Native look & feel | **@expo/ui** (SwiftUI/Compose), **expo-glass-effect** / `@callstack/liquid-glass`, **expo-symbols** | This is now a *goal*, not something to avoid (report's §7 reversed). |
| Theming | StyleSheet + design tokens; **NativeWind optional** for app surfaces (not system primitives) | Keep brand accent; native chrome via Expo UI. |
| Crash/analytics/push | **`@react-native-firebase/*`** (crashlytics, analytics, messaging) via Expo config plugins + `expo-dev-client` | Report said rip out Firebase for Sentry/PostHog/Expo Push — **rejected**. |
| Notifications | **`@react-native-firebase/messaging`** (FCM) + local notifications | Server `firebase-admin` unchanged. Not Expo Push. |
| i18n | i18next (or similar), **French + English** | Not Japanese. |
| Builds / OTA | **EAS Build / Submit / Update** (dev client required for native Firebase) | Same as report. |
| Testing | Jest + RNTL; **Maestro** E2E | Same. |

---

## 2. Foundations & currency

- Target the **latest stable Expo SDK** at kickoff (SDK 55 stable mid‑2026; adopt **SDK 56** as soon as it ships stable — it GA's Expo UI and the SwiftUI/Compose primitives we want). New Architecture + Hermes (non-optional on SDK 55+).
- TypeScript strict (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `moduleResolution: "bundler"`).
- **We will need `expo-dev-client`** (not Expo Go for release flows) because `@react-native-firebase/*` requires custom native code. Expo UI itself runs in Expo Go, but Firebase does not.

**Versioning caveat:** the Perplexity report's exact versions/dates (RN 0.85, zustand 5.0.12, MMKV 4.3.1, "Unistyles support ends 2025‑12‑31") are speculative/forward-dated. Treat all pinned versions there as **unverified**; resolve against npm/registries when we scaffold.

---

## 3. Project architecture & the monorepo

We already have an npm workspace (`web`, `openapi/javascript`). The RN app joins it.

```
/ (root workspace)
├── web/                      # Next.js (unchanged, stays separate)
├── openapi/
│   ├── javascript/           # @timecalendar/api-client (used by web)
│   └── ...
├── app/                      # current Flutter app (retired post-migration)
├── mobile/                   # NEW: Expo app
│   ├── app/                  # Expo Router routes (native tabs)
│   ├── features/             # calendar, personal-event, assistant, schools, settings…
│   ├── lib/                  # query client, db (drizzle), mmkv, theming, firebase
│   └── orval.config.ts       # RN-owned client gen from the OpenAPI spec
└── server/                   # NestJS (unchanged)
```

- **Feature-first** folders mirror today's `modules/*` (low conceptual migration cost).
- **RN owns its API layer**: Orval reads the same OpenAPI spec the server emits, generates TanStack Query hooks into `mobile`. We deliberately do **not** import web's `@timecalendar/api-client` or web's hooks (decision: keep separate). The only shared artifact is the spec.
- Keep "clean architecture" light: domain logic as plain TS, hooks as the boundary. No 5-layer DDD.

---

## 4. Navigation — native chrome

- **Expo Router** file-based + **native tabs** (`expo-router` native tabs). On iOS 26 the tab bar renders with **Liquid Glass for free**; **SF Symbols** via the `sf` prop on iOS, Material icons on Android. This is the backbone of the "native chrome, keep brand" decision.
- Route groups map to today's structure: `(onboarding)`, `(tabs)/calendar`, `(tabs)/settings`, plus stacks for `event-details`, `personal-event`, `school` add flows, `assistant`.
- **Caveat:** native tabs is **alpha/unstable** (SDK 54+) and Liquid Glass requires **Xcode 26 / iOS 26**; must degrade gracefully on older iOS and on Android. Budget for API churn.

---

## 5. State management

- **Server state → TanStack Query v5** (events sync, schools, subjects, calendar logs). Same as web.
- **UI/client state → Zustand** (selected day/week, current view, open sheets). Replaces simple Riverpod notifiers.
- **Persistence is two-tier** (see §6) — don't conflate server cache with device-owned data.

---

## 6. Storage & offline (the section the report got thin on)

We have **two distinct data classes**. Treat them differently.

### 6a. Server-derived data (calendars/events from `syncCalendars`)
- Fetched via TanStack Query.
- Offline reads via a **per-query MMKV persister** (avoid persisting the whole client blob — it's CPU/battery heavy). Tune `staleTime` short for schedules.
- Sync semantics today are "drop + replace"; that maps cleanly to query invalidation + refetch.

### 6b. Device-only user data (personal events, hidden events, checklist items, calendar tokens, settings)
- This is **not** HTTP cache — it's user-owned, must survive offline and reinstalls-of-cache, and is queried structurally (e.g. personal events by date range). TanStack Query persistence alone is the wrong tool here.
- **Recommendation: `expo-sqlite` + Drizzle ORM** — typed tables that mirror today's sembast stores (`personal_events`, `hidden_events`, `checklist_items`). This is the idiomatic 2026 Expo offline-first path.
- **`react-native-mmkv`** for trivially-small KV: settings/prefs (replacing `pref` + `shared_preferences`), the set of hidden-event IDs, and **calendar subscription tokens**. (Tokens are low-sensitivity; MMKV is fine. Use `expo-secure-store` only if we later decide tokens are sensitive.)

> **Answering "do we even need this if we use TanStack Query?"** — Yes, for 6b. TanStack Query is a *server-cache*; it has no answer for user-created, server-less data like personal events and checklists. Those need a real local store. For 6a, TanStack Query + a persister is enough. So: **TanStack Query (+persister) for server data, SQLite/Drizzle + MMKV for device-owned data.**
>
> Emerging alternative to watch: **TanStack DB** (0.6+) offers SQLite-backed local-first state across RN/Expo and could eventually unify 6a+6b — but it's young; not a day-one bet.

---

## 7. Theming & native design fidelity (decision: native chrome, keep brand)

This **reverses** the report's "go easy on Expo UI" stance — native fidelity is now a goal.

- **Chrome via `@expo/ui`** (SwiftUI on iOS, Jetpack Compose on Android, stable in SDK 56): sheets, controls, pickers, lists where it buys real native feel. All authored in **RN/TypeScript**.
- **iOS Liquid Glass (iOS 26+):** `expo-glass-effect` (`GlassView`, UIKit `UIVisualEffectView`-backed) for glass surfaces; `@expo/ui` SwiftUI `glassEffect` modifiers for advanced cases; native tabs get glass for free. `@callstack/liquid-glass` is a third-party fallback. **Requires Xcode 26 / iOS 26 — must fall back cleanly below that.**
- **Android:** Material 3 / Material You dynamic color via Compose under `@expo/ui`.
- **Keep brand:** TimeCalendar accent color and identity stay; typography follows platform for chrome but brand surfaces (calendar, onboarding) keep our look. Design tokens in a theme module; `StyleSheet.create` baseline; **NativeWind optional** for app surfaces only, never for system primitives.
- **Maturity risk:** Expo UI, native tabs, and glass APIs are young/fast-moving. Expect churn; isolate them behind our own wrappers so swaps are cheap.

---

## 8. Calendar feature deep-dive (likely custom)

**Landscape (mid‑2026):**
- `@howljs/calendar-kit` v2 (FlashList/Reanimated/gesture-handler based, New-Arch-ready) is the closest fit, but velocity has slowed (latest ~v2.5.x, last commit months ago) and it's **edit-oriented** (drag-create/resize/recurring) — features we don't need.
- `wix/react-native-calendars` and the `quidone` fork are **month/agenda** calendars, not dense day/week **timelines** with overlapping columns.
- `react-native-week-view` exists but is lightly maintained.

**Recommendation:** time-box a **read-only spike on `@howljs/calendar-kit` v2** (can it render our dense university timetable with overlaps, our styling, our brand, at 120fps?). If it fits, great; if not — the likely outcome given prior research — **build custom**, exactly as we did in Flutter, on:
- **FlashList v2** for vertical time + horizontal day/week paging,
- **gesture-handler** for swipe-between-days and tap,
- **Reanimated 4** worklets for smooth scroll/zoom off the JS thread.

Either way, **salvage primitives** (time-grid math, overlap layout, current-time indicator) into our own components so we're not locked to a stagnating dependency.

**Date/time:** `date-fns` + `date-fns-tz` for display/formatting only. Server sends concrete instances in a known tz; **no client recurrence engine**.

---

## 9. Notifications (stay on Firebase)

- **`@react-native-firebase/messaging`** for FCM push; server keeps `firebase-admin` and the existing `notification-subscription` flow **unchanged**.
- Local reminders via `expo-notifications` *only if* we want purely-local scheduling without a server round-trip; otherwise FCM covers it. (Don't double-stack — pick per use case.)
- **Reject** the report's "switch to Expo Push service" — it's an unnecessary indirection given our FCM + firebase-admin investment.
- Same hard truths apply: OEM/Android throttling means no guaranteed delivery time.

---

## 10. Observability & analytics (stay on Firebase, optional additions)

- **Crashlytics + Analytics via `@react-native-firebase/*`** — keep what we have; server-side dashboards unchanged.
- **Sentry is optional, additive** (better JS stack traces / source maps than Crashlytics for the RN/JS layer) — consider, don't *replace* Crashlytics for it.
- **PostHog/Statsig**: only if/when we actually want product analytics or experiments. Not required by the migration. The report treated these as mandatory; for us they're discretionary.
- Note: with `expo-dev-client`, native crashes aren't reported to Crashlytics in dev — test crash reporting in release/standalone builds.

---

## 11. Developer experience & quality

- ESLint 9 + Prettier (align with server/web configs), TS strict.
- Jest + React Native Testing Library for unit/component.
- **Maestro** for E2E — mirror today's Flutter `integration_test` flows: onboarding (add school/calendar by QR + iCal import), calendar render/scroll, personal-event CRUD, hide-event, notification tap-through, assistant open.
- Reassure/Flashlight for calendar perf regression (the dense-timetable scroll is our highest perf risk).

---

## 12. Build, release & migration

- **EAS Build/Submit/Update**, `expo-dev-client` (required by native Firebase).
- **Preserve app identity**: reuse existing **bundle ID / package name / signing keys** so stores treat the RN app as an update to the Flutter app (keeps users, reviews, push tokens).
- Reuse `google-services.json` / `GoogleService-Info.plist` from the Flutter app for Firebase.
- **Big-bang client rewrite** (agree with report) — no Flutter+RN hybrid. But sequence by module and parity-test each against Flutter behavior; the ~24-module surface means the report's 10-week timeline is optimistic for a small team.

---

## 13. Feature inventory → RN mapping (concrete migration surface)

| Flutter module | Nature | RN target / note |
| --- | --- | --- |
| `calendar` | timeline render + sync | **Custom timeline** (§8); TanStack Query sync; SQLite/MMKV cache |
| `personal_event` | device-local CRUD | Drizzle/SQLite table; Zustand for edit state |
| `hidden_event` | device-local set | MMKV (set of IDs) or Drizzle |
| `event_details` (checklists) | device-local | Drizzle table |
| `assistant` | webview + AI (server `@ai-sdk`) | `react-native-webview`; **mind known local-dev cert/network issue** |
| `qr_code` | QR scan (`mobile_scanner`) | `expo-camera` barcode scanning |
| `import_ical` | URL/file import | file/url picker + API |
| `school` / `add_school` / `add_grade` | onboarding + grades | Expo Router stacks; TanStack Query |
| `settings` | prefs (`pref`/`shared_preferences`) | MMKV-backed settings store |
| `profile` / `about` / `changelog` / `suggestion` / `activity` | static/light | standard screens |
| `firebase` | analytics/crashlytics/messaging | `@react-native-firebase/*` |
| `database` (sembast) | local store | `expo-sqlite` + Drizzle (+ migrations) |
| `dio` | http | Orval-generated client + fetch/axios |
| `splash` / `onboarding` | bootstrap | Expo Router entry + native splash |

---

## 14. Risk register & DO-NOT-USE (corrected for us)

**Still hard:**
- Dense day/week timeline at 120fps with overlapping events — our #1 perf/UX risk (custom build).
- Young native-UI APIs (Expo UI, native tabs, glass) — churn; iOS 26 / Xcode 26 floor for glass.
- Push delivery guarantees — OS/OEM limits (unchanged from Flutter).

**Do NOT carry over from the generic report:**
- ❌ Access/refresh tokens, `expo-secure-store` for auth, 401 refresh gates, OAuth/PKCE, biometric unlock — **we have no auth**.
- ❌ `rrule.js` + Temporal polyfill on the client — **recurrence is server-side**.
- ❌ Ripping out Firebase for Sentry + PostHog + Expo Push — **keep Firebase**.
- ❌ `@howljs/calendar-kit` as a load-bearing dependency for editing — we don't edit; and it's slowing.
- ❌ MMKV as the *only* persistence — it can't hold structured device-owned data.
- ❌ Japanese/English i18n target — we're **French + English**.

**Do use (agreements with the report):** Expo + EAS, New Arch + Hermes, Expo Router, TanStack Query v5, Zustand, Orval, FlashList v2, Reanimated 4 + gesture-handler, date-fns(-tz), Maestro, preserve bundle IDs/signing.

---

## 15. Open questions (to resolve before a plan)

1. **Calendar spike outcome** — does `calendar-kit` v2 render our timetable acceptably, or is custom confirmed? (Time-box ~2–3 days.)
2. **SDK target** — start on SDK 55 stable now, or wait for SDK 56 stable to get Expo UI / Liquid Glass GA? (Affects native-fidelity timeline.)
3. **iOS floor** — minimum iOS version? Liquid Glass needs iOS 26; what's the graceful-degradation baseline?
4. **Assistant** — keep it a webview long-term, or is a native RN chat surface in scope later?
5. **Drizzle vs MMKV-JSON for device data** — given how *small* the per-user data is, is full SQLite/Drizzle worth it, or is MMKV-with-JSON enough for personal/hidden/checklist? (Lean Drizzle for personal events + checklists; MMKV for the rest.)

---

## Sources

- [Expo SDK 56 Beta changelog](https://expo.dev/changelog/sdk-56-beta) · [SDK 54](https://expo.dev/changelog/sdk-54) · [SDK 55](https://expo.dev/changelog/sdk-55) · [New Architecture](https://docs.expo.dev/guides/new-architecture/)
- [Building SwiftUI apps with Expo UI](https://docs.expo.dev/guides/expo-ui-swift-ui/) · [GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/) · [Liquid Glass app with Expo UI + SwiftUI](https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui) · [Liquid Glass in React Native (Callstack)](https://www.callstack.com/blog/how-to-use-liquid-glass-in-react-native)
- [Expo Router native tabs](https://docs.expo.dev/router/advanced/native-tabs/) · [Expo Router v6](https://expo.dev/blog/expo-router-v6)
- [React Native Firebase](https://rnfirebase.io/) · [Using Firebase with Expo](https://docs.expo.dev/guides/using-firebase/) · [Crashlytics + dev client discussion](https://github.com/expo/expo/discussions/24246)
- [@howljs/react-native-calendar-kit](https://github.com/howljs/react-native-calendar-kit) · [wix/react-native-calendars](https://github.com/wix/react-native-calendars) · [Top RN calendar components 2026](https://reactscript.com/top-10-calendar-components-react-react-native/)
- [Offline-first Expo with Drizzle + SQLite](https://www.detl.ca/blog/building-an-offline-first-production-ready-expo-app-with-drizzle-orm-and-sqlite) · [Drizzle + RN Expo SQLite (LogRocket)](https://blog.logrocket.com/drizzle-react-native-expo-sqlite/) · [TanStack DB 0.6 persistence](https://tanstack.com/blog/tanstack-db-0.6-app-ready-with-persistence-and-includes) · [persistQueryClient](https://tanstack.com/query/v4/docs/react/plugins/persistQueryClient)
- [Orval React Query guide](https://orval.dev/docs/guides/react-query/) · [Typesafe API codegen 2026](https://www.saschb2b.com/blog/typesafe-api-codegen-2026) · [Orval vs openapi-typescript vs Kubb](https://www.pkgpulse.com/guides/orval-vs-openapi-typescript-vs-kubb-openapi-client-2026)
</content>
</invoke>
