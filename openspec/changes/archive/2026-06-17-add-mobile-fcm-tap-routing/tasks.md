# Tasks — add-mobile-fcm-tap-routing (Phase 06 Ship C)

> Verify locally with **`npm test -- --coverage`** (from `mobile/`), NOT plain `npm test`.
> Plain `npm test` does not collect coverage and therefore enforces **no** thresholds — it
> passes blind. CI runs `npm test -- --coverage` and enforces 90% per-file branches on
> `src/features/*/!(ui)/**` and `src/firebase/**` (`mobile/jest.config.js`). The defensive
> parse branches in `tap-routing.ts` are the usual coverage miss — test them all.

## 1. The `@/firebase` tap entrypoints
- [x] 1.1 In `mobile/src/firebase/index.ts`, add `onNotificationOpenedApp(handler): () => void` and `getInitialNotification(): Promise<RemoteMessage | null>`, each resolving `getMessaging()` lazily inside the body (mirror `onForegroundMessage` / `getFcmToken`). Import the RNFB v24 modular `onNotificationOpenedApp` / `getInitialNotification` (confirm exact export names against the installed `@react-native-firebase/messaging` types). The import must stay native-safe.
- [x] 1.2 Extend `mobile/jest/setup-firebase.ts` to mock both new functions (mirror the existing messaging mocks).

## 2. The pure payload→route parser
- [x] 2.1 Add `mobile/src/features/notifications/data/tap-routing.ts` exporting `parseNotificationRoute(message)` returning `{ kind: "event"; uid } | { kind: "calendar" } | null` per design Decision 1. Use the server enum string values `NEW` / `EDIT` / `CANCEL`. Defensive: missing data/action → null; non-`calendar_changed` action → null; `JSON.parse` of `payload` in try/catch → on throw `recordError(err, "notifications/tap-routing")` + null; missing/blank `event.uid` → null; `CANCEL` → calendar; `NEW`/`EDIT` (and any other type carrying a uid) → event. No React / Expo / native imports.
- [x] 2.2 Define a minimal local type for the decoded payload (`{ type: string; event: { uid?: string; ... } }`) — do NOT import server types. The wire `event` dates are ISO strings; the parser only needs `uid`.

## 3. The dispatcher hook
- [x] 3.1 In the same `data/tap-routing.ts` (or a sibling `data/use-tap-routing.ts` — keep the pure parser and the hook in one cohesive module), add `useNotificationTapRouting(): void` per design Decision 2: `const { sync } = useSyncCalendars()` (from `@/features/calendar/data`), `const router = useRouter()` (expo-router). Foreground (`onForegroundMessage`) → on `calendar_changed` `void sync()`, no navigation. Background (`onNotificationOpenedApp`) → `void sync()` then navigate per `parseNotificationRoute`. Cold-start (`getInitialNotification()`) in a ref-guarded mount effect → if non-null, `void sync()` then navigate. `navigate`: event → `router.push('/event-details/' + uid)`, calendar → `router.push('/calendar')`, null → no-op. Return listener unsubscribes from their effects (cleanup).
- [x] 3.2 Respect B-1..B-4: this hook reaches the calendar feature via its `@/features/calendar/data` barrel (a legitimate cross-feature data read), the router via expo-router, and `@/firebase` via the seam — no generated client, no `@/db`, no `@/storage` here.

## 4. Wire into the root layout
- [x] 4.1 In `mobile/src/app/_layout.tsx`, mount `useNotificationTapRouting()` (a small `NotificationTapRouting` component beside the existing `NotificationRegistration`, OR call it inside the existing one — keep it inside the rendered `RootLayout` tree so effects fire after the `<Stack>` mounts, per design Decision 3). Export `useNotificationTapRouting` from `@/features/notifications` (`data/index.ts` + `index.ts`).

## 5. Tests (mock-at-mutator; verify with `npm test -- --coverage`)
- [x] 5.1 `data/tap-routing.test.tsx` — cover the parser branches to 100%: NEW→event, EDIT→event, CANCEL→calendar, missing data→null, non-`calendar_changed` action→null, malformed JSON→recordError+null, missing uid→null.
- [x] 5.2 Dispatcher tests (mock `@/firebase` tap entrypoints, mock `useSyncCalendars`, mock the expo-router `router`): foreground `calendar_changed`→sync called + router NOT called; background NEW tap→sync + `router.push('/event-details/<uid>')`; CANCEL background tap→`router.push('/calendar')`; cold-start `getInitialNotification` returns a message→sync + navigate; `getInitialNotification` returns null→no sync, no nav; listener cleanup wired. Mind the harness quirks (RNTL 14 async render/renderHook; effect-cleanup-on-unmount caveat; act-swallows-rejection — see Ship B notes).
- [x] 5.3 Confirm `npm test -- --coverage` exits 0 with NO `coverage threshold` errors and `tap-routing.ts` at ≥90% branches; `src/firebase/**` still ≥90%.

## 6. Architecture Book
- [x] 6.1 Add `docs/mobile/architecture-book/decisions/028-fcm-tap-routing.md` (mirror ADR 026/027 rigor: Status / Context / Decision / Consequences / Revisit-if): the payload→route contract, NEW/EDIT→event-details vs CANCEL→calendar, foreground-refetch-only, the R-2 only-`calendar_changed` guard, the navigation-after-mount resolution, the uid-match assumption + graceful not-found degradation.
- [x] 6.2 Add the ADR 028 index row to `docs/mobile/architecture-book/decisions/README.md`.
- [x] 6.3 Update `docs/mobile/architecture-book/firebase.md` Cloud Messaging section: the two new tap entrypoints + the tap-routing dispatcher (foreground refetch / background+cold-start refetch-then-navigate).
- [x] 6.4 Update `docs/mobile/architecture-book/features.md` Notifications section: tap-through routing.
- [x] 6.5 Append a dated entry to `docs/mobile/architecture-book/architecture-changelog.md`.

## 7. Device-verification handoff
- [x] 7.1 Extend `docs/react-native-migration/inbox/2026-06-17-fcm-push-receive-device-verification.md` (or add a cross-referenced tap-routing note) with the tap-routing device script: tap a `calendar_changed` notification from foreground / background / **killed**, on **both** platforms, in a **release** build; verify the calendar refreshes and the correct event-details (NEW/EDIT) or calendar (CANCEL) screen opens; note the cold-start navigation-readiness fallback (`rootNavigationState`) to try if a cold-start tap lands on the wrong screen.

## 8. Green + validate
- [x] 8.1 `npx tsc --noEmit` clean; `npm run lint` clean (`--max-warnings 0`); `npm test -- --coverage` exits 0.
- [x] 8.2 `openspec validate add-mobile-fcm-tap-routing --strict` passes.
