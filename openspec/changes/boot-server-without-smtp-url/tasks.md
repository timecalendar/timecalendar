## 1. Make the mailer tolerate an absent SMTP_URL

- [ ] 1.1 In `server/src/modules/mailer/services/mailer.service.ts`, replace
  `private readonly transporter = createTransport(SMTP_URL)` with a memoised private
  accessor that builds the transport on first use (design D1). Add
  `private readonly logger = new Logger(MailerService.name)`, matching the convention in
  `modules/firebase/services/firebase.service.ts`.
- [ ] 1.2 Guard `sendEmail`: when `SMTP_URL` is falsy, log one `warn` naming the missing
  configuration and return `undefined` without constructing a transport (design D2). Do not
  change the method signature.
- [ ] 1.3 Call the transport accessor from **inside** `sendEmail`'s existing `try`, and
  replace the empty `catch { /* error */ }` with `this.logger.warn(...)` carrying the error
  (design D3). Control flow and return value stay as they are.
- [ ] 1.4 Leave `server/src/config/constants.ts` untouched. Document in the mailer file
  (short comment) that `""` is the disabled state and why the transport is lazy — this is
  the boot-path contract someone will otherwise "simplify" back into a property.

## 2. Retire the two crash-dodging shims

- [ ] 2.1 Delete `process.env.SMTP_URL ??= "smtp://localhost:1025"` from
  `server/src/generate-openapi.ts:9`. Keep the surrounding comment block accurate — the
  "No dotenv here" paragraph stays; drop only what described the SMTP assignment.
- [ ] 2.2 Delete the `SMTP_URL: smtp://localhost:1025` entry and its two-line justification
  comment from the `environment:` block of `server/docker-compose.e2e.yml`. Change nothing
  else in that overlay.
- [ ] 2.3 Leave `src/config/environments/development.ts`'s `SMTP_URL: "smtp://localhost:1025/"`
  in place — it points at a local Mailhog, not at a crash workaround (design D4).

## 3. Add the regression test

- [ ] 3.1 Add `server/src/modules/mailer/services/mailer.service.test.ts`. Mock
  `config/constants` with `...jest.requireActual("config/constants")` plus a getter over a
  `mock`-prefixed variable for `SMTP_URL`, and mock `nodemailer`'s `createTransport`
  (design D5). The test must never read the ambient `SMTP_URL`.
- [ ] 3.2 Disabled-path cases, with `SMTP_URL` forced to `""`: compiling a testing module
  containing `MailerModule` resolves `MailerService` without throwing **and**
  `createTransport` was never called; `sendEmail` returns `undefined`, still never calls
  `createTransport`, and logs a warning.
- [ ] 3.3 Configured-path cases, with `SMTP_URL` forced to a real-looking URL:
  `sendEmail` builds the transport from that URL and calls `sendMail` with the `SMTP_FROM`
  sender, the recipient, the subject and the rendered HTML; a second `sendEmail` reuses the
  same transport (`createTransport` called exactly once); a rejecting `sendMail` is caught,
  logged, and returns `undefined` rather than throwing.

## 4. Local green

- [ ] 4.1 `docker compose -f server/docker-compose.yml up -d` (the suite's Postgres/Redis
  prerequisite), then in `server/`: `npm run test -- mailer` for the focused run and
  `npm run test` for the full suite. Both green.
- [ ] 4.2 `npm run lint` and `npm run build` in `server/`, both clean.
- [ ] 4.3 Prove the mutant: temporarily restore the eager `createTransport(SMTP_URL)`
  property and confirm the new test **fails**, then revert. A test that passes against the
  broken code is the failure mode this ticket exists to prevent — record the observed
  failure message in the handoff.

## 5. Execute the acceptance criteria (not reasoned about — run)

- [ ] 5.1 No-SMTP full-app boot: from `server/`, with `SMTP_URL` guaranteed absent from the
  environment and from `server/.env`, run `npm run generate:openapi` and confirm it exits 0
  and leaves `openapi/openapi.json` byte-identical (`git diff --exit-code openapi/openapi.json`).
  This constructs the whole `AppModule` graph — it is the "app bootstraps" half of the AC.
- [ ] 5.2 Empty-string boot: repeat 5.1 with `SMTP_URL=""` exported. Same result.
- [ ] 5.3 `/health` half of the AC: run `./ci/e2e-server.sh up` (Docker) with the compose
  shim removed, confirm the server service reaches `healthy` — its healthcheck is a `/health`
  request — then `./ci/e2e-server.sh down`. Capture the healthy status line as evidence. If
  Docker is unavailable on the host, say so explicitly in the handoff and fall back to
  booting `npm run start:dev` with `SMTP_URL` unset and curling `/health`; do not silently
  skip this criterion.
- [ ] 5.4 Confirm the configured path still works end to end: repeat 5.1 with
  `SMTP_URL=smtp://localhost:1025` set and confirm the identical result (no behaviour change
  when the variable *is* set).

## 6. CI proof

- [ ] 6.1 No new CI wiring is required — record why. The change makes two **existing** jobs
  the standing proof: `ci-build-deploy.yml`'s "Check committed OpenAPI spec matches the
  server code" step now boots `AppModule` with `SMTP_URL` unset (`ci/.env.test` sets only
  `NODE_OPTIONS`), and `ci-mobile-e2e.yml` boots the real server image with no `SMTP_URL`
  behind a `/health` healthcheck. State this explicitly in the PR body so the Reviewer can
  check it against the workflow files rather than take it on trust.
- [ ] 6.2 The committed unit test from §3 is the module-level regression gate and runs in
  the `npm run test` CI step. Do not add a workflow edit — `.github/workflows/` is a
  sensitive surface and this change does not need one.

## 7. Documentation and architecture

- [ ] 7.1 Architecture Book update: **N/A**, and say so in the PR body rather than leaving
  it unstated. `docs/mobile/architecture-book/` governs `mobile/` only; this is a server leaf
  change establishing no mobile rule. No ADR — the decision is neither mobile nor costly to
  reverse.
- [ ] 7.2 Update `docs/agent-dev-environment.md` only if a documented server command or CI
  gate changes shape. It does not today — record as N/A if so; do not add unrelated docs.

## 8. Scope and sensitive-surface audit

- [ ] 8.1 Read the final diff. Confirm it touches only: the mailer service, its new test,
  `server/src/generate-openapi.ts`, `server/docker-compose.e2e.yml`, and this OpenSpec change.
  No `openapi/openapi.json` diff, no `server/src/migrations/`, no `k8s/`, no `terraform/`, no
  `.github/workflows/`, no `mobile/`, no `app/`, no `config/constants.ts`.
- [ ] 8.2 Confirm no listed sensitive surface is touched, and that `server/src/app.module.ts`
  — the boot path this change protects — is not edited. Flag the boot-path relevance in the
  PR body and every downstream handoff so the Reviewer verifies §5 was executed.
- [ ] 8.3 Run `openspec validate boot-server-without-smtp-url --strict` and record the exact
  commands and results from §4 and §5 in the PR body as Reviewer evidence. Human/device QA
  is N/A (backend only, no user-visible surface).
