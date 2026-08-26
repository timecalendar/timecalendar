## Context

`DevImportScreen` starts the seeded-calendar import from an effect whose dependencies include `sync`, returned by `useSyncCalendars()`. The effect currently creates a local `cancelled` flag and sets it in its cleanup. When the mutation state changes during the first sync, the hook may return a new `sync` function identity; React then runs the cleanup before rerunning the effect. The once-per-mount `startedRef` correctly prevents a second import, but the first async continuation now observes `cancelled === true` and suppresses `router.replace("/calendar")`. Both native E2E jobs therefore remain on the loading screen even though token resolution and sync completed.

The proven corrective behavior exists in commit `587435c8eb204cf9af8ef7f5a869edd638e9fc85`; this change is its clean, narrow representation from current `main`. The affected surface is presentational mobile code plus its colocated component test. It touches no listed sensitive surface.

## Goals / Non-Goals

**Goals:**

- Cancel post-await UI work only after an actual screen unmount.
- Preserve exactly one import attempt per mount across dependency-driven rerenders.
- Prove an in-flight import still navigates when `sync` changes identity and prove the replacement callback does not restart the import.
- Retain the production runtime gate, error reporting, and existing import/sync ordering.

**Non-Goals:**

- Change the token resolve/upsert seam, calendar sync mutation, onboarding, recovery, or production behavior.
- Extend Maestro timeouts or retries, weaken `mobile/.maestro/import-seed.yaml`, or modify CI/harness behavior.
- Change API/generated code, schema/migrations, native/store/EAS config, infrastructure/deploy, secrets, or legacy Flutter.
- Introduce a reusable hook, Architecture Book rule, or ADR for this local lifecycle correction.

## Decision 1 — Track mounted lifetime in an empty-dependency effect

Add a `mountedRef` beside the existing `startedRef`. An effect with an empty dependency list sets the ref while the screen is mounted and clears it only from that effect's cleanup. The import effect consults `mountedRef.current` before navigating or setting the error state after awaited work.

This separates component lifetime from the import effect's dependency lifecycle while preserving the current dependency list and React's normal rerun semantics. A local `cancelled` variable remains correct only when every cleanup means cancellation; here, cleanup can also mean the callback identity changed. Removing `sync` from the dependency list or suppressing the hook rule was rejected because it would hide a captured dependency and weaken static enforcement. Storing the latest `sync` callback in a ref was rejected because the in-flight operation must finish with the callback it already invoked, not switch callbacks mid-run.

## Decision 2 — Keep the once-per-mount guard independent from mounted state

Retain `startedRef` as the sole import-start guard. A dependency rerender may re-enter the import effect, but it returns because the import already started. `mountedRef` controls only whether the completed async operation may update UI/navigation.

Combining both concerns into one ref was rejected because “has started” and “is still mounted” have different lifetimes and transitions. Resetting the start guard during an effect cleanup was rejected because it would restart imports on ordinary dependency changes.

## Decision 3 — Prove the mutation-driven rerender with a deferred first callback

Extend the colocated RNTL suite with a deferred `firstSync` and a resolved `nextSync`. Configure the mocked hook to return the first callback initially and the replacement thereafter, render the screen, wait until the first callback is in flight, rerender the same mounted screen, resolve the first callback inside `act`, and assert navigation to `/calendar`. Also assert `nextSync` was never called.

This test observes the user-visible completion contract and the once-per-mount invariant together. A simple successful sync test cannot reproduce the cleanup race, while an implementation-detail assertion against refs would not prove navigation. Changing the Maestro flow was rejected because the existing flow already exposes the failure and the unit regression can deterministically isolate its cause.

## Risks / Trade-offs

- **[A future unmount happens while async work is in flight]** → The empty-dependency cleanup clears `mountedRef`, so navigation and error state remain suppressed after real unmount.
- **[React Strict Mode replays mount effects in development]** → The existing `startedRef` continues to bound the import to once per mounted instance; the focused suite protects the dependency-rerender case.
- **[A future refactor changes callback stability again]** → The regression intentionally supplies two callback identities and verifies both completion and no restart.
- **[Native proof cannot run on this non-virtualized host]** → Local focused Jest plus TypeScript/lint/formatting provide pre-merge proof; the path-triggered `main` mobile E2E workflow after Reviewer merge remains the Android/iOS acceptance proof.
