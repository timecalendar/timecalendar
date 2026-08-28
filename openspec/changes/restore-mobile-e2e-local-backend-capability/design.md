## Context

The backend-environment selector introduced a dedicated `BACKEND_ENVIRONMENT_CAPABILITY` build input. `app.config.ts` normalizes only `development`, `preview`, and `production`; absent or malformed input deliberately resolves to `production`, independently of `APP_VARIANT`, OTA metadata, Firebase configuration, and the compiled API URL.

The native E2E workflow predates that boundary. Its Android and iOS prebuild steps set only `APP_VARIANT=development`, while their release compilation steps set the development variant plus a platform-local `EXPO_PUBLIC_API_URL`. A CI-shaped config resolution therefore produces `appVariant=development` but `backendEnvironmentCapability=production`, so the runtime cannot select `local` and the seeded import fails before later B10 flows run. The existing `mobile/e2e/test_ci_mobile_e2e.sh` proof checks toolchain, retry, and artifact invariants but does not inspect this build contract.

The workflow is a sensitive CI surface. The change must recover the local seeded-server path on both platforms without weakening the production fail-closed behavior or changing application/runtime selection code.

## Goals / Non-Goals

**Goals:**

- Make each Android and iOS native E2E prebuild and release-compilation step resolve development identity, development backend capability, and the platform-correct local API URL.
- Add a focused, locally runnable structure proof that fails if any of those four build steps loses or misstates one member of the contract.
- Keep the Architecture Book, E2E operator README, and agent handbook aligned with the executable contract.
- Require baseline checks and both native jobs to pass on the recovery PR's exact head, with direct run/job links recorded in the handoff.

**Non-Goals:**

- Change `app.config.ts`, the selector, endpoint allowlist, persisted environment behavior, UI, retry classification, Maestro flow order, or server lifecycle.
- Change OpenAPI/generated clients, server schema or migrations, native/store configuration, EAS profiles, Firebase files, deployments, infrastructure, or legacy Flutter.
- Re-run a terminal native failure without a material workflow fix, add a separate QA gate, or modify the parent feature PR.

## Decisions

## Decision 1: Declare the complete backend contract on every native build step

The Android prebuild, Android Gradle release assembly, iOS prebuild, and iOS Xcode Release build will each declare all three inputs explicitly:

| Platform | Identity                  | Capability                                   | Local URL                                   |
| -------- | ------------------------- | -------------------------------------------- | ------------------------------------------- |
| Android  | `APP_VARIANT=development` | `BACKEND_ENVIRONMENT_CAPABILITY=development` | `EXPO_PUBLIC_API_URL=http://10.0.2.2:3005`  |
| iOS      | `APP_VARIANT=development` | `BACKEND_ENVIRONMENT_CAPABILITY=development` | `EXPO_PUBLIC_API_URL=http://localhost:3005` |

Keeping the values on the named prebuild/build steps makes every config evaluation and bundle compilation self-contained and reviewable. The capability is not inferred from the development identity, scheme, URL, or CI context. Existing Gradle bounds, Xcode invocation, native identities, and artifact locations remain unchanged.

Alternatives rejected:

- Infer capability from `APP_VARIANT`: this weakens the independent security boundary and contradicts the fail-closed selector design.
- Change the missing-value default to development: malformed production builds could become non-production-capable.
- Set only the final bundle steps: `expo prebuild` also evaluates app config and must generate native development configuration from the same declared inputs.
- Put the values at workflow or repository scope: this unnecessarily exposes build-only inputs to unrelated steps and makes platform ownership less obvious.

## Decision 2: Prove named step environments, not global string counts

`mobile/e2e/test_ci_mobile_e2e.sh` will retain its existing invariants and add a helper that isolates each of the four named workflow step blocks. For each block it will assert exactly one development identity, exactly one development backend capability, and exactly one expected platform URL. It will also reject the opposite platform URL in that block.

This focused shell proof remains dependency-light and runs in both native jobs before device execution. Step-scoped assertions prevent a duplicated value in one job from compensating for an omission in another, which a workflow-wide occurrence count would miss.

Alternatives rejected:

- Rely only on `app.config.test.ts`: it proves parsing and fail-closed semantics, not that GitHub Actions supplies the inputs.
- Check only total string counts: counts do not establish co-location or platform correctness.
- Add a general workflow parser dependency: the four fixed step contracts are small enough for the existing shell proof, and a new parser would broaden this recovery change.

## Decision 3: Update the existing testing rule without a new ADR

`docs/mobile/architecture-book/testing.md`, its changelog, `mobile/e2e/README.md`, and `docs/agent-dev-environment.md` will state that release-config native E2E builds require the explicit capability in addition to the variant and platform URL. Local build examples will include all three inputs.

This is a correction to an existing CI wiring contract, not a costly-to-reverse architectural decision, so no new ADR is warranted. ADR 038's process-per-flow lifecycle and terminal-failure rule remain unchanged.

## Decision 4: Treat exact-head native CI as required recovery evidence

After the implementation is pushed, the recovery PR will receive its normal baseline gate plus the `run-e2e` native workflow. Both named Android and iOS jobs must pass on the same exact commit that is reviewed; seeded calendar import through the real local server is part of that unmodified flow set. The handoff records the commit SHA and direct run/job links. A native failure is terminal under ADR 038 unless a material new fix justifies another run.

No separate QA stage is added because the issue explicitly assigns the exact-head CI evidence to the normal apply/review pipeline and the Reviewer owns autonomous merge after green preflight.

## Risks / Trade-offs

- [One platform or phase drifts later] → Step-scoped assertions cover all four build steps and both exact URLs.
- [Duplicated environment declarations require maintenance] → The duplication is intentionally bounded to four sensitive steps and makes each config evaluation self-contained; the proof keeps them synchronized.
- [A malformed production build becomes development-capable] → Leave all parser/runtime defaults untouched and change only the development-only E2E workflow.
- [Static proof passes while native routing still fails] → Require both native jobs on the recovery PR's exact head, including the real seeded import flow.
- [CI retry masks the import regression] → Preserve ADR 038 unchanged: assertion/application/unknown failures are terminal and only classified XCTest startup transport failures may retry.

## Migration Plan

1. Add the three explicit build inputs to the four named workflow steps and extend the focused step-scoped shell proof.
2. Update testing/operator guidance and the Architecture Book changelog; no human-only inbox note is needed.
3. Run shell syntax/proof, workflow/config formatting, resolved Expo config checks for both platform contracts, OpenSpec validation, and the applicable baseline checks.
4. Push the implementation and run baseline plus Android and iOS native jobs on one exact PR head. Record the SHA and direct run/job links before review handoff.
5. Rollback is a normal revert of the workflow, proof, and documentation changes. It restores the known broken E2E routing but does not migrate data or alter production behavior.

## Open Questions

None.
