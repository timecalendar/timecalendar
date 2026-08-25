## Context

`expo-updates` is already installed and configured with the fingerprint runtime-version policy, but `mobile/app.config.ts` inherits the launch-time cache fallback and the app has no owned runtime consumer of downloaded-update state. Crashlytics currently identifies only the native build, so crashes from different JavaScript bundles inside the same store build are indistinguishable.

The root layout already mounts non-visual runtime services and imports `@/firebase` early to preserve RNFirebase's top-level FCM background-handler registration. This change must add OTA behavior without blocking the existing splash, adding UI, importing RNFirebase outside its seam, weakening Jest safety, or pre-empting later endpoint, channel-stamping, signing-material, and publishing work.

The architecture choice is load-bearing: the target is self-hosted xprem backed by the existing production Postgres control plane and Cloudflare R2 assets, without ClickHouse, with signed bundles and fingerprint compatibility. The implementation in this change records that target but deliberately leaves unavailable endpoint and signing inputs untouched.

## Goals / Non-Goals

**Goals:**

- Keep cold launch non-blocking and make the zero-wait policy explicit in Expo config.
- Apply an already-downloaded update silently on the next real background-to-active boundary, at most once per JavaScript runtime.
- Record a rejected reload through the existing Firebase error seam without user or schedule data.
- Attach deterministic OTA bundle identity to Crashlytics once per JavaScript runtime through the modular RNFirebase v24 seam.
- Prove the Firebase forwarding and AppState state machine in focused Jest tests.
- Ratify the complete self-hosted OTA architecture and reconcile the Architecture Book's changelog pointer.

**Non-Goals:**

- Changing `updates.url`, request headers, EAS channel/profile mappings, runtime-version policy, certificate paths, private keys, xprem identifiers, environment switching, or store credentials.
- Standing up xprem, R2, Postgres schema, Terraform/Kubernetes resources, publish CI, rollout automation, source-map upload, or adoption analytics.
- Showing progress, a restart prompt, a dialog, or any user-facing copy.
- Running or claiming real-device OTA verification; that remains a `(HUMAN: ...)` migration-inbox follow-up once the endpoint and signing inputs exist.
- Editing the generated OpenAPI client, server migrations, Firebase config files, CI workflows, or legacy Flutter app.

## Decisions

## Decision 1 — One owned, non-visual OTA runtime boundary

Add a small `mobile/src/updates/` boundary exporting a single non-visual `OtaUpdateRuntime` component. It alone imports `expo-updates` and owns the AppState listener; the root layout mounts it exactly once alongside the other runtime services. This keeps update-provider details out of feature and layout logic while fitting the established root-service pattern.

Alternatives considered: putting the listener directly in `_layout.tsx` would mix provider-specific state logic into composition code; a product feature folder would assign infrastructure behavior to the wrong domain; a module-init listener would be harder to clean up and prove under React/Jest.

## Decision 2 — Consume a real background-to-active boundary

`useUpdates().isUpdatePending` is mirrored into a ref so the AppState subscription is installed once rather than recreated when update state changes. The listener records whether `background` has occurred since the last `active` event. On `active`, it consumes that boundary first, then requests a reload only when the boundary was real, an update is already pending, and no reload attempt has occurred in this JavaScript runtime. `inactive` alone never qualifies, but an iOS `background → inactive → active` sequence still does because the background marker survives intermediate states.

Consuming every active boundary is important: if an update finishes downloading after the app has already returned to the foreground, historical backgrounding does not authorize an immediate reload. The user must leave and return again, which preserves the promised natural boundary.

Alternatives considered: reacting directly to `isUpdatePending` would reload in the foreground; checking only the immediately previous AppState would miss platforms that emit an intermediate `inactive`; delaying by a timer invents an arbitrary boundary and can interrupt active use.

## Decision 3 — One reload attempt per JavaScript runtime

Latch the attempt before calling `reloadAsync()`. A resolved reload replaces the JavaScript runtime; a rejection is recorded once with the constant context `ota/reload` through `recordUnknownError` and is not retried in the same runtime. A later cold launch can apply the cached update through the normal Expo Updates path.

This trades an aggressive retry for loop safety. Retrying on every foreground could turn a persistent native/provider rejection into repeated interruptions and error noise; retrying immediately after rejection would violate the single-boundary contract.

## Decision 4 — Install deterministic OTA Crashlytics keys through `@/firebase`

Extend `mobile/src/firebase/index.ts` with one modular `setAttributes(getCrashlytics(), attributes)` wrapper. `OtaUpdateRuntime` derives and installs these strings once per JavaScript runtime from `useUpdates().currentlyRunning`:

