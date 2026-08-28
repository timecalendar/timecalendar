## Context

PR #273 remains the same open, non-draft PR on the required branch at exact pushed head
`abf0fa85f30f714eab4531eb87149053e06a093f`; GitHub reports it mergeable and the `run-e2e`
label remains attached. The prior Apply durably added exactly four development backend-capability
entries to the native workflow. The resulting exact implementation head `c1fc390` proved the
calendar import on both platforms, then both native jobs failed in the shared
`environment-switch.yaml` flow: the local marker and Settings tap completed, but the existing
`extendedWaitUntil` timed out because `id: "settings-environment"` was below the visible viewport.

The selector, Settings screen, confirmation flow, reset behavior, and final marker are already the
accepted product/E2E contract. The required remediation is therefore a leaf-level Maestro
driveability fix, not a product layout or architectural change. The current exact-head CI run is
not sufficient to change that scope: any implementation commit will require fresh proof.

## Goals / Non-Goals

**Goals:**

- Reveal the existing environment control on both native viewports with one bounded Maestro scroll.
- Keep the existing wait as a separate post-scroll readiness assertion and preserve every later
  interaction and assertion.
- Limit Apply to one YAML command, then prove the exact shape and unchanged surrounding scope
  before fresh exact-head CI.

**Non-Goals:**

- Changing the Settings screen, control placement, accessibility identifier, environment behavior,
  reset logic, native configuration, or any application source.
- Replacing or weakening the existing wait, selector, taps, confirmation, or final marker
  assertion; changing another Maestro flow or the harness is also excluded.
- Changing the four workflow capability entries or any workflow trigger, permission, runner,
  command, URL, assertion, or artifact behavior.
- Changing Architecture Book rules/ADRs, contracts/generated clients, migrations, secrets,
  Firebase/EAS/store config, infrastructure, deploy behavior, legacy Flutter, or dependencies.
- Rebasing, force-pushing, opening another PR, merging during Apply, adding QA, or performing a
  deploy act.

## Decisions

## Decision 1 — Insert one bounded selector-driven scroll at the failure boundary

The Applier will insert exactly this command immediately after `tapOn: "Settings"` and immediately
before the existing environment-control wait:

```yaml
- scrollUntilVisible:
    element:
      id: "settings-environment"
    direction: DOWN
    timeout: 60000
```

The stable accessibility id targets the accepted control rather than viewport coordinates or
visible copy, `DOWN` matches the control's position below the initial Settings viewport, and the
60-second bound matches the existing readiness wait. The command shape also follows the repository's
established `home.yaml` pattern.

Broad `scroll`, coordinate gestures, text selectors, shorter implicit waits, and product-layout
changes are rejected because they are less deterministic or broaden a leaf-level E2E remediation.

## Decision 2 — Scroll reveals; the existing wait still proves readiness

The existing `extendedWaitUntil` for `id: "settings-environment"` remains immediately after the new
scroll and remains configured with `timeout: 60000`. The subsequent id-based tap, `Preproduction`
tap, confirmation assertion/tap, and final `TEST ENVIRONMENT · Preproduction` wait remain unchanged.

Replacing the wait with the scroll is rejected because scrolling to a target and explicitly proving
that the target is ready are distinct responsibilities. Altering later selectors or assertions is
rejected because both native failures occur before those steps and provide no authority to weaken
them.

## Decision 3 — Treat this as a one-file operational delta, not an architecture change

Apply may change only `mobile/.maestro/environment-switch.yaml` outside this OpenSpec lifecycle.
Every other Maestro flow, application file, Architecture Book page, and sensitive surface remains
unchanged. In particular, `.github/workflows/ci-mobile-e2e.yml` must retain exactly the four existing
`BACKEND_ENVIRONMENT_CAPABILITY: development` entries from the prior remediation.

A new ADR, Architecture Book rewrite, product workaround, workflow edit, or human inbox note is
rejected: the accepted cross-platform Settings proof already exists, and this change only makes its
existing target visible to Maestro.

## Decision 4 — Use static scope proof locally and fresh native CI for behavior proof

Focused local verification will parse the YAML and assert exactly one `scrollUntilVisible`, its
exact selector/direction/timeout, and its position between the Settings tap and unchanged wait. A
complete diff check will prove no other Maestro command, flow, workflow capability entry, or
protected surface changed. Formatting, `git diff --check`, strict change validation, and strict
all-change validation are required.

The KVM-less host cannot substitute for Android/iOS device proof. After Apply archives this one-off
change with `--skip-specs`, commits, and pushes without force, fresh baseline plus both native E2E
jobs must pass on the new exact head before Simplifier and Reviewer proceed. Old-head runs cannot
authorize merge.

## Risks / Trade-offs

- **[The scroll masks a missing control]** → Keep the separate id-based `extendedWaitUntil` and all
  later assertions unchanged.
- **[The command drifts from the authorized shape]** → Assert exact count, selector, direction,
  timeout, and neighboring commands in a focused YAML check.
- **[A one-line repair expands into product or workflow changes]** → Restrict the implementation
  diff to one command in one flow and explicitly protect the four existing workflow entries.
- **[One platform remains viewport-sensitive]** → Use selector-driven `scrollUntilVisible` in the
  shared flow and require fresh Android and iOS exact-head jobs.
- **[Old-head green evidence is reused]** → Record the final pushed SHA and accept only checks,
  Simplifier, and Reviewer evidence matching it exactly.

## Migration Plan

1. Reconfirm the same PR, branch, exact head, `run-e2e`, target flow, and four workflow capability
   entries before editing.
2. Insert the single authorized scroll command without changing its neighboring wait or later flow.
3. Run focused YAML/scope checks and strict OpenSpec validation; archive the one-off capability with
   `--skip-specs` and run strict all-change validation.
4. Commit and push without force to the existing branch and PR, then require fresh exact-head
   baseline, Android, and iOS evidence before handing to Simplifier.
5. Continue the same issue through Simplifier and Reviewer; autonomous squash merge remains gated on
   a clean exact-head Reviewer verdict.

Rollback is a normal revert of the one-command Maestro change on the same PR. There is no user-data,
schema, API, native-config, or deploy migration.

## Open Questions

None at exact head `abf0fa85f30f714eab4531eb87149053e06a093f`.
