## Context

The root Expo Router stack currently uses `unstable_settings.initialRouteName = "(tabs)"` to anchor deep-link back stacks, then native tabs select their first trigger (Home). Database migrations start as a top-level fire-and-forget promise, `useAppReady()` treats migrations as synchronously ready, and the notification runtime independently resolves killed-state taps after mount. There is no owner that can say when persisted data, first-launch identity, a cold-start intent, and the selected fallback tab have all settled.

Flutter provides the parity evidence: `startup_screen` defaults to `home`, accepts `home`/`calendar`, and is read only when its tab shell is initialized. Its splash controller resolves held calendars first and sends an empty identity to onboarding. React Native must reproduce the behavior, not Flutter's widget implementation, and `app/` remains untouched under R-5.

The launch decision crosses Settings/MMKV, SQLite migrations and calendar identity, Expo Router, FCM killed-state handling, and splash readiness. It is load-bearing because Phase 09 must insert the legacy importer before any target-store read, and because two independent routers would create nondeterministic first paint.

## Goals / Non-Goals

**Goals:**

- Persist and validate a Home/Calendar launch preference through the existing Settings and `@/storage` seams.
- Make one coordinator own the one-shot, no-intent launch fallback after migrations, future import, and identity resolution.
- Preserve existing explicit navigation and `(tabs)` back-stack behavior.
- Keep the native/JS splash cover in place until the selected destination is committed, with a recoverable migration/read failure surface instead of continuing against unknown storage.
- Give Phase 09 a tested Flutter-value mapper and setter without introducing a pretend importer.

**Non-Goals:**

- Implementing or reading native Flutter shared preferences in this change.
- Changing tab order, tab identity, calendar behavior, notification payloads, server/OpenAPI contracts, or native configuration.
- Applying a Settings change to the already-running navigation session.
- Modifying Flutter production files or expanding into other parity preferences.

## Decision 1 — Settings owns a closed startup-tab preference and importer target

Add `StartupTabPreference = "home" | "calendar"` and a flat `settings.startupTabPreference` key to `features/settings/prefs`. The total parser returns `"home"` for missing, malformed, legacy, or downgrade values. Imperative `getStartupTabPreference` / `setStartupTabPreference` support startup and import code; `useStartupTabPreference` supports UI reactivity. The key is centrally enumerated as environment-independent because changing backend must not change how the app opens.

Expose a pure `mapFlutterStartupScreen(raw: unknown): StartupTabPreference` plus an imperative `setStartupTabFromFlutter(raw)` that maps only exact Flutter wire values `home` and `calendar`; everything else writes Home. Phase 09 can call this target after reading `flutter.startup_screen`. This change does not create a no-op importer hook: a fake lifecycle seam would hide that Phase 09 is absent and provide no proof of ordering.

_Alternative rejected:_ reuse Flutter's bare `startup_screen` key in RN. RN keys are namespaced and centralized; Phase 09 is responsible for translating a legacy native key into the RN-owned schema.

## Decision 2 — A dedicated Settings route presents the choice without navigating

Add `/startup-settings` as a root Stack sibling with a thin route export over a Settings `ui/` screen. Insert a Startup screen row after Appearance & language in the Settings Preferences group. The screen follows the existing timezone/appearance chrome seam and renders one native single-select Picker with localized Home and Calendar options, selected from `useStartupTabPreference()`.

Selection calls only the preference setter. The launch coordinator snapshots and consumes the preference once during cold-start resolution; it does not subscribe to later preference changes. This makes “next resolved launch” structural instead of relying on a flag that suppresses an otherwise reactive redirect.

_Alternative rejected:_ place the picker on Appearance & language. Startup behavior is neither appearance nor language, and a dedicated working destination preserves the grouped Settings information architecture.

## Decision 3 — One launch coordinator owns ordered resolution and a one-shot decision

Create a startup feature with pure decision logic and a small root-mounted coordinator. The coordinator is mounted inside the environment and query providers, beside the root `Stack`, and has these ordered phases:

1. Await the single memoized database-migration attempt. Phase 09 will insert its importer immediately after this step and before steps 2–3; the architecture and tests pin that insertion point even though no importer exists yet.
2. Resolve the killed-state notification intent and capture the router's initial path. A non-default initial path is an explicit deep link.
3. Read held calendar identity only after step 1 (and the future importer) completes.
4. Choose exactly once: an explicit deep link or valid notification target wins; otherwise an empty resolved calendar identity chooses `/onboarding`; otherwise the startup preference chooses `/` (Home) or `/calendar`.
5. Apply a fallback with `replace`, re-checking that no newer explicit navigation has appeared. Notification routing retains its existing event/calendar behavior and tab back anchor. Mark launch committed only when the observed router path matches the winning target.

The pure resolver takes explicit values (`initialPath`, notification intent, identity state, preference), making the precedence matrix unit-testable. A process-lifetime latch prevents Settings writes, onboarding/import completion, foreground/background notification listeners, or any later `router.push`/`replace` from re-running the fallback.