- `otaUpdateId`: `updateId ?? "embedded"`
- `otaChannel`: `channel ?? ""`
- `otaRuntimeVersion`: `runtimeVersion ?? ""`
- `otaCreatedAt`: `createdAt?.toISOString() ?? ""`
- `otaIsEmbedded`: `String(isEmbeddedLaunch)`

A module-scoped guard is set before the asynchronous call, preventing Strict Mode/remount duplication. A rejected attribute installation is recorded through `recordUnknownError` with the constant context `ota/attributes` and is not retried in the same runtime. No manifest fields, URLs, user ids, calendar ids, or schedule content are attached.

Alternatives considered: importing RNFirebase in the OTA component violates the established seam; setting keys at module import would require top-level native Crashlytics access and break the seam's one documented FCM-only exception; deriving values from Expo constants in the Firebase module would couple two vendor seams.

## Decision 5 — Explicit zero-wait config, with config-shape proof

Add `fallbackToCacheTimeout: 0` beside the existing `updates.url`. This documents that the app launches its cached/embedded bundle immediately while Expo checks and downloads in the background. Verification resolves both development and production Expo config and asserts the timeout, app identities, Firebase files, existing URL, and fingerprint policy remain correct; no Jest test pretends to prove native config.

Alternatives considered: a positive startup timeout charges every cold launch for rare updates and still cannot guarantee the bundle download completes; a custom splash/progress gate conflicts with the acceptance criteria.

## Decision 6 — ADR 036 ratifies the architecture, not unavailable deployment inputs

ADR 036 records: self-hosted xprem; Cloudflare R2 for assets; xprem control-plane mode on the existing production Postgres service; no ClickHouse while Crashlytics supplies client observability; signed updates; fingerprint runtime compatibility; silent foreground-boundary application; and the exact operational rule: “channel pointers and rollout percentages are imperative, deliberately.” The latter keeps incident-time rollout/rollback changes out of declarative reconciliation loops.

The ADR, index, `eas.md`, `firebase.md`, and existing `CHANGELOG.md` become current guidance. `architecture.md` is reconciled so Git remains implementation history while `CHANGELOG.md` records Architecture Book rule changes. The stale `architecture-changelog.md` requirement in the same OpenSpec Architecture Book seam is corrected to `CHANGELOG.md`; no duplicate file is created. `runtime.md` changes only if application work uncovers a reusable baseline contract not already captured by EAS/Firebase guidance.

Alternatives considered: deferring the ADR leaves later endpoint/signing work without a source of truth; documenting concrete URLs, ids, headers, or key paths now would guess inputs explicitly assigned to later changes; enabling xprem's ClickHouse stack duplicates Crashlytics without a demonstrated need.

## Risks / Trade-offs

- [AppState sequences differ across platforms] → latch the occurrence of `background`, consume it on `active`, ignore `inactive` as authorization, and cover intermediate-state sequences in Jest.
- [A stale closure sees the wrong pending state] → mirror `isUpdatePending` into a ref while keeping one listener subscription.
- [React remounts duplicate Crashlytics keys or reload calls] → use module/ref guards set before asynchronous work and assert duplicate events/remounts do not duplicate side effects.
- [A rejected reload leaves the cached update unapplied until a later launch] → record the rejection once; prefer a safe cold-launch fallback over repeated foreground loops.
- [Crashlytics setup failure becomes an unhandled promise rejection] → catch and record it through the existing error seam with a constant, non-personal context.
- [Config work accidentally changes endpoint/channel/native identity] → validate resolved Expo config for both variants and review the exact `app.config.ts` diff.
- [The ADR is mistaken for completed infrastructure] → separate ratified target architecture from explicitly deferred endpoint, signing material, deployment, and device-verification tasks.

## Migration Plan

1. Add and test the Firebase attribute wrapper without changing the existing FCM module-init registration.
2. Add the OTA runtime component/state machine and mount it once in the root layout.
3. Set the explicit zero-wait config and validate both app variants.
4. Add ADR 036 and reconcile the Architecture Book guidance/changelog pointer.
5. Run focused Jest tests, TypeScript, lint/format, full mobile coverage, OpenSpec validation, and Expo config validation.
6. Record real-device download/reload/Crashlytics confirmation as a `(HUMAN: ...)` inbox follow-up; it becomes executable only after the later endpoint/signing inputs land.

Rollback is a normal code revert: removing the component restores Expo's next-cold-launch application behavior; removing the explicit zero leaves the same current default but loses the documented guarantee. No persisted data or server migration is involved.

## Open Questions

None blocking. Endpoint/channel stamping, signing inputs, source-map upload, publish CI, and exact device verification are intentionally owned by later OTA children.
