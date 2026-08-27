## Why

PR #273 is fully implemented and previously approved, but current `main` independently added
ADR 041 and now conflicts with the PR's source-recovery ADR and decisions index. The same PR
must absorb current `main` without losing either accepted decision or either additive API
contract change, then earn fresh exact-head CI and review evidence.

## What Changes

- Integrate current `main` into the existing PR #273 branch; do not create a replacement branch
  or PR and do not change product behavior.
- Preserve main's `041-school-logo-theme-variants.md` and renumber the source-recovery ADR from
  041 to the next unique number, 042 at the integration base.
- Reconcile the Architecture Book decisions index and update every source-recovery ADR link and
  heading, including `calendar.md` and the physical-device inbox note. Update the Architecture
  Book changelog only if an existing rule reference there also names the old number.
- Preserve both additive OpenAPI/generated-client changes: main's nullable dark school-logo
  fields and PR #273's source-health contract. Regenerate or run drift checks rather than
  hand-editing generated output.
- Re-run diff hygiene, strict OpenSpec validation, and the smallest relevant contract checks;
  retain the `run-e2e` label and require all six scheduled checks, including Android and iOS
  native E2E, to pass on the conflict-resolution head before fresh Simplifier and Reviewer
  handoffs.

## Capabilities

### New Capabilities

- `same-pr-conflict-remediation`: One-off repository-state requirements that preserve the
  existing PR identity, both accepted ADRs, both additive generated contracts, and fresh
  exact-head gates. This operational delta is archived with `--skip-specs` because it is not a
  reusable product capability.

### Modified Capabilities

None. The canonical source-health and school-logo requirements remain unchanged.

## Impact

- Binding documentation: `docs/mobile/architecture-book/decisions/`,
  `docs/mobile/architecture-book/calendar.md`, and the stale-source device-check inbox note.
- Existing sensitive contract surfaces carried by the integrated PR:
  `openapi/openapi.json` and `mobile/src/api/generated/`. Both additions must survive, and the
  generated client remains generated rather than hand-edited.
- Existing PR #273 and its current branch only; its title, `run-e2e` label, implementation,
  tests, and Tier H human squash-merge route remain in place.
- No server migration, native/store configuration, credential, infrastructure, workflow,
  deploy, production-data, or legacy Flutter change is in scope.
