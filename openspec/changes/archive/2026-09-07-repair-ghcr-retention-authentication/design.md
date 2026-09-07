## Context

`.github/workflows/delete-old-images.yaml` runs every day and can also be dispatched manually. It
currently passes a stored personal access token to `snok/container-retention-policy@v2` in its
default PAT mode. In that mode the action first enumerates every container package owned by the
organization and only then filters the configured names; the failing request is that organization
package-list operation.

The action's `github-token` mode deliberately skips package enumeration and calls the package-version
endpoint for one exact image name. Its documented configuration limits each invocation to one image.
The repository owns two public, repository-linked packages, and one package name differs from the
repository name. GitHub permits a workflow token to delete versions of a granular-permission package
when the workflow repository has package-admin access, but the action's v2 documentation describes
only the same-name case. A real dry run on the branch is therefore a required compatibility proof,
not an assumption made by this design.

This is repository automation, not mobile architecture. The React Native Architecture Book and ADR
log remain unchanged; the executable invariant and the agent handbook are the appropriate records.

## Goals / Non-Goals

**Goals:**

- Remove the long-lived PAT dependency when the repository-scoped workflow token can administer both
  linked packages.
- Avoid organization package enumeration and address both packages through exact version-list calls.
- Keep scheduled cleanup destructive under the existing retention policy while making all manual
  dispatches non-destructive.
- Turn the security and retention configuration into a CI-enforced contract.
- Prove both package-version listings authenticate on the final branch head before review.

**Non-Goals:**

- Changing which images are published, how they are deployed, or how tags are promoted.
- Deleting any package version during validation.
- Changing package ownership, names, visibility, or access unless the workflow-token proof exposes a
  missing package-admin grant.
- Inspecting, printing, copying, rotating, or provisioning credentials as part of repository work.
- Upgrading or otherwise refactoring the third-party retention action without evidence that the
  focused repair requires it.

## Decisions

### Decision 1 — Use one exact-name `github-token` invocation per package

The job declares `permissions: packages: write` and no broader repository permission. Each existing
package gets its own `snok/container-retention-policy@v2` step with an exact `image-names` value,
`token: ${{ github.token }}`, and `token-type: github-token`. Both retain `account-type: org` and the
organization name because v2 still constructs organization package-version URLs in this mode.

This configuration skips the failing organization package-list endpoint in v2 and goes directly to
the version-list endpoint for each named package. Separating the invocations satisfies the action's
single-image validation and makes a failure identify the inaccessible package. `packages: write` is
the narrow workflow permission GitHub Actions exposes for package management; deletion additionally
depends on this repository having admin access in each package's Actions access settings.

Alternatives considered:

- Keep the PAT and replace or rotate its value. Rejected because it preserves an opaque long-lived
  credential and the organization-wide enumeration path that is currently failing.
- Pass both names to one `github-token` invocation. Rejected because v2 explicitly refuses more than
  one image in that mode.
- Replace the action with bespoke REST calls. Rejected because it would reimplement tag filtering,
  age selection, and minimum retention in a security-sensitive destructive workflow.
- Upgrade the action as part of the repair. Rejected as unnecessary scope unless implementation
  evidence shows v2 cannot satisfy the contract.

### Decision 2 — Derive dry-run from the event, never from a manual input

Both action invocations set `dry-run` from `github.event_name == 'workflow_dispatch'`. A scheduled
event therefore applies deletion, while every manual dispatch only reports candidates. The existing
optional cut-off input remains and continues to fall back to `1 week ago UTC` when absent.

There is deliberately no user-selectable destructive boolean. This makes a branch-ref proof and any
future manual diagnosis safe by construction, including an accidental dispatch with an aggressive
cut-off.

Alternative considered: add a `dry-run` checkbox defaulting to true. Rejected because a caller could
turn it off and make manual validation destructive.

### Decision 3 — Keep each package's retention invariants explicit

