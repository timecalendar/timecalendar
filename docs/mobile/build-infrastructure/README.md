# Mobile build infrastructure

> [!NOTE]
> **This folder is exploration, not rules.** It records how a decision was reached and is not
> maintained against the shipped configuration. The binding rules live in the Architecture Book's
> [EAS / distribution](../architecture-book/eas.md) page and its ADRs; the operator steps live in
> [`docs/mobile/releases/`](../releases/README.md). Where this folder disagrees with those, they win.
>
> Superseded here by ADR [040](../architecture-book/decisions/040-local-store-builds-and-store-preview.md)
> (2026-08-26): `eas build --local` on the macOS host is the build path (this pack rejected local builds on cache/secret grounds that do not apply to manual store builds); the proposed `internal-store` profile is dropped in favour of making `preview` store-distributed; release selection is by annotated tag, not a `production` branch.

- **Status:** recommendation for [TIM-212](/TIM/issues/TIM-212)
- **Written:** 2026-08-26
- **Roadmap:** React Native migration, Phase 10 — parity, cutover and release
  **Scope:** documentation only; no runner, workflow, credential, store or app change is made here

This pack answers one question: **should TimeCalendar build on the always-on Mac Mini or stay
on hosted CI?**

The answer is **both, with different responsibilities**:

- **GitHub Actions is the control plane**: the public source repository keeps ordinary CI and a
  small private orchestration repository owns the Mac runner, triggers, permissions, logs and
  concurrency for persistent-host jobs.
- **The Mac Mini is a trusted execution worker** for iOS simulator builds and Maestro runs from
  trusted commits. It is not available to pull-request code and is not the only way to run E2E.
- **EAS remains the signed distribution path**: EAS Build creates the binaries, EAS Submit uploads
  internal and production builds, and the EAS Workflows `testflight` job handles external-beta
  groups and Beta App Review. Store credentials do not live on the Mac Mini.
- **GitHub-hosted runners remain the fallback** and continue to run ordinary PR checks and the
  Android job until a measured pilot proves moving Android is worthwhile.

That is a hybrid design, not a migration away from GitHub Actions.

## Reading order

| #   | Document                                                   | What it answers                                                                    |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | [Decision](./01-decision.md)                               | Why hybrid wins, and where the recommendation pushes back                          |
| 2   | [Target architecture](./02-target-architecture.md)         | Trust boundaries, workload placement and commit identity                           |
| 3   | [Workflow contracts](./03-workflow-contracts.md)           | Exact inputs, outputs and gates for E2E and store builds                           |
| 4   | [Caching and performance](./04-caching-and-performance.md) | What persists, what must never persist, and how to measure gains                   |
| 5   | [Security and operations](./05-security-and-operations.md) | How to operate a persistent home runner without turning it into a credential vault |
| 6   | [Adoption plan](./06-adoption-plan.md)                     | The staged implementation sequence and go/no-go criteria                           |

This pack complements [OTA document 7](../ota/07-environments-and-testing.md). OTA distributes
compatible JavaScript after installation; this pack covers native binaries, simulators, E2E and
store delivery.

## The 90-second version

### What is slow today

The current native E2E workflow creates a clean hosted machine, installs tooling, generates the
native projects, performs a release native build, boots a device and runs Maestro. A sampled
`main` run on 2026-08-26 ([GitHub run 32928885595](https://github.com/timecalendar/timecalendar/actions/runs/32928885595))
spent:

| Platform | Native build | Whole platform job | Build share |
| -------- | -----------: | -----------------: | ----------: |
| iOS      |      12m 21s |            20m 56s |         59% |
| Android  |      21m 27s |            27m 57s |         77% |

That run failed later in the Maestro flows, so these numbers are a build-cost sample, not a green
baseline. They nevertheless show that native compilation is the largest single lever. A persistent
Mac can retain CocoaPods downloads and Xcode DerivedData outside the generated `ios/` tree.

### Why not put everything on the Mac

The repository is public. GitHub warns that persistent self-hosted runners can be compromised by
untrusted workflow code and do not provide the clean-machine guarantee of hosted runners. Running
pull-request heads on the Mac would make every cached tool, token and reachable service part of the
attack surface.

The Mac is also one machine in one home. Internet, power, disk, Xcode and hardware failures must
delay work, not stop releases. The design therefore keeps a hosted fallback and never makes the Mac
the sole holder of signing credentials.

### Why signed builds stay on EAS

The app already chose EAS-managed signing. Expo supports `eas build --local`, but its official
documentation says local build caching is unsupported and secret EAS environment variables must be
provided locally. Moving signed builds to the Mac would therefore add credential risk without the
cache guarantee that motivated this issue.

The manual GitHub workflow should take an immutable commit SHA (default: the current `main` SHA),
ask EAS to build it, then use a protected environment before submitting the resulting build to
TestFlight or Play. Build once; submit that exact artifact.

## Decisions in this pack

- Attach one repository-scoped GitHub runner service to a **private build-orchestration
  repository**, under a dedicated macOS account. Never attach it to the public source repository.
- Never run `pull_request` or arbitrary fork code on it.
- Pilot iOS E2E first; keep Android on GitHub-hosted Linux during the pilot.
- Keep GitHub-hosted iOS as an explicit fallback.
- Keep store signing and submission in EAS; do not import Flutter `match` credentials.
- Expose the Mac to agents through workflow dispatch, logs and artifacts—not SSH.
- Do not add a QA gate. The TimeCalendar board currently has no QA Engineer role; green CI and
  Reviewer sign-off remain the gate, and missing device evidence returns to the Applier as rework.
- Treat TestFlight/Play uploads as deploy acts requiring the existing human release gate, even when
  building is automated.

## What this pack deliberately does not do

- It does not configure the runner, GitHub environments, EAS, TestFlight or Play Console.
- It does not inspect, copy or create any signing key, token or certificate.
- It does not modify `.github/workflows/`, `mobile/eas.json` or `mobile/app.config.ts`.
- It does not change the existing `run-e2e` PR-label policy.
- It does not claim the Mac is ready. Tailscale reported the peer online during this investigation,
  but the supplied SSH identity was not accepted; hardware and toolchain inventory remain a first
  implementation prerequisite.
- It does not create the required private orchestration repository or decide its final name.

## Primary references

- [GitHub: secure use of self-hosted runners](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub: self-hosted runners](https://docs.github.com/en/actions/concepts/runners/self-hosted-runners)
- [Expo: local EAS Build and its limitations](https://docs.expo.dev/build-reference/local-builds/)
- [Expo: distribution overview](https://docs.expo.dev/distribution/introduction/)
- [Apple: TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview)
- [Google Play: internal, closed and open testing](https://support.google.com/googleplay/android-developer/answer/9845334)
