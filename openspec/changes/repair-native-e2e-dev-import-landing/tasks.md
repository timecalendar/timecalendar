## 1. Restore the e2e build's local backend

- [x] 1.1 Add `BACKEND_ENVIRONMENT_CAPABILITY: development` beside `APP_VARIANT: development` on the Android prebuild, Android release-APK, iOS prebuild, and iOS release-simulator steps of `.github/workflows/ci-mobile-e2e.yml`; change no job, trigger, runner, permission, secret, or step.
- [x] 1.2 Comment the Android build step with why the pairing is load-bearing — an unset capability parses to `production` and discards the baked URL — and cross-reference it from the iOS step.

> **1.1 is now carried by `main`, not by this change.** `4e363d6c` (#293) landed the same
> four variables on 2026-09-06 at 13:47Z, while this branch's native gate was still
> running, and additionally bakes `EXPO_PUBLIC_API_URL` on the two prebuild steps. The
> rebase therefore reduces this change's workflow diff to 1.2 — the comment alone — and
> that is deliberate: the variables are not restated, because restating them would be a
> conflict, not a fix. What this change still carries that `main` does not is the §2 guard
> that keeps those four variables from silently regressing again, and the §3 hardening.



## 2. Cover the diagnosed cause

- [x] 2.1 Add `mobile/ci-e2e-build-env.test.ts`, driving each workflow step that bakes `EXPO_PUBLIC_API_URL` through the real `parseBackendEnvironmentCapability` → `parseBackendEnvironment` → `resolveBackendApiUrl` chain and asserting the resolved URL is the baked local URL.
- [x] 2.2 Pin the extracted step **name and** URL list, so a workflow edit that matches no steps — or that shifts a step boundary and lets a release step inherit a prebuild step's capability — fails instead of passing vacuously.
- [x] 2.3 Confirm the test fails against the pre-fix workflow and passes after, so it is proven to discriminate rather than merely to pass. Run as a five-mutation matrix (drop Android capability; wrong lane; boundary drift; drop capability *and* drift; drop iOS capability), each expected red, with a green baseline either side. The fourth mutation initially stayed **green** — the URL-only guard of 2.2 let the absorbed release step borrow the prebuild step's capability, hiding the precise regression this change exists for — which is what forced the name pinning above.

## 3. Keep the migration hardening on its own merits

- [x] 3.1 Retain the single-flight `runMigrations()` and the import seam's readiness wait, with their existing focused tests.
- [x] 3.2 Remove every claim that they repair the native E2E failure, in the proposal, the design, and the change name.

## 4. Local-green verification

- [x] 4.1 Run `cd mobile && npm run lint`, `npx tsc --noEmit`, and the focused Jest suites for the new test plus the migration/import-seam suites. Lint exit 0, `tsc --noEmit` exit 0, 10 suites / 54 tests green.
- [x] 4.2 Run `openspec validate repair-native-e2e-dev-import-landing --strict` and `git diff --check`; inspect the diff for secrets, generated native output, and unrelated changes. Valid; `--check` clean; disclosure scan vs `origin/main` reports 0 findings over 13 files / 6 commits.

## 5. Exact-head native proof

- [x] 5.1 Push one commit carrying the workflow variables, the test, and the corrected OpenSpec artifacts, then trigger the native path on that exact head.
- [x] 5.2 Read the result at **flow level on both jobs** — not at job level. `activity/import-baseline.yaml` reaching Calendar on Android *and* iOS is this change's acceptance; a later flow failing for a pre-existing reason is separate work to attribute and route, not to absorb.
- [x] 5.3 Record the direct job links and exact SHA in the issue/PR evidence before Reviewer handoff.

### 5.4 Result

Acceptance is **met on both platforms**: `activity/import-baseline.yaml` and
`activity/import-newer.yaml` both report `COMPLETED`, with `Assert that "Calendar" is
visible... COMPLETED`, where every prior run died on that exact assertion.

- Android, head `bc7f7869`, run `34036833595` — baseline + newer COMPLETED.
- iOS, head `34adde2d`, run `34036157248` — baseline + newer COMPLETED.

Both heads predate the rebase onto `4e363d6c`. They are still the valid proof of the
diagnosis, because they carried exactly the four variables that `main` now carries; the
rebase removed this branch's copy of them precisely because `main` had landed the same
fix. It does **not** re-prove `main`'s own combination, which bakes the URL on the
prebuild steps as well — that is `main`'s to prove, and its gate runs on every push.

The two heads differ **only** in `mobile/ci-e2e-build-env.test.ts` and this file, so no
byte that reaches the APK, the IPA, or the native build differs between them; the iOS
proof therefore covers the app code at `bc7f7869`. That is verified, not assumed:
`git diff --name-only 34adde2d bc7f7869` returns those two paths.

The native job still reports `failure`, for two causes that are attributed away from this
change and are not absorbed into it:

1. **Activity tie-order / scroll pagination** — `activity.yaml` cannot scroll to
   `activity-new-e2e-activity-tie-higher`, identically on both platforms, ~40 assertions
   after this change's acceptance point. Added 2026-08-30 by `695e3104` (#332), *after*
   the backend-environment regression, so it has never once executed: run `33371314036`
   (main, 08-31, post-#332) died at `Assert that "Calendar" is visible... FAILED` and
   mentions `tie-higher` exactly once, as a parsed flow line. This change is what made the
   suite reach it. Routed to its own ticket.
2. **iOS XCTest startup transport flake** — the exact-head iOS job burned attempts 1 and 2
   on `retryable XCTest startup transport failure` and then failed the About flow's
   `"Privacy policy"` assertion on a degraded simulator, never reaching the Activity
   flows. The same assertion passed twice on run `34036157248` against identical app
   bytes. Infrastructure instability in the parent's territory, not a product defect here.
