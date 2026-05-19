## Why

The onboarding E2E smoke flow (`integration_test/onboarding_flow_test.dart`) is
the designated Phase 2 regression gate, but it fails intermittently in CI with
`Failed host lookup: 'timecalendar-test.example.com'`. The root cause is a real
app defect, not just an emulator flake:

- The E2E backend serves schools whose logo URLs are built from
  `S3_PUBLIC_BUCKET_CLIENT_URL` (`server/src/config/environments/test.ts`) =
  `https://timecalendar-test.example.com` — a deliberately non-resolvable host.
- `app/lib/modules/school/screens/school_selection/school_item.dart` renders
  each logo with `FadeInImage(image: CachedNetworkImageProvider(...))` and **no
  `imageErrorBuilder`**. A failed image load surfaces as a reported
  `FlutterError`, which fails `testWidgets`.
- Whether a run passes depends on how the emulator surfaces the unresolvable
  host (fast `NXDOMAIN` vs. slow/no-network hang) → nondeterministic.

This blinds the regression gate: every B-task review currently has to
hand-wave the failure as a "pre-existing flake".

## What Changes

- **App production fix** — `SchoolItem`'s `FadeInImage` gains an
  `imageErrorBuilder` so a failed school-logo load degrades gracefully to the
  `assets/images/school.png` placeholder instead of throwing/reporting a
  `FlutterError`. A missing logo must never break the SelectSchool screen.
- **E2E determinism** — `S3_PUBLIC_BUCKET_CLIENT_URL` in the `test` environment
  is changed to a loopback URL so seeded school logo URLs resolve without any
  outbound DNS. The onboarding flow no longer depends on emulator DNS
  behaviour.
- **Widget-test coverage** — a `SchoolItem` widget test pins the error path:
  the `imageErrorBuilder` is present and returns the placeholder. The shared
  `buildSchoolForList` fixture gains an overridable `imageUrl`.

Non-goals: replacing `FadeInImage`/`CachedNetworkImageProvider` with
`CachedNetworkImage`, CI E2E job speed (TIM-34), any other school-screen
behaviour.

## Capabilities

### Modified Capabilities
- `e2e-smoke-flows`: the onboarding-and-add-school smoke flow is tightened to
  be deterministic — it must not depend on outbound DNS, and a failed
  school-logo load must degrade to a placeholder rather than fail the test.

## Impact

- `app/lib/modules/school/screens/school_selection/school_item.dart` — adds
  `imageErrorBuilder`; production behaviour for a missing logo.
- `server/src/config/environments/test.ts` — `S3_PUBLIC_BUCKET_CLIENT_URL`
  changed to a non-DNS loopback URL (test env only).
- `app/test/support/fixtures.dart` — `buildSchoolForList` gains an `imageUrl`
  parameter.
- `app/test/modules/school/screens/school_selection/school_item_test.dart` —
  new widget test for the error path.
- No CI changes; `onboarding_flow_test.dart` is unchanged (it becomes
  deterministic by virtue of the two fixes above).
