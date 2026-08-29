## Context

`MailerService` is a five-line-of-logic provider with zero call sites, but it sits on the
boot path:

```
app.module.ts:47  MailerModule
  → mailer.module.ts  providers: [MailerService]
    → mailer.service.ts:13  private readonly transporter = createTransport(SMTP_URL)
```

Nest instantiates every provider in the graph at bootstrap, so that property initialiser
runs on every boot regardless of whether anyone sends mail. With `SMTP_URL` empty,
nodemailer 8.0.7 throws while the injector is building the provider, and the process never
reaches the HTTP listener.

The blast radius of the current state is wider than the mailer:

- `server/src/generate-openapi.ts:9` sets `process.env.SMTP_URL ??= "smtp://localhost:1025"`
  *before* its imports, because the emit script calls `NestFactory.create(AppModule)` under
  `NODE_ENV=test`, and `src/config/environments/test.ts` defines no `SMTP_URL`.
- `server/docker-compose.e2e.yml` sets `SMTP_URL: smtp://localhost:1025` with a comment
  saying exactly why ("MailerService builds a transport at construction time").
- The platform rollout on TIM-303 reseals both namespaces to `smtp://disabled.invalid:25`.

Three placeholders, one defect. Fixing the defect retires all three, and the first two are
executed by CI on every PR — which is what makes the acceptance criteria provable rather
than argued.

## Goals / Non-Goals

**Goals:**

- Module construction never throws, for any value of `SMTP_URL` including unset and `""`.
- `SMTP_URL` unset and `SMTP_URL=""` are the same state: mail disabled.
- Zero behaviour change when `SMTP_URL` is set.
- A committed test makes the no-SMTP construction path a regression gate, deterministically
  — not dependent on whatever the ambient environment happens to hold.

**Non-Goals:**

- Removing `MailerService`, `MailerModule`, or `SMTP_FROM`.
- Changing `config/constants.ts`, the k8s chart, or any platform value.
- Introducing configuration validation, a config schema, or a mail-provider abstraction.
- Any preparation for the AWS SES migration.

## Decisions

## Decision 1 — Lazy, cached transport instead of a construction-time property

Replace the eager property with a private accessor that builds the transport on first use
and memoises it:

```ts
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)
  private transporter?: Transporter

  private getTransporter() {
    this.transporter ??= createTransport(SMTP_URL)
    return this.transporter
  }
  ...
}
```

This is the minimum that satisfies the constraint "module construction must not throw".
It keeps one transport per service instance (nodemailer pools connections per transport, so
constructing one per call would be a real regression), and the provider stays a plain
`@Injectable()` with no factory, token, or module-options plumbing.

Alternatives rejected:

- **`useFactory` provider returning a transport or `null`.** Moves the same work into the
  module and still runs it at bootstrap; solves nothing unless the factory also guards, at
  which point it is strictly more code than the accessor.
- **`OnModuleInit`.** Nest awaits lifecycle hooks during bootstrap, so a throw there is
  still a boot crash. It only helps if it also guards — same objection.
- **Making `MailerModule` conditionally imported in `app.module.ts`.** Edits the boot path
  for a leaf defect, and `AppModule`'s import list would then depend on env at module-eval
  time. Rejected: this ticket should shrink the boot path's fragility, not add a branch to it.

## Decision 2 — No SMTP configured ⇒ warn once and return, do not throw

The ticket allows either an early return or a clear thrown error. Choose the early return:

```ts
if (!SMTP_URL) {
  this.logger.warn("SMTP_URL is not configured — skipping email to <recipient>")
  return
}
```

Rationale: `sendEmail` is already a best-effort, non-throwing API — its existing body
catches every send error and returns `undefined`. A caller (there are none today, but the
signature is the contract) that tolerates "the SMTP server was down" also tolerates "there
is no SMTP server". Throwing would make *disabled mail* louder than *broken mail*, which is
backwards. The `warn` log is what makes a misconfiguration visible; production runs with
`SMTP_URL` deliberately absent, so this must not be an `error`.

The return type is already `SentMessageInfo | undefined`, so the early return is
type-compatible with no signature change.

## Decision 3 — Transport construction lives inside the existing try/catch

