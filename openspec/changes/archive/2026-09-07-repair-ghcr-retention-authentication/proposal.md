## Why

The daily GHCR retention workflow can no longer authenticate with its stored personal access
token, so stale server and web images have accumulated through repeated scheduled failures. The
repair must restore automatic cleanup without retaining an opaque long-lived credential or making
manual validation capable of deleting package versions.

## What Changes

- Give the retention job only the GitHub Packages permission required to manage package versions
  and authenticate each cleanup invocation with the repository-scoped workflow token.
- Address each linked container package by its exact name in a separate retention-action invocation,
  bypassing the organization-wide package-list operation used in personal-token mode.
- Preserve the daily schedule, the `latest` and `production` tags, and at least five versions of
  each package.
- Make every `workflow_dispatch` execution a dry run while keeping its optional, timezone-aware
  cut-off input.
- Add a deterministic repository check for the authentication, package, retention, and manual-run
  invariants, and execute that check in CI.
- Require a branch-ref manual dry run after implementation to prove that the workflow token can list
  versions of both repository-linked packages without deleting anything.

## Capabilities

### New Capabilities

- `ghcr-retention-automation`: Defines authenticated, least-privilege, deletion-safe scheduled and
  manual retention behavior for the repository's linked GHCR packages.

### Modified Capabilities

None.

## Impact

- Workflow: `.github/workflows/delete-old-images.yaml`.
- Deterministic validation: a focused check under `ci/`, wired into
  `.github/workflows/ci-build-deploy.yml` so configuration drift fails pull-request CI.
- Operator documentation: `docs/agent-dev-environment.md` records the scheduled-versus-manual
  contract and the focused local check.
- External system: GitHub Actions and the two existing GHCR packages linked to this repository.
- **Sensitive surface:** `.github/workflows/` changes package authentication and controls an
  operation that deletes old container versions. Review must scrutinize job permissions,
  third-party action inputs, dry-run enforcement, and retention exclusions.
- No OpenAPI contract, generated client, database schema, application code, mobile native/store
  configuration, legacy Flutter code, Terraform, or Kubernetes change is involved.

## Non-Goals

- Creating, printing, copying, rotating, or otherwise inspecting a credential.
- Changing image publication, deployment, promotion, or production/preproduction services.
- Rerunning the current destructive manual configuration.
- Refactoring unrelated workflows or changing the package names, visibility, or ownership.
