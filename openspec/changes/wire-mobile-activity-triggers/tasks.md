> Every path below is relative to the repository root. All commands run from `mobile/`.
> Read `docs/react-native-migration/05-tech-specs/activity-revival.md` (architecture decisions **6 and 7**, the trigger table, and **Mobile state behavior**), this change's `design.md` **D1–D9**, and `docs/mobile/architecture-book/calendar.md` + `firebase.md` + `decisions/028-fcm-tap-routing.md` before starting.
> The three symbols this change consumes — `refreshNewestPage`, `pruneToHeldCalendars`, `ActivityRefreshOutcome` — are **fixed inputs from [PR #324](https://github.com/timecalendar/timecalendar/pull/324)**, not things to design. Read `mobile/src/features/activity/data/coordinator.ts` and `types.ts` on that branch first.

## 0. Preconditions (do these before writing code)

- [ ] 0.1 Confirm PR #324 (TIM-397) is **merged into `main`**, then rebase this branch onto `main`. Nothing below compiles before that. Verification: `git log --oneline origin/main | grep -i "activity refresh coordinator"` finds the merge, and `mobile/src/features/activity/data/coordinator.ts` exists on `origin/main`.
- [ ] 0.2 Expect rebase conflicts in exactly three shared files — `docs/mobile/architecture-book/decisions/README.md`, `docs/mobile/architecture-book/CHANGELOG.md`, `docs/mobile/architecture-book/features.md` — because #324 edits all three. Resolve by keeping both entries, never by dropping #324's.
- [ ] 0.3 Re-read `mobile/src/features/activity/index.ts` after the rebase and confirm the barrel exports `refreshNewestPage` and `pruneToHeldCalendars`. If it does not, stop and raise it on [TIM-399](/TIM/issues/TIM-399) — do not import from `data/` to work around it (D2).

## 1. The Activity lifecycle module (`mobile/src/features/activity/data/lifecycle.ts`, new)

- [ ] 1.1 Create the file in the **existing `data/` sublayer** (D1). Do not create a `runtime/` sublayer: `eslint.config.js`'s B-1 rule keys off `layer: "!(data)"`, so a new sublayer would be banned from `@/db` and would need config surgery for no gain. Precedent to follow for tone and shape: `mobile/src/features/calendar/data/sync/startup.ts`.
- [ ] 1.2 `useActivityForegroundRefresh(): void` (D5). Subscribe to `AppState`'s `"change"` event; set a `backgroundedRef` on `"background"`; on `"active"`, refresh **only** if that ref was set, then clear it. Fire `void refreshNewestPage()` — **passive, no `force`**. Return the subscription's `remove()` as the effect cleanup. Copy the ref idiom from `mobile/src/updates/ota-update-runtime.tsx` and say in a comment why `inactive → active` must not count (notification shade, control centre, incoming call — not a return to the app).
- [ ] 1.3 `useActivityScreenRefresh(): { outcome, isRefreshing, refresh }` (D6). A once-only mount effect fires the **passive** refresh; `refresh()` fires a **forced** one. Store the resolved `ActivityRefreshOutcome` in state (`null` before the first settles) and expose `isRefreshing`. Guard state writes with a mounted ref so a resolution after unmount does not warn. Do not wrap `loadOlderPage` — backfill is Ticket 5's pagination.
- [ ] 1.4 `useActivityOwnershipPrune(): void` (D7). Read `useUserCalendars()` and `useUserCalendarsLoaded()` from `@/features/calendar-sources/data`. Keep the previously observed id set in a ref. Do nothing while not loaded. Do nothing on the **first** loaded observation — record it and return. On any later loaded observation where an id from the previous set is absent, call `pruneToHeldCalendars(currentIds)` and record the new set.
- [ ] 1.5 Comment 1.4 with the safety argument, because the call looks like the read TIM-397 forbids and is not: an empty set is acted on only as the **second term of an observed transition** from a non-empty loaded set, which is a removal event observed rather than assumed. State that removing the first-observation guard turns this into the cache-destroying speculative read.
- [ ] 1.6 In 1.4, take **every** held row's id. Do **not** filter on `visible` — a hidden calendar is still held, and dropping its id would delete its whole Activity history the first time a student hides it.
- [ ] 1.7 `pruneToHeldCalendars` is the one consumed operation that **can** reject. Wrap it in `try`/`catch` and record through `@/firebase`'s `recordUnknownError` with the static context `"activity/prune"` and **no payload** (no calendar id, name, or token). A prune failure must not throw out of the effect.

## 2. Barrels

- [ ] 2.1 Add the three hooks to `mobile/src/features/activity/data/index.ts`, keeping the file's alphabetical export convention. B-2: the sublayer must not import its own feature barrel.
- [ ] 2.2 Re-export them (and the screen-refresh return type) from `mobile/src/features/activity/index.ts`, and update that barrel's header comment — it currently says "No `ui/` yet: … Ticket 6 wires calendar sync, push, app open and foreground", which this change makes past tense.

## 3. Calendar sync trigger (`mobile/src/features/calendar/data/sync/sync.ts`)

- [ ] 3.1 Import `refreshNewestPage` from `@/features/activity` — the **feature barrel** (D2), not `@/features/activity/data`. The nearby deep import of `@/features/calendar-sources/data/user-calendars` is not a competing convention: it exists only because that feature's barrel does not re-export `findAll`.
- [ ] 3.2 Fire `void refreshNewestPage({ force: true })` immediately after the `replaceAll` try/catch resolves successfully and **before** the name-convergence block (D3). Not inside the `try`, not after the name write.
- [ ] 3.3 Do **not** `await` it and do **not** attach a `catch` or a `try` (D3). Comment all three: unawaited so `isSyncing` is not held open on an unrelated request; no catch because `refreshNewestPage` never rejects, so a catch would be dead code implying otherwise; a `{ status: "failed" }` outcome is **not** a sync failure and must never reach `setIsError`.
- [ ] 3.4 Confirm by reading that the early `tokens.length === 0` return and the `replaceAll` catch both leave the call unreached — the no-calendars and failed-write cases must trigger nothing.

## 4. Push triggers (`mobile/src/features/notifications/data/tap-routing.ts`)

- [ ] 4.1 Extract the relevance test the foreground handler already inlines into one predicate over `data.action ∈ { calendar_changed, calendar_digest }`, and use it at all three entrypoints. Keep the two action constants where they are.
- [ ] 4.2 Add `void refreshNewestPage({ force: true })` **beside** the existing `void sync()` — in the foreground handler and in `routeTap` — never chained onto the sync's promise (D4). Comment that architecture decision 7 requires them independent so the push guarantee survives a failing sync, and that the coordinator's single-flight collapses the duplicate when the sync also succeeds.
- [ ] 4.3 In `routeTap`, gate the Activity refresh on the **action predicate**, not on `parseNotificationRoute(message) !== null` (D4). A `calendar_changed` with an undecodable `payload` parses to `null` but is a real calendar change: routing correctly declines to navigate, Activity must still refresh.
- [ ] 4.4 Leave `routeTap`'s unconditional `void sync()` exactly as it is, and change no navigation branch. Narrowing either is a routing-behavior change — the ticket's named sensitive surface.
- [ ] 4.5 Confirm nothing in this file reads notification preferences: Activity refreshes regardless of subscription prefs (ticket "Out of scope").

## 5. Root runtime mount (`mobile/src/app/_layout.tsx`)

- [ ] 5.1 Add one local `ActivityRuntime()` component that calls `useActivityForegroundRefresh()` and `useActivityOwnershipPrune()` and returns `null`, mirroring the file's existing `StartupSync` / `NotificationRegistration` / `NotificationTapRouting` wrappers, with the same style of explanatory comment.
- [ ] 5.2 Mount it inside the provider tree beside `<StartupSync />`. It needs no `QueryClient` (the coordinator uses no TanStack Query — TIM-397 D8), but keeping it with its siblings keeps the startup wiring in one place.
- [ ] 5.3 Import from `@/features/activity` only — B-3 forbids a route reaching `@/api/generated` or `@/db`.

## 6. Tests

Mock at the **`customFetch` mutator** (`testing.md`), never at `fetch` and never at the generated module. Use the shared `createFakeDb` for storage, never a bespoke db mock. Control the clock by seeding the persisted `lastSuccessfulRefreshAt` relative to a fixed `jest.setSystemTime` base rather than by mocking `Date.now` piecemeal.

- [ ] 6.1 **`sync.test.tsx` (extend).** A successful sync fires exactly one forced Activity refresh, after `replaceAll` resolves. A `replaceAll` throw fires none. A zero-token sync fires none. A name-convergence throw does **not** suppress it.
- [ ] 6.2 **`sync.test.tsx` — the epic acceptance criterion.** With the Activity refresh resolving `{ status: "failed", reason: "network" }`, the sync still reports success: `isError` stays `false`, `recordUnknownError` is not called with a calendar-sync context, and the stored rows are unchanged. Add the same with the refresh resolving slowly, asserting `isSyncing` returns to `false` without waiting for it.
- [ ] 6.3 **`tap-routing.test.tsx` (extend).** A forced Activity refresh is requested for a foreground `calendar_changed`, a foreground `calendar_digest`, a background tap, and a cold-start tap. None is requested for an unrecognized action. One is requested for a `calendar_changed` whose `payload` is undecodable, **and** that case still does not navigate. One is requested when `sync()` rejects — the independence proof.
- [ ] 6.4 **Routing regression (sensitive surface).** Every pre-existing test in `tap-routing.test.tsx` must pass **unedited**. If one needs an edit, routing behavior changed: stop and re-read task 4.4. Say so explicitly in the change notes rather than editing the test.
- [ ] 6.5 **`lifecycle.test.tsx` (new) — foreground.** `background → active` issues exactly one passive refresh. `inactive → active` with no preceding `"background"` issues none. A second `active` without a new `"background"` issues none. Unmounting removes the `AppState` listener.
- [ ] 6.6 **`lifecycle.test.tsx` — the five-minute window, controlled clock.** With `lastSuccessfulRefreshAt` seeded four minutes ago, both passive triggers (screen open, foreground) issue **zero** requests and resolve `fresh`. Seeded six minutes ago, each issues exactly one. Seeded four minutes ago, `refresh()` (forced) still issues one.
- [ ] 6.7 **`lifecycle.test.tsx` — screen open.** The mount effect fires exactly once across re-renders; `outcome` is `null` before the first settles and then the coordinator's outcome verbatim; a failure outcome is exposed rather than thrown; `isRefreshing` goes true then false. A resolution after unmount produces no state-update warning.
- [ ] 6.8 **`lifecycle.test.tsx` — ownership prune (D7).** Not loaded → no prune. First loaded observation → no prune, whatever it contains, **including the empty set** (the cache-destroying case). Two calendars → one removed → `pruneToHeldCalendars` called once with exactly the remaining id. Both removed → called with `[]`. A calendar toggled hidden → **no** prune. A calendar added → no prune. A simultaneous add + remove → prune with the full current set. A throwing prune records under `"activity/prune"` and does not throw out of the effect.
- [ ] 6.9 **`triggers.test.tsx` (new) — the single-flight acceptance criterion (D9).** Mount the real `useSyncCalendars`, the real `useNotificationTapRouting` and the real lifecycle hooks over one mocked `customFetch`. Fire a push, a sync completion, a screen open and a foreground return into the same tick while the newest-page request is in flight, and assert **exactly one** `POST /v1/calendar-logs/search`. Drive the in-flight request with a controllable deferred, never `setTimeout` or timing.
- [ ] 6.10 **`triggers.test.tsx` — cold launch (D8).** Mounting `useStartupSync` with a successful sync issues exactly one Activity request, and no second startup path issues another. Add the offline case explicitly: a failing startup sync issues **zero** Activity requests, which is the documented behavior, not a bug.
- [ ] 6.11 **Privacy.** Across every failure path added here, assert the `recordUnknownError` argument carries no calendar token, calendar id, calendar name, log id, cursor value, or request body.

## 7. Boundaries

- [ ] 7.1 Add one `no-restricted-imports` entry in `mobile/eslint.config.js` banning `@/features/activity` (and any deeper path) inside `src/features/calendar-sources/**` (D7). Use the existing `{ regex, message }` seam-ban idiom — the same shape as `activityClientImportPattern`, which #324 added (verified on that branch: a `{ regex, message }` const, plus a `banActivitySeam` toggle on `restrictedImports`). Message: the Activity data layer imports calendar-sources, so the reverse edge closes a module cycle whose failure mode is an `undefined` binding at Metro module init, invisible to `tsc`.

      **This one is directory-scoped, so it is not shaped like the bans above it.** `activityClientImportPattern` is global-with-exceptions and rides the `restrictedImports()` defaults; this ban applies to *one* feature, so it needs its own config block — and that is where the trap is. In ESLint flat config, a later block that sets `no-restricted-imports` with options **replaces** the earlier options wholesale; they do not merge. `src/features/calendar-sources/**` is already matched by the `timecalendar/routes-not-importable` block (`files: ["src/**/*.{js,jsx,ts,tsx}"]`, and calendar-sources is not in its `ignores`), which is the last block setting this rule for those files. A new block that lists only the Activity pattern therefore **silently switches off every base seam ban** — storage backends, chrome, calendar-kit, the generated client, and the `@/app` route-entrypoint ban — for the whole calendar-sources feature, with lint still green. The repo already shows the correct idiom: `routes-not-importable` re-calls `restrictedImports([...])` rather than listing its one pattern alone.

      So: extract that block's inline `^@/app(/|$)` pattern into a named const, and add the new block **after** it, re-including both patterns:

      ```js
      {
        name: "timecalendar/calendar-sources-is-a-leaf",
        files: ["src/features/calendar-sources/**"],
        rules: {
          "no-restricted-imports": restrictedImports([
            routeEntrypointImportPattern,
            activityFeatureImportPattern,
          ]),
        },
      }
      ```
- [ ] 7.1b **Prove the 7.1 block both ways — inject and revert.** A green `npm run lint` is compatible with the new rule doing nothing *and* with it having disabled the base bans, so assert each direction by temporarily editing a calendar-sources file and confirming lint **fails**, then reverting:
      1. `import { refreshNewestPage } from "@/features/activity"` → must fail with the new message (the ban fires).
      2. `import { storage } from "react-native-mmkv"` (or any banned backend) → must still fail (the base patterns survived the override).
      3. `import { something } from "@/app/_layout"` → must still fail (the `@/app` ban survived).
      Same inject-and-revert discipline the `boundaries` typescript-resolver check uses in `eslint.config.js`'s own comment (D5 there) — and for the same reason: the failure mode is a silent pass.
- [ ] 7.2 Confirm the file-level graph is what the ADR draws: `calendar sync → activity data`, `notifications → activity data`, `root runtime → activity data`, `activity data → calendar-sources data`. No Activity module imports `@/features/calendar/**`. Verification: `npm run lint` and `grep -rn "@/features/calendar" mobile/src/features/activity/`.

## 8. Gates

- [ ] 8.1 `npx tsc --noEmit` — green.
- [ ] 8.2 `npm run lint` — green. Green alone does not prove the 7.1 rule; 7.1b is what proves it.
- [ ] 8.3 `npm test -- --coverage` — green, with `src/features/activity/!(ui)/**` still meeting the **90% lines and branches** gate now that `lifecycle.ts` is in it. Run the **coverage** form; plain `npm test` passes blind past it. Do not reach the number with `istanbul ignore`.
- [ ] 8.4 Confirm the whole suite is green with **no edits to any pre-existing test file** other than the two extensions in 6.1–6.3. Any other required edit means this change regressed a consumer.
- [ ] 8.5 Run the Jest command scoped to a path, not to a bare module name — this worktree's directory is named after the ticket, so `jest activity` matches the worktree path and runs the entire suite. Use `--maxWorkers=4`, never `--runInBand`.

## 9. Architecture Book

- [ ] 9.1 Write the ADR recording **D3/D4** (trigger independence and the never-rejects contract that makes a sync success stay a success), **D5/D6** (the passive five-minute edges and where each failure is visible) and **D7** (the direction of the trigger edges and the observed-transition prune). Follow `decisions/TEMPLATE.md`. **Pick the number immediately before writing**: re-read `docs/mobile/architecture-book/decisions/README.md` on the rebased `main` for the live maximum **and** check open mobile PRs (`gh pr diff <N> --name-only | grep decisions/`). At proposal time `045` and `047` are reserved by open PRs and `048` is #324's, so `049` is the expected answer — verify it rather than assuming it. Add the row to `decisions/README.md`.
- [ ] 9.2 Amend `decisions/028-fcm-tap-routing.md`: notification receipt now fans out to **two independent** seams — the calendar sync and the Activity refresh — and the Activity call is deliberately not chained onto the sync. Do not rewrite the routing decision; it is unchanged.
- [ ] 9.3 `docs/mobile/architecture-book/firebase.md` → **Cloud Messaging**, the ADR 028 tap-routing block: it currently says the dispatcher's only cross-feature call is `useSyncCalendars`. Update it to name the second, independent Activity refresh and the action-based relevance test.
- [ ] 9.4 `docs/mobile/architecture-book/calendar.md` → **Sync and offline behavior**: record that a successful event write is followed by a non-blocking forced Activity refresh, that the sync neither awaits nor inspects its outcome, and that an Activity failure cannot change the sync's result. While there, check the existing sentence "Sync runs at startup, foreground/resume, manual refresh, source changes, and notification receipt" against the code — `foreground/resume` has no `AppState` wiring in `mobile/src` today. Correct it or leave it, but do not let this change be read as having added one.
- [ ] 9.5 `docs/mobile/architecture-book/features.md`: update the `activity` row — the feature now owns the app-foreground, screen-open and removal-prune runtime hooks, and is triggered by calendar sync and notification receipt.
- [ ] 9.6 `docs/mobile/architecture-book/lint-format.md`: document the 7.1 directional guard beside the boundaries #324 added.
- [ ] 9.7 Append a dated entry to `docs/mobile/architecture-book/CHANGELOG.md` (that is the real filename — the `.claude/rules/mobile.md` pointer calls it `architecture-changelog.md`) naming the ADR number, the trigger table, the sync-success-preserved rule, and the new directional lint rule.

## 10. Definition of Done and hand-back

- [ ] 10.1 Write the `(HUMAN: …)` device note at `docs/react-native-migration/inbox/2026-08-30-activity-trigger-device-verification.md`, following the existing inbox files' shape. It must ask for: a real `calendar_changed` push in foreground, background-tap and killed states on both platforms in a **release** build; a foreground-return refresh after five minutes; and a removal prune verified offline. It is **not** a blocker — Ticket 7 ([TIM-400](/TIM/issues/TIM-400)) documents the device checks.
- [ ] 10.2 Walk `docs/mobile/architecture-book/definition-of-done.md`. Applicable: gates green with coverage, ADR + Book updated, unexpected failures reach Crashlytics with no personal data (pinned by 6.11). Record the reason for each non-applicable item — this ticket ships **no rendered surface**, so no Maestro flow, no FR/EN strings, no VoiceOver/TalkBack or touch-target pass, no device-form-factor check; the screen-open hook's visible failure surface lands with Ticket 5.
- [ ] 10.3 Confirm the diff touches only: `mobile/src/features/activity/data/`, `mobile/src/features/activity/index.ts`, `mobile/src/features/calendar/data/sync/sync.ts`, `mobile/src/features/notifications/data/tap-routing.ts`, `mobile/src/app/_layout.tsx`, `mobile/eslint.config.js`, this OpenSpec change, the Book files, and the inbox note. **No** server change, no `openapi/openapi.json` or `mobile/src/api/generated/` change, no migration, no `mobile/firebase/` / `app.config.ts` / `eas.json` / native change, no new runtime dependency, no new route.
- [ ] 10.4 If `mobile/firebase/` or `mobile/app.config.ts` turns out to need a change, **stop and raise it on [TIM-399](/TIM/issues/TIM-399)** before making it — the brief names that as a hard stop.
- [ ] 10.5 `openspec validate wire-mobile-activity-triggers --strict` passes. Run it **early**, not at merge time — the delta-header check is what `openspec archive` gates on, and it aborts behind the long CI gate.
- [ ] 10.6 Flag the sensitive surfaces in the PR body: notification/push routing (with a pointer to the unedited routing tests, 6.4) and the cross-feature dependency direction (with a pointer to the lint rule, 7.1).
