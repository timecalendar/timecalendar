## Why

The native Feedback Maestro flow assumes the Settings row is already on-screen, but the row
is below the initial Android viewport. The exact-head B10 gate therefore times out before it
can prove the existing Feedback navigation and mail-safe empty-form validation path.

## What Changes

- Reveal `settings-feedback` with a bounded downward `scrollUntilVisible` step before the
  flow's existing visibility wait and selector tap.
- Preserve the existing post-navigation Feedback title, empty submit, and localized
  client-validation assertions unchanged.
- Add a focused static structure proof that locks the reveal-before-wait-before-tap order,
  selector, direction, timeout, and unchanged post-tap validation tail.
- Verify the YAML and focused mobile E2E harness checks locally, then require baseline plus
  Android and iOS native jobs to pass on the recovery PR's exact head before Reviewer merge.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-feedback`: make the existing mail-safe Feedback E2E proof deterministically reveal
  its below-viewport Settings entry before navigating to the form.

## Impact

- `mobile/.maestro/feedback.yaml` gains one bounded, platform-neutral scroll command; no
  application behavior or UI changes.
- Focused coverage under `mobile/e2e/` may be added or adjusted to enforce the YAML sequence
  without changing harness runtime or retry behavior.
- No sensitive surfaces are touched: API/generated contracts, migrations, native/store/EAS
  configuration, Firebase, workflows, deployment infrastructure, and legacy Flutter remain
  out of scope. No dependency, data migration, human-only step, or deploy act is introduced.
