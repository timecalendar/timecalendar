# Rentrée server/web release promotion

**(HUMAN: preprod/prod access and production tag approval)**

This checklist records the credentialed evidence and reviewed GitOps handoff described in
[`docs/server/rentree-release-runbook.md`](../../server/rentree-release-runbook.md). This
TimeCalendar change prepares the release; it does **not** flip a production tag.

## Candidate evidence

- Candidate full SHA:
- Successful `ci-build-deploy.yml` run URL and UTC completion:
- Server `main-<sha>` tag and `sha256:` digest:
- Web `main-<sha>` tag and `sha256:` digest:
- Preproduction desired-state revision:
- Argo CD revision/sync/health:
- Server pod image IDs and observation UTC:
- Web pod image IDs and observation UTC:
- Migration row and `up/down/up` evidence record:

Do not paste credentials, environment dumps, URLs/query strings/tokens/resource ids, raw
calendar rows, or event data.

## Required soak

- [ ] One SHA and both digests converge in preproduction.
- [ ] Representative and preproduction migration gates pass; final state is `up`.
- [ ] Prior server image is healthy against retained `syncPlannedAt` schema.
- [ ] Generic 30-minute and Lyon 60-minute plans pass.
- [ ] Concurrent caller and BullMQ retry proof one Lyon fetch per hour.
- [ ] Three initial five-minute windows stay within queue/upstream/runtime gates.
- [ ] First full Lyon hour (at least 65 minutes) passes.
- [ ] Two-hour steady-state window passes with known, trustworthy signals.
- [ ] Previous immutable server/web tags and digests are recorded for rollback.

## Human-reviewed platform handoff

- Platform PR URL:
- Exact server/web candidate tags in diff:
- TimeCalendar evidence reviewer:
- Platform reviewer/approver:
- Database restore point:
- Planned production observation owner and UTC window:
- Explicit production tag approval:

If any signal is unknown or any runbook abort criterion fires, record `NO-GO` and do not
approve the platform PR. Normal rollback restores prior images while retaining the schema;
destructive migration `down` requires separate explicit human authorization.
