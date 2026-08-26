# 2 — Target architecture

## 2.1 System boundary

```text
developer / agent
       |
       v
public source repository (hosted CI, reviewed main SHA)
       |                              |
       | scoped dispatch              +--------------------+
       v                                                   v
private orchestration repository                      EAS Build service
(trusted workflow + Mac runner)                        signed iOS/Android artifact
       |                                                   |
       +----------- logs/checks/evidence --------+          v
                                                 |   protected submit job
                                                 |          |
                                                 v          v
                                          public commit  TestFlight / Google Play
```

GitHub owns orchestration. The Mac is registered only to the private orchestration repository and
pulls jobs outbound from GitHub; GitHub does not need inbound SSH or an exposed port. Tailscale
remains useful for break-glass human maintenance, not normal job execution.

## 2.2 Workload placement

| Workload                                       | Trigger                                        | Runner                                 | Secrets                         | Rationale                                           |
| ---------------------------------------------- | ---------------------------------------------- | -------------------------------------- | ------------------------------- | --------------------------------------------------- |
| TypeScript, lint, Jest, generated-client drift | PR/push                                        | GitHub-hosted Linux                    | none                            | Clean, cheap, parallel and already working          |
| Android Maestro                                | trusted `main`; labelled PR per current policy | GitHub-hosted Linux                    | throwaway test material only    | Keeps KVM path and parallelism during pilot         |
| iOS Maestro                                    | private dispatch for trusted `main` SHA        | **Mac Mini**                           | throwaway test material only    | Public PR workflows cannot address the runner       |
| iOS Maestro fallback                           | manual trusted SHA                             | GitHub-hosted macOS                    | throwaway test material only    | Recovery when the Mac is offline or suspect         |
| Development simulator build                    | manual trusted SHA                             | Mac Mini                               | none                            | Fast install for an operator; no store distribution |
| Internal/beta/production binary                | manual trusted SHA/tag                         | **EAS Build**                          | EAS-managed signing             | One signing path and managed credentials            |
| Submit existing EAS build                      | manual approval                                | GitHub-hosted Linux calling EAS Submit | environment-scoped API tokens   | No store secret enters the Mac                      |
| OTA publish/promotion                          | existing OTA runbook                           | hosted CI/operator gate                | OTA signing/publish credentials | Separate deploy mechanism and policy                |

## 2.3 Runner topology

Use exactly one repository-level runner service in the first phase:

- dedicated macOS user: `timecalendar-runner`;
- repository access: only a private build-orchestration repository with tightly limited writers;
- **no runner registration or runner-group access from the public** `timecalendar/timecalendar`;
- labels: `self-hosted`, `macOS`, the runner-reported architecture (`ARM64` if inventory confirms
  Apple silicon), `timecalendar`, `mac-mini`, `mobile-ci`;
- one concurrent job;
- runner work directory on the fast internal SSD;
- no broad organization-wide runner group and no unrelated repository access.

Do not register two runner services on the same machine to create fake parallelism. Concurrent Xcode,
Gradle and simulators compete for memory, disk and device state while making failures harder to
attribute. Scale by adding another physical runner, not another listener on the same host.

## 2.4 Commit and workflow integrity

Every private-orchestration manual workflow accepts `ref`, but normalizes it before work:

1. default empty `ref` to the current `origin/main` SHA;
2. fetch from `timecalendar/timecalendar`, never a user-supplied repository URL;
3. resolve to a full 40-character commit SHA;
4. record requested ref and resolved SHA in the job summary;
5. before sending a job to the Mac, prove the SHA is an ancestor of `origin/main`;
6. for production, require the SHA to equal the commit pointed to by a signed/protected release tag;
7. checkout that SHA while using the workflow definition from the private repository's protected
   default branch;
8. name every artifact with platform, profile and short SHA;
9. emit the Expo fingerprint/runtime version and native app version in the summary.

The public-to-private dispatch credential is preferably a short-lived GitHub App installation token
scoped only to dispatching the named private repository. Its app key lives in a source-repository
environment whose deployment-branch policy permits only `main`, not in ordinary repository
secrets, so pull-request jobs cannot retrieve it. The input is never a shell fragment. There is no `command`, `script`,
`xcode_args` or `gradle_args` free-text input. An unmerged SHA may be built on an ephemeral
EAS/hosted runner after the normal approval, but never on the persistent Mac.

## 2.5 Build once, promote the same artifact

For beta and production, provenance is:

```text
resolved SHA
  -> EAS build ID + platform artifact
  -> automated smoke/metadata checks
  -> protected environment approval
  -> EAS Submit of that exact build ID
  -> store processing ID/link
```

Never rebuild after approval. A rebuild can resolve different packages, receive a new build number
or incorporate changed remote environment values. Approval applies to a concrete EAS build ID and
SHA, not to the idea of "whatever main contains now."

## 2.6 Availability and fallback

A self-hosted job addressed only to Mac labels waits when the Mac is offline; GitHub does not
automatically reroute it to a hosted image. Provide an explicit fallback path:

- normal `main` iOS E2E targets the Mac;
- a manual `runner=github-hosted` option launches the same suite on `macos-26`;
- failure/offline instructions link directly to that dispatch action;
- no release is blocked on repairing the home host.

Use one concurrency group for Mac native work. A new `main` SHA cancels an older queued E2E run, but
must not cancel a build already in its store-submission gate.

## 2.7 Network shape

Normal runner operation needs outbound HTTPS to GitHub, package registries and the services used by
the tests. It needs no inbound public route. The local E2E backend binds to loopback/test ports and
uses the existing `ci/e2e-server.sh --native` lifecycle.

Do not give the runner broad access to production databases, Kubernetes, Terraform state, the home
LAN or cloud metadata. A mobile simulator test does not need them.