Moving `createTransport` out of the property initialiser creates a new failure mode: a
*non-empty but malformed* `SMTP_URL` now throws at send time rather than at boot. Call
`getTransporter()` inside `sendEmail`'s existing `try`, so a malformed URL degrades exactly
like a failed send — logged, swallowed, `undefined` returned — and can never crash a caller
or the process.

While doing so, replace the empty `catch { /* error */ }` with a `this.logger.warn(...)`
carrying the error. The current silent swallow would hide this new failure mode completely.
This is the one deliberate behaviour change outside the missing-config path, and it is
observability only: the return value and control flow are unchanged.

## Decision 4 — Delete both shims; their CI jobs become the acceptance proof

`generate-openapi.ts:9` and the compose `SMTP_URL` entry exist solely because of this
defect. Removing them costs three lines and buys the two strongest available proofs, both
already running in CI on every PR:

| Proof | Job | What it exercises |
| --- | --- | --- |
| `node dist/generate-openapi.js` | `ci-build-deploy.yml` "Check committed OpenAPI spec matches the server code" | Full `NestFactory.create(AppModule)` with `SMTP_URL` unset (`ci/.env.test` sets only `NODE_OPTIONS`) |
| `ci/e2e-server.sh up` | `ci-mobile-e2e.yml` | The real server image boots with `SMTP_URL` unset and its compose healthcheck polls `/health` until it answers |

The second one *is* the acceptance criterion verbatim: "with `SMTP_URL` unset, the Nest app
bootstraps and `/health` responds." Leaving the shims in place would mean shipping a fix
whose headline claim nothing in CI ever tries.

`src/config/environments/development.ts` keeps `SMTP_URL: "smtp://localhost:1025/"` — that
is a genuine local Mailhog pointer, not a crash dodge, and removing it would change what a
developer's `npm run dev` does.

## Decision 5 — The test forces `SMTP_URL`; it never reads the ambient value

`SMTP_URL` is a module-level `const` resolved at import time, and `setup-tests.ts` loads
`server/.env` through dotenv before anything else. So under Jest the value depends on
whether the developer happens to have a `.env` with an SMTP entry. In CI it is empty and the
test would pass trivially; on a machine with a populated `.env` the same test would be
testing the opposite path — the classic vacuous green.

The test file therefore mocks the constants module, backing `SMTP_URL` with a getter over a
`mock`-prefixed variable (the prefix is required by Jest's `jest.mock` hoisting guard, same
convention as the shared fake-db helpers):

```ts
let mockSmtpUrl = ""
jest.mock("config/constants", () => ({
  ...jest.requireActual("config/constants"),
  get SMTP_URL() {
    return mockSmtpUrl
  },
}))
```

Spreading `requireActual` keeps every other constant real, so importing the mailer does not
drag in a hand-written stub of the whole config surface. Because Decision 1 reads `SMTP_URL`
at *call* time, one file can cover both states by assigning `mockSmtpUrl` per test.

`nodemailer.createTransport` is mocked in the same file, which is what lets the disabled
case assert the strong property — *never called* — rather than merely "did not throw".

Fallback if the getter proves awkward under ts-jest: two sibling test files, each with a
fixed `jest.mock` value. Same coverage, more duplication. The Applier may take it, but must
not fall back to reading the ambient env.

## Risks

- **Deferring the crash rather than removing it.** A malformed non-empty `SMTP_URL` used to
  fail loudly at boot; it now fails quietly at send time. Accepted: there are no senders,
  production is heading toward no SMTP at all, and Decision 3's `warn` keeps it visible.
- **Silent mail loss if a future caller appears while SMTP is unset.** Accepted and made
  visible by the warn log. A future SES change owns real delivery guarantees.
- **Boot-path regression.** Mitigated by Decision 4: two independent CI jobs boot the full
  app graph with `SMTP_URL` unset, so a regression here reddens the PR that causes it.

## Migration / Rollout

None. The change is backward compatible in both directions: environments that still set
`SMTP_URL` (including the `smtp://disabled.invalid:25` literal TIM-303 is resealing) behave
exactly as before, and environments that drop it stop crashing. The platform-side deletion
of the variable is a separate follow-up on TIM-303 and is unblocked, not required, by this.