`unstable_settings.initialRouteName = "(tabs)"` remains unchanged. It still supplies a safe back-stack anchor for deep-linked root routes; it is not repurposed as the dynamic default-tab mechanism.

_Alternative rejected:_ dynamically reorder native tab triggers. Trigger order is the stable Home · Calendar · Settings information architecture and changing order to select Calendar would change the visible tab bar.

_Alternative rejected:_ let Settings, onboarding, tabs, and notifications each redirect independently. Competing effects cannot define deterministic precedence and can overwrite an intent after first paint.

## Decision 4 — Killed-state notifications join launch resolution; live listeners stay live

Refactor notification routing so the one killed-state `getInitialTap()` read becomes an input to the launch coordinator rather than an independent post-mount redirect. The existing pure notification parser, sync-before-navigation behavior, Activity refresh fan-out, foreground no-navigation rule, and background-tap listener remain owned by Notifications.

The initial-tap result must settle (including `null`) before the fallback preference is eligible. A valid notification target wins over Home/Calendar; an absent or invalid target contributes no intent and allows normal onboarding/default resolution. Exactly one code path consumes the native initial notification.

_Alternative rejected:_ apply the preference first and let the existing notification effect correct it later. That can expose or initialize the wrong tab and makes the visible outcome depend on promise timing.

## Decision 5 — Splash readiness includes destination commitment, while failures resolve to a blocking surface

Replace the migration no-op in `useAppReady()` with coordinator state. Normal readiness requires migrations, future-import insertion point, identity/intent resolution, and confirmation that the router committed the winning destination. The existing JS overlay continues to cover the initially mounted Home tab while a Calendar/onboarding/intent replacement is pending, and only then fades (or cuts under reduced motion).

Migration or identity-read failure is recorded and transitions to a localized, accessible blocking error with Retry. Surfacing that error counts as a settled first paint, so the native/JS splash can dismiss without the watchdog exposing tabs or hanging forever; retry reruns the idempotent prerequisite. The existing watchdog remains a last-resort safety net but must resolve to the blocking failure state, never to unverified app content.

Tests own the flash guarantee: with Calendar selected, the splash hide/removal must not occur while the path is Home and may occur only after `/calendar` is observed; equivalent cases cover Home, onboarding, deep link, notification, and failure.

_Alternative rejected:_ keep migrations fire-and-forget and merely delay a redirect. Calendar identity could be read before its schema/import target is ready, violating the Architecture Book and Phase 09 ordering contract.

## Decision 6 — Verification is layered, with exact-head native CI for the parity flow

Pure Jest tests cover parsing, persistence, Flutter mapping, and the complete resolver precedence table. Component/route tests cover the Settings row/picker and root coordinator wiring. A focused splash/launch test proves the wrong tab cannot become visible before path commitment.

A shared Maestro flow imports the seeded identity through the existing dev-only seam, sets each choice through Settings, cold relaunches without a link, and asserts Home then Calendar. The same YAML runs in iOS and Android jobs. Because this behavior is launch- and native-tab-sensitive, the implementation PR receives the `run-e2e` label and both native jobs must be green at the reviewed exact head; this is stronger than the repository's usual post-merge-only path for ordinary mobile changes.

Screen-reader, large-text, and first-paint visual review that cannot run on this host goes in one non-blocking `(HUMAN: …)` migration inbox note, never as an implementation blocker.

## Risks / Trade-offs

- [Expo Router mounts Home before an effect can replace it] → keep the existing JS splash above the Stack and withhold readiness until the observed path is the winner; gate tabs-only secondary effects such as Changelog on launch commitment.
- [A deep link arrives while fallback resolution is in flight] → capture the initial path and re-check current navigation immediately before applying the fallback; after the one-shot latch, all later navigation is authoritative.
- [Notification initial-tap ownership is duplicated during refactor] → one exported initial-intent seam and tests assert `getInitialTap()` is consumed once; the live runtime handles only foreground/background events afterward.
- [Migration/read failure could hang splash or expose unsafe content] → convert failure into an explicit blocking state, record it, permit idempotent Retry, and make the watchdog fail closed.
- [The future importer is inserted after the preference/identity read] → architecture guidance and sequence tests name the exact post-migration/pre-read insertion point; the mapper/setter is ready now.
- [Maestro picker interaction differs by platform] → use the established RN-core wrapper testID around the chrome Picker and shared text/testID selectors; keep one cross-platform flow.

## Migration Plan

This is additive local state. Existing RN installations have no key and therefore open Home. Future Phase 09 imports exact Flutter `home`/`calendar` values through the new setter; invalid legacy values become Home. Rollback removes the routing/UI consumers while leaving an inert MMKV string, which older builds ignore. No database, backend, API, binary configuration, or deploy migration is required.

## Open Questions

None. The Founding Engineer brief fixes the product precedence, lifecycle semantics, default, importer boundary, and required native proof.