Each step declares `keep-at-least: 5` and `skip-tags: latest, production`. The values are repeated
instead of hidden behind an expression or generated matrix so review logs name each package and the
focused check can prove both steps carry the same protections. The schedule remains `0 0 * * *`.

A matrix was considered, but explicit steps make the differently named package and its independent
authentication result visible in both configuration and run logs.

### Decision 4 — Add a focused, dependency-free configuration contract to baseline CI

A small executable check under `ci/` reads the workflow and fails unless all of these properties are
present together: daily schedule, retained cut-off input/fallback, job-level package permission,
absence of the PAT secret reference, two exact package steps, workflow-token mode, event-derived
manual dry-run, five-version floor, and both protected tags. The check also fails on extra retention
invocations so a partially protected third step cannot slip through.

The existing always-on `ci-build-deploy.yml` baseline gains a small job or step that runs this check.
The checker stays dependency-free and scopes its assertions to YAML structure/blocks rather than
accepting matching words from comments. This is the R-1 executable enforcement layer; the handbook
only points to it and explains the operator-visible contract.

Alternative considered: documentation alone. Rejected because it would not prevent the next token,
dry-run, or retention edit from silently restoring the failure mode.

### Decision 5 — A final-head branch dry run is the compatibility gate

After implementation and local validation, dispatch `delete-old-images.yaml` against the branch ref
with an explicit timezone-aware cut-off and confirm both package-specific action steps succeed. Since
all manual dispatches are forced to dry-run, the proof may list candidates but cannot delete them.
Record the workflow run URL, branch head SHA, conclusion, and the fact that both package steps reached
successful version-list processing; do not copy token values or sensitive request headers.

If the differently named package returns an authorization failure, stop the pipeline rather than
claiming the undocumented combination works. The first unblock action is for an organization package
administrator to grant this repository `admin` Actions access to that package. If organization policy
does not permit workflow-token administration, the fallback is a classic personal access token stored
as a dedicated Actions secret, limited to `read:packages` and `delete:packages` and to an identity with
admin access to both packages. That fallback requires an updated design and another safe dry-run; it is
not silently introduced during apply.

## Risks / Trade-offs

- **The linked, differently named package does not grant this repository admin access** → Require the
  branch dry run to pass both explicit steps; otherwise block with the exact package-access action.
- **A future edit makes manual runs destructive** → Derive `dry-run` solely from the event name and
  enforce that exact contract in the focused CI check.
- **Retention safeguards drift between the two steps** → Assert the five-version floor and protected
  tags inside each package block, not only once per file.
- **A textual checker passes on comments or the wrong block** → Parse bounded job/step blocks and
  assert exact invocation count and forbidden references; include self-tests/negative fixtures if the
  implementation needs nontrivial parsing.
- **The third-party major tag changes upstream** → Keep this repair on the existing version to limit
  scope; dependency automation and review remain responsible for action upgrades.
- **Scheduled cleanup resumes before proof is complete** → The branch does not affect the active
  default-branch schedule until merge; never manually run the current default-branch configuration.

## Migration Plan

1. Add the focused configuration check first and demonstrate that it rejects the current PAT-mode
   workflow.
2. Update the retention workflow to the two-step repository-token design and wire the focused check
   into baseline CI.
3. Update the agent handbook with the current scheduled/manual behavior and validation command; record
   the Architecture Book assessment as not applicable.
4. Run the focused check, workflow syntax/input validation, OpenSpec validation, and repository
   disclosure preflight.
5. Push the final implementation head, obtain green exact-head CI, then perform one branch-ref manual
   dry run and verify both package steps authenticate without deletion.
6. Hand the proven head to review. Merge activates the repaired daily schedule; no application deploy
   or service mutation is part of this change.

Rollback is a repository revert. Reverting restores the known-broken scheduled workflow and is safer
than introducing an unproven credential fallback, but it also stops effective retention; any rollback
must be followed by a new scoped repair.

## Open Questions

None before implementation. The differently named package's workflow-token access is intentionally
resolved by the mandatory branch dry run, with the failure path fixed above.
