# 1 — Decision

## 1.1 Recommendation

**Use the Mac Mini, but do not replace GitHub Actions with it.** Register it as a narrowly scoped
GitHub Actions runner in a **separate private build-orchestration repository** for trusted native
verification. Keep ordinary CI in the public source repository on hosted runners and keep signed
distribution on EAS.

The division is:

| Responsibility                                            | Owner                                               |
| --------------------------------------------------------- | --------------------------------------------------- |
| Trigger, audit log, commit selection, queue and approvals | GitHub Actions                                      |
| iOS simulator compilation and Maestro on trusted commits  | Mac Mini pilot                                      |
| Android E2E                                               | GitHub-hosted Linux initially; reassess after pilot |
| TestFlight, Play, beta and production binary build/sign   | EAS Build                                           |
| Upload of an already-built binary                         | EAS Submit behind a GitHub environment gate         |
| OTA bundle hosting and promotion                          | Existing OTA design; outside this pack              |
| Fallback when the Mac is unavailable                      | GitHub-hosted macOS                                 |

## 1.2 Options considered

| Option                                                             | Speed                 | Security                                              | Availability              | Maintenance | Verdict                                                          |
| ------------------------------------------------------------------ | --------------------- | ----------------------------------------------------- | ------------------------- | ----------- | ---------------------------------------------------------------- |
| GitHub-hosted only                                                 | Cold native builds    | Clean ephemeral machines                              | High                      | Low         | Safe fallback, but leaves the main performance problem untouched |
| Mac runner attached to the public source repo                      | Warm native builds    | Public PR workflow can target a persistent host       | One home/ISP/power domain | Moderate    | Rejected                                                         |
| Mac-only CI and releases                                           | Warm caches           | Persistent compromise and credential exposure         | One home/ISP/power domain | High        | Rejected                                                         |
| Mac builds, direct SSH orchestration                               | Warm caches           | Weak audit and broad host access                      | One host                  | High        | Rejected                                                         |
| **Private GitHub control plane + narrow Mac worker + EAS signing** | Warm iOS verification | Keeps public PR workflow changes away from the runner | Hosted fallback           | Moderate    | **Recommended**                                                  |

## 1.3 The pushback

### Do not make the Mac the production signing authority

The initial instinct—"the Mac is warm, so build every signed binary there"—mixes two different
problems:

1. simulator E2E is slow because compilation starts cold;
2. store delivery needs signing credentials, deterministic versioning and an audit trail.

The persistent host directly solves the first. It does not automatically improve the second.
Expo explicitly documents that `eas build --local` does not support its build cache and that secret
environment values must be supplied on the local machine. A hand-maintained Fastlane/Xcode path
would also become a second release implementation alongside EAS.

Keep signed builds boring: EAS-managed credentials, EAS Build, EAS Submit, immutable SHA, protected
submission environment.

### Do not attach the persistent runner to the public repository

The repository is public. A pull request can alter workflow YAML as well as package scripts, Gradle
tasks, Xcode build phases or dependency hooks. Labels and an `if` condition are not a security
boundary: a changed pull-request workflow can attempt to target any self-hosted runner registered
to the repository. On a persistent runner that code can inspect later jobs, poison caches or steal
credentials. GitHub's own guidance says self-hosted runners should almost never be used for public
repositories.

The Mac therefore belongs to a separate private orchestration repository whose only writers are
trusted operators. That repository owns the runner workflow and checks out the public source repo
at a verified SHA. Allowed triggers are:

- a narrowly scoped dispatch sent after a `push` to public `main`;
- `workflow_dispatch` in the private repository, resolving to a source commit that is already an
  ancestor of public `origin/main`;
- a protected release tag for non-secret verification.

Disallowed:

- registering the runner to `timecalendar/timecalendar` at repository or organization scope;
- accepting `pull_request` events or workflow definitions from the public source repository;
- fork refs;
- unmerged branch commits, even when they exist in the TimeCalendar repository;
- arbitrary workflow YAML from the requested SHA;
- ad hoc shell commands supplied as workflow inputs.

The workflow definition comes from the private repository's protected default branch. The requested
source SHA is only data checked out by that trusted workflow. If a suitably restricted private
orchestration repository cannot be provided, do not register the Mac; use hosted CI and EAS.

### Do not give a Paperclip agent SSH access

The agent-facing interface is a workflow contract: select a SHA and suite, dispatch it, read logs
and artifacts, record evidence. SSH is a break-glass operator path. This gives a future QA role the
capability it needs without granting a general-purpose shell on a personal network.

Today the board has no QA Engineer. This recommendation does not recreate the retired `QA:
required` gate. Reviewer sign-off plus green CI remains the standard.

## 1.4 Why iOS first

iOS is the unique use of Apple hardware and the clearest cache opportunity:

- GitHub-hosted iOS currently regenerates the native project and puts DerivedData under the
  generated `mobile/ios/` tree;
- the Mac can keep DerivedData outside that tree and retain tool downloads;
- Xcode and simulator availability are otherwise paid/cold hosted resources;
- Android already has KVM on `ubuntu-latest` and can continue in parallel.

Moving both platforms to one Mac immediately would serialize them and make the benchmark harder to
interpret. After two weeks of iOS data, run an Android-on-Mac experiment and move it only if p50
end-to-end time and reliability improve without starving iOS.

## 1.5 Decision triggers

Revisit the design if any of these become true:

- the Mac cannot meet 95% runner availability over a 30-day window;
- warm iOS E2E p50 does not improve by at least 30% versus the hosted baseline;
- cache-related flakes exceed the hosted runner failure rate;
- signed EAS build cost or queue time becomes a documented release blocker;
- the Mac becomes a shared personal workstation rather than a dedicated runner host;
- a second Mac is added, making isolated build and test pools practical.
