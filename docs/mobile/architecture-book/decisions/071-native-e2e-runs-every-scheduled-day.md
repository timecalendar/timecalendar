# 071 — Native E2E runs both platforms on every scheduled day

## Status

Accepted. Supersedes the conditional schedule and the previous-attempt boundary of
[ADR 055](./055-native-e2e-daily-health-signal.md); the rest of 055 stands.

## Context

ADR 055 ran a scheduled attempt only when a relevant path changed since the preceding scheduled
attempt. A quiet day skipped every platform job and the run concluded success. From 2026-09-13
to 2026-10-26 the lane failed on every run that executed, while the Actions history showed
mostly green runs: a failing lane was re-run only when a relevant path changed, and every day in
between reported success without running anything. A health signal that can go green without
executing is not a health signal.

## Decision

Every scheduled and manual run of `.github/workflows/ci-mobile-e2e.yml` resolves one immutable
target commit, builds the server image, and runs Android and iOS against it. No job carries a
condition, no step carries a condition other than `if: failure()` on diagnostics upload, and
nothing uses `continue-on-error`, so a run's conclusion is the lane's state.
`mobile/e2e/test_ci_mobile_e2e.sh` enforces this with mutations: a re-added job condition, a
schedule-only skip, a step condition, `continue-on-error`, or a `should_run` output fails it.

Alternatives rejected:

- **Keep the skip, report it as neutral, and fail when the last executed run failed.** A job
  cannot set a workflow conclusion to neutral or skipped; that needs a check run written with
  `checks: write`, the write scope ADR 055 rejected. Reading the last executed run's conclusion
  adds Actions API logic and still shows a red run that executed nothing.
- **Skip only the server-image build.** It rebuilds from the gha cache in about a minute; a split
  condition is more surface for the same honesty question.
- **A last-success boundary.** It still skips on green and keeps the decision logic; the repeated
  native allocation it avoided is the intent here.

## Consequences

One Android and one iOS run every day. The repository is public, so hosted Linux and macOS
minutes are free. Infrastructure flakes (iOS driver start, Android `:app:packageRelease`) surface
every day instead of hiding behind skipped runs; the iOS driver retry stays, and the Android flake
is re-run once before it is treated as a regression. `actions: read` stays in the permissions
block without a consumer; removing it is a separate change.

## Revisit if

The repository becomes private and native runner minutes cost money, or native E2E becomes a
pull-request gate.
