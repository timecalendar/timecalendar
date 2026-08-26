# 6 — Adoption plan

This is the recommended sequence for a later implementation. It deliberately avoids a big-bang
move before the React Native 4.0 cutover.

## 6.1 Phase 0 — inventory and baseline

**Goal:** prove the host is suitable and quantify the current system.

1. Complete the machine readiness inventory in [document 5](./05-security-and-operations.md).
2. Capture at least ten hosted iOS and Android runs with step timings and failure classes.
3. Confirm the Mac is dedicated; otherwise stop.
4. Decide cache/disk quotas based on actual free space.
5. Confirm a hosted iOS fallback can run the same full suite at an exact SHA.

Exit: inventory recorded, fallback green, baseline available. No store credential has touched the
Mac.

## 6.2 Phase 1 — trusted iOS E2E pilot

**Goal:** obtain the largest likely speedup with the smallest blast radius.

1. Create and protect a private build-orchestration repository with tightly limited writers.
2. Register one repository-level runner there under the dedicated account; do not expose it to the
   public source repository.
3. Add only a trusted-`main`/manual-SHA iOS E2E job and a narrowly scoped dispatch/reporting seam.
4. Keep PR jobs and Android unchanged.
5. Externalize DerivedData from the generated `ios/` tree and retain downloads/toolchains.
6. Upload timing/failure evidence on every run.
7. Run a weekly clean-cache proof.
8. Pilot for two weeks or 20 full runs, whichever is later.

Go if the metrics in [document 4](./04-caching-and-performance.md) pass. Roll back routing if they do
not; the Mac remains a developer convenience, not CI infrastructure.

Sensitive future implementation surface: public and private `.github/workflows/` (CI), the scoped
dispatch identity, native app generation inputs and the mobile testing architecture. Reviewer must
verify that no public PR workflow can address the Mac.

## 6.3 Phase 2 — restore routine E2E confidence

**Goal:** make E2E fast and reliable enough that `main` always exercises it and agents can request an
exact-SHA rerun.

1. Keep `main` automatic.
2. Add the manual `ref/platform/ios_runner/suite` contract.
3. Add explicit hosted fallback and document it in failures.
4. Track failures as build, simulator, Maestro transport, assertion, backend or runner availability.
5. Fix existing assertion/transport failures; a faster red pipeline is not success.

The host has no KVM constraint that applies to the current Linux dev box; the Mac provides the
missing Apple virtualization surface. Simulator E2E still does not become a PR gate unless the
existing project policy changes separately.

## 6.4 Phase 3 — internal store delivery

**Goal:** turn a selected SHA into TestFlight-internal and Play-internal builds with an audit trail.

1. Revisit ADR 006 because its trigger—manual dogfood build friction—has occurred.
2. Design the store-distributed internal profile without changing the production identity or OTA
   fingerprint policy.
3. Add the `mobile-internal-build` workflow contract from [document 3](./03-workflow-contracts.md).
4. Build/sign on EAS, not the Mac.
5. Require normal CI for the resolved SHA.
6. Gate submission with `mobile-internal-submit`.
7. Install on one real iOS and Android device and verify the embedded SHA/version/fingerprint.

Sensitive future surfaces:

- `.github/workflows/` — CI and external submission behavior;
- `mobile/eas.json` and `mobile/app.config.ts` — native/store/EAS configuration;
- `mobile/firebase/` — identity coupling;
- store credentials and service-account material — never committed.

These are implementation concerns only; this docs issue changes none of them.

## 6.5 Phase 4 — beta and production readiness

**Goal:** use the same audited path for the 4.0 migration release.

1. Add the `beta` profile/channel previously proposed by OTA document 7.
2. Exercise internal then beta distribution from exact SHAs.
3. Rehearse hosted fallback while the Mac is intentionally unavailable.
4. Build a production candidate from a protected release tag with EAS.
5. Compare embedded identity, version and Expo fingerprint to the approved record.
6. Submit the exact build IDs after the production environment gate.
7. Keep store rollout and monitoring as separate human-owned release acts.

The Mac may run release-candidate E2E, but a Mac outage must not prevent EAS from building or
submitting a release.

## 6.6 Optional Android-on-Mac experiment

Only after the iOS pilot passes:

- install/pin the Android SDK image matching the inventoried Mac architecture;
- run the same SHA and suite on hosted Linux and the Mac;
- compare build, emulator boot, flow time, reliability and queue contention;
- keep one job at a time on the Mac;
- move Android only if total pipeline wall time improves despite losing iOS/Android parallelism.

The expected outcome is not assumed. A fast warm Gradle build can still lose to serialization.

## 6.7 Future task slices

Each implementation slice should be its own PR:

1. host inventory/hardening plus private orchestration repository and operator runbook;
2. iOS self-hosted E2E pilot, scoped dispatch/reporting seam and hosted fallback;
3. timing, cache pruning and clean-cache canary;
4. internal store profile ADR/config;
5. exact-SHA internal build and protected submit workflow;
6. beta workflow/profile;
7. production release workflow and Phase 10 rehearsal;
8. optional Android-on-Mac benchmark.

Do not mix runner security, EAS profile changes and production submission into one PR.

## 6.8 Acceptance criteria for the overall programme

- Any collaborator can request a trusted exact-SHA E2E run without SSH.
- `main` iOS E2E uses the Mac when healthy and has a documented hosted fallback.
- Warm iOS p50 improves at least 30%, with clean-cache runs remaining green.
- PR code never executes on the persistent runner.
- Store credentials never reside on the Mac or in repository caches/artifacts.
- A SHA can produce internal iOS/Android store builds through EAS and submit only after approval.
- Beta and production submit the exact approved build IDs, not rebuilt binaries.
- Mac failure does not block PR CI, signed build creation or a production release.
- Every run records SHA, versions, fingerprint, runner/build IDs and evidence.
- The process works with the current no-QA-roster policy; Reviewer plus green CI is sufficient, and
  failures route to the Applier.

## 6.9 Questions that must be answered during implementation

None blocks this recommendation. Phase 0 must resolve these facts before provisioning:

- Is the Mac dedicated, and what are its chip/RAM/disk/macOS/Xcode specifications?
- Which Xcode version is required by Expo SDK 56 at implementation time?
- What are the actual hosted p50/p90 times across at least ten runs?
- Does the repository's GitHub plan/environment configuration enforce the desired no-self-approval
  rule? (The repository is public, so GitHub documents environment protection availability.)
- Who is the named human release approver and break-glass Mac operator?
- Should the existing ad hoc `preview` profile remain, or be renamed when `internal-store` is added?

If the Mac is not dedicated, the answer changes: use GitHub-hosted/EAS only until dedicated runner
hardware exists.
