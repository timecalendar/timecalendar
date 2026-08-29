## Why

`SMTP_URL` is dead configuration. `mail.herasus.fr` no longer exists and nothing in the
server calls `MailerService.sendEmail` — the only references to the mailer are
`MailerModule` being imported by `app.module.ts`. The board wants the variable deleted.

It cannot be deleted today, because unsetting it crashes the server at boot.
`server/src/config/constants.ts:51` resolves `SMTP_URL = env.SMTP_URL ?? ""`, and
`MailerService` builds its transport as a class property:

```ts
private readonly transporter = createTransport(SMTP_URL)
```

Nest instantiates module providers eagerly, so the zero call sites do not save us.
Verified locally against the repo's nodemailer 8.0.7:

| `createTransport(...)` | result |
| --- | --- |
| `""` | throws `Cannot create property 'mailer' on string ''` |
| `undefined` | throws `Cannot set properties of undefined (setting 'mailer')` |
| `"smtp://disabled.invalid:25"` | fine |

Two places in the repo already exist only to dodge that crash:
`server/src/generate-openapi.ts:9` (`process.env.SMTP_URL ??= "smtp://localhost:1025"`)
and the `SMTP_URL: smtp://localhost:1025` entry in `server/docker-compose.e2e.yml`. The
wave-1 platform rollout ([TIM-303]) is resealing production and preproduction to the inert
literal `smtp://disabled.invalid:25` for the same reason. All three are workarounds for one
defect in `MailerService`. OpenAPI generation is the standing CI boot gate; the compose
stack provides locally executed `/health` evidence because mobile E2E is path/label gated
and does not run for this PR or its merge push.

## What Changes

- Build the SMTP transport **lazily**, on first `sendEmail`, instead of at provider
  construction — module construction can no longer throw, whatever `SMTP_URL` holds.
- Treat an absent or empty `SMTP_URL` as "mail is disabled": `sendEmail` logs one warning
  and returns `undefined` without constructing a transport. No call sites exist, so no
  caller changes.
- Log transport/send failures at `warn` instead of swallowing them silently, so the new
  lazy-construction failure mode is observable.
- Delete the two crash-dodging shims (`generate-openapi.ts:9` and the compose
  `SMTP_URL` entry). Removing them is not diff-widening: OpenAPI generation becomes the
  standing no-SMTP `AppModule` boot gate, while the compose stack can directly prove the
  `/health` half of the acceptance criterion when executed locally.
- Add a unit test that compiles `MailerModule` with `SMTP_URL` forced empty and asserts
  no transport is created, plus the configured-path test that proves behaviour is
  unchanged when `SMTP_URL` is set.

## Capabilities

### New Capabilities

- `server-mail-delivery`: how the server's mail transport is configured, when it is
  constructed, and how it degrades when SMTP is not configured.

### Modified Capabilities

None. `openapi-spec-export` and `e2e-server-lifecycle` keep their existing requirements —
this change removes an environment workaround under them without altering what either
capability guarantees.

## Impact

- Affected code: `server/src/modules/mailer/services/mailer.service.ts` (the change),
  `server/src/generate-openapi.ts` and `server/docker-compose.e2e.yml` (shim removal),
  plus a new test file under `server/src/modules/mailer/services/`.
- `server/src/config/constants.ts` is unchanged — `SMTP_URL = env.SMTP_URL ?? ""` stays,
  and `""` becomes the documented "disabled" state, so unset and empty behave identically.
- No API/OpenAPI contract change, no database migration, no chart, Terraform, mobile,
  native/store config, or legacy Flutter change.
- `server/src/app.module.ts` is a boot path. It is not edited here, but this change is
  what makes it survive an unset `SMTP_URL` — a mistake is a CrashLoopBackOff in
  production, so the acceptance proof must be executed, not reasoned about.

## Out of scope

- Removing `MailerService`, `MailerModule`, or `SMTP_FROM`.
- Deleting the `SMTP_URL` k8s variable — that is a platform-repo follow-up on [TIM-303],
  which this change unblocks but does not block.
- Anything for the AWS SES migration. SES lands as its own change with fresh credentials;
  nothing here pre-builds for it.

[TIM-303]: https://paperclip.ing/TIM/issues/TIM-303
