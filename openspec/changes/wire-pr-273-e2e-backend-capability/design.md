## Context

PR #273 remains the same open, non-draft PR on the required branch at exact pushed head
`22192efb5752e407634c2df7b783a55f778a483a`; GitHub reports it mergeable and the `run-e2e`
label remains attached. Five non-native jobs pass. Both native jobs fail deterministically when
the calendar-family flows import the seeded token because the compiled application behaves as
production-locked and therefore cannot use the harness's local backend.

ADR 043 deliberately separates backend authorization from `APP_VARIANT`, identity, Firebase,
OTA metadata, and API URL. The workflow correctly sets the development identity during each
platform's Expo prebuild and release bundle/build and correctly bakes the platform-local
`EXPO_PUBLIC_API_URL` during the latter step, but it never supplies
`BACKEND_ENVIRONMENT_CAPABILITY`. Focused `expo config --json --type public` evidence resolves
`extra.backendEnvironmentCapability=production` in the current workflow environment and
`development` when the explicit variable is added. Because shell-step environments do not carry
across steps, each relevant invocation needs the value.

The fifth integration cycle is already archived and remains immutable. This new active change is
only the post-integration CI capability remediation; it adds no product or architectural decision.

## Goals / Non-Goals

**Goals:**

- Make Android and iOS native E2E build the existing release-config development app with ADR
  043's explicit `development` backend capability at both native generation and JavaScript
  bundle/build time.
- Preserve development identity, platform-local API URLs, production-safe fallback, every
  source-recovery assertion, and all other workflow behavior.
- Provide focused static/config proof plus fresh exact-head scheduled native proof before the
  existing autonomous merge pipeline continues.

**Non-Goals:**

- Changing `mobile/app.config.ts`, its parser, its missing/malformed → production fallback, the
  environment selector, runtime/product logic, E2E flows/assertions, or local API URLs.
- Changing workflow triggers, permissions, jobs, runners, actions, timeouts, native tooling,
  server lifecycle, failure artifacts, or the `run-e2e` label.
- Changing ADR 043 or ADR 044, Architecture Book substance, OpenAPI/generated contracts,
  migrations, secrets/certificates, Firebase config, infrastructure, deploy behavior, production
  data, dependencies, background operations, or legacy Flutter.
- Rebasing, force-pushing, opening another PR, merging during Apply, adding a separate QA gate, or
  performing any deploy/build-distribution/OTA operation.

## Decisions

## Decision 1 — Set the capability only in the four existing native build environments

The Applier will add `BACKEND_ENVIRONMENT_CAPABILITY: development` beside the existing
`APP_VARIANT: development` entry in exactly these step-local environments:

1. Android `Prebuild Android (dev variant)`.
2. Android `Build release APK`.
3. iOS `Prebuild iOS (dev variant)`.
4. iOS `Build Release simulator app`.

Prebuild must receive the capability so generated native configuration reflects the development
contract. The release Gradle/Xcode invocation must receive it separately because Expo evaluates
app config while embedding the JavaScript bundle and GitHub Actions does not persist a prior
step's `env` into later steps.

Job-level or workflow-level environment wiring is rejected because it would expose the capability
to unrelated steps and broaden the sensitive diff. Supplying it only during prebuild is rejected
because the embedded JavaScript can still resolve a different value; supplying it only during
release build is rejected because generated native config and bundled runtime config could
disagree.

## Decision 2 — Preserve the independent production fallback and local URL contract

`APP_VARIANT` remains an identity/native-exception input and `EXPO_PUBLIC_API_URL` remains the
platform-specific local endpoint input. Neither is allowed to infer or replace the independent
capability. `mobile/app.config.ts` remains byte-for-byte unchanged by Apply, including the rule
that missing, malformed, and unknown `BACKEND_ENVIRONMENT_CAPABILITY` values resolve production.

Changing the parser/default, coupling capability to `APP_VARIANT`, or changing either local URL
is rejected because it would weaken ADR 043's fail-closed boundary or expand product behavior to
repair a CI-only omission.

## Decision 3 — Treat the Architecture Book as already authoritative

ADR 043 already requires an explicit independent capability and defines the production-safe
fallback. ADR 044 independently owns source recovery. This remediation changes neither decision
nor the current architectural rule, so Apply will perform an Architecture Book reconciliation
check and leave `docs/mobile/architecture-book/` unchanged in substance rather than inventing a
new ADR or revising existing decision text. The PR body and handoff will still flag the sensitive
workflow surface and the preserved ADR identities.

A new ADR or topical rule rewrite is rejected because the omission is workflow wiring under an
accepted decision, not a new costly-to-reverse choice.

## Decision 4 — Verify the exact wiring locally and require native CI as the proof test

Focused local verification will parse the workflow and assert exactly four development-capability
entries, each scoped to one of the four named build steps that already has the development
variant. It will also run the existing workflow invariant test and the focused app-config suite,
including explicit development resolution and absent/malformed production fallback. Diff checks
will prove no other workflow field or protected surface changed.

The definitive CI proof is a fresh exact-head labelled run in which both Android and iOS native
E2E jobs pass the unchanged calendar import and source-recovery assertions. Previous-head native
or review evidence cannot authorize merge. Fresh baseline checks, Simplifier, and Reviewer are
also required before Reviewer may use the existing autonomous squash-merge grant.

Adding or weakening Maestro assertions is rejected: the deterministic failure is valuable proof
that the wrong capability reached the compiled app. A local native run is not substituted because
this host cannot provide the required Android KVM or iOS simulator environment.

## Decision 5 — Archive as a one-off operational delta on the same PR

After the implementation checklist and local validation are complete, Apply will archive the
change with
`openspec archive wire-pr-273-e2e-backend-capability --skip-specs -y` and run strict all-change
validation. No canonical `same-pr-native-e2e-capability-remediation` capability may remain.

The commits will be pushed without force to the existing PR branch. Apply will not open or merge
a PR. This preserves the established one-issue/one-branch/one-PR history and lets subsequent
Simplifier and Reviewer gates evaluate the exact implemented head.

## Risks / Trade-offs

- **[One build phase still compiles production capability]** → Assert all four named step-local
  environments and require both native jobs to pass the unchanged import flow.
- **[A broad YAML edit changes CI behavior]** → Limit the authored workflow diff to four identical
  key/value additions and compare triggers, permissions, runners, commands, URLs, and assertions
  before handoff.
- **[The safety fallback is accidentally weakened]** → Keep `mobile/app.config.ts` unchanged and
  rerun its focused absent/malformed capability tests.
- **[Old-head green evidence is reused]** → Record the final pushed SHA and accept only checks,
  Simplifier, and Reviewer evidence whose head matches it exactly.
- **[Main advances before merge]** → Preserve the normal-merge/no-force rule and current ADR
  043/044 identities; return to Founding Engineering if a new conflict exceeds this design.

## Migration Plan

1. Reconfirm PR #273's identity, exact head, `run-e2e`, and current-main ancestry before editing.
2. Add the explicit development capability to exactly the four scoped native build environments.
3. Run focused workflow/config proofs, Architecture Book reconciliation, diff hygiene, and strict
   OpenSpec validation; archive the one-off change with `--skip-specs`.
4. Commit and push without force to the same branch, update the existing PR body, and obtain fresh
   exact-head baseline plus Android/iOS native E2E evidence.
5. Continue the same issue through fresh Simplifier and Reviewer passes; Reviewer may squash-merge
   only after all gates pass.

Rollback is a normal revert of the workflow-wiring commit on the same PR. There is no data,
schema, deploy, or user-state migration.

## Open Questions

None at exact head `22192efb5752e407634c2df7b783a55f778a483a` and `origin/main`
`cbec6d1badeaf75bce5a84e0b66c2e31da9f4d39`.
