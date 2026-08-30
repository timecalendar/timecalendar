# Design — close the calendar-token leak in the log sanitizer

The whole change is two `.replace(...)` links in the `sanitizeText` chain
(`server/src/config/observability/sanitize-log.ts:24`). The chain order is unchanged: the
key rule still runs before the id rule, so the key rule can only ever redact *more* before
the id rule sees the remainder.

## Decision 1 — bound the id rule per alternative, not with one shared lookaround pair

**Decision.** Replace

```js
.replace(/\b(?:[A-Za-z\d_-]{21,}|\d{10,})\b/g, "[id:redacted]")
```

with

```js
.replace(
  /(?<![A-Za-z\d_-])[A-Za-z\d_-]{21,}(?![A-Za-z\d_-])|(?<![A-Za-z\d_])\d{10,}(?![A-Za-z\d_])/g,
  "[id:redacted]",
)
```

Note the two alternatives carry **different** boundary classes: the opaque-token alternative
excludes `-` (so a `-` is *part of* the token and cannot end it), while the long-digit
alternative excludes only `[A-Za-z\d_]` (so a `-` may sit at the edge of a digit run).

**Why not the single pair from the ticket brief.** The brief proposes

```js
/(?<![A-Za-z\d_-])(?:[A-Za-z\d_-]{21,}|\d{10,})(?![A-Za-z\d_-])/g
```

That closes the token leak, but sharing one `-`-excluding boundary with the `\d{10,}`
alternative **introduces a new leak**. A hyphen-edged long digit run is redacted today and
would survive:

| input | today | brief's single pair | per-alternative |
|---|---|---|---|
| `v=-1111111111;` | `v=-[id];` | `v=-1111111111;` ❌ | `v=-[id];` |
| `v=1111111111-;` | `v=[id]-;` | `v=1111111111-;` ❌ | `v=[id]-;` |
| `v=-11111111111;` | `v=-[id];` | `v=-11111111111;` ❌ | `v=-[id];` |

The mechanism is the same one that causes the original bug, mirrored: with `-` excluded from
the lookbehind, a digit run preceded by `-` cannot start there, and the surviving suffix is
one char short of `{10,}`. A differential sweep over digit runs of length 8–14 in six
hyphen/alphanumeric contexts found **15** such regressions for the brief's form and **0** for
the per-alternative form. Real inputs in this shape include negative numbers, epoch
milliseconds after a `-`, and hyphen-separated numeric ids.

Since this is the redaction seam for every exported log line, a fix that trades one leak for
another is not acceptable. The per-alternative form redacts a **strict superset** of today.

**Verified.** All six token shapes (plain, leading `-`, trailing `-`, both-ends `-`, internal
`-`, underscore) are redacted; zero under-redaction regressions against the current rule.

## Decision 2 — the key rule needs the callback widened too, not just the regex

**Decision.** Replace

```js
.replace(
  /\b(?:authorization|set-cookie|cookie|token(?:\s+suffix)?|password|secret)\s*[:=][^\r\n]*/gi,
  (match) => `${match.split(/[:=]/, 1)[0]}=[redacted]`,
)
```

with

```js
.replace(
  /\b(authorization|set-cookie|cookie|token(?:\s+suffix)?|password|secret)["']?\s*[:=][^\r\n]*/gi,
  (_match, key) => `${key}=[redacted]`,
)
```

**Why the callback changes.** The ticket brief specifies only the `["']?` regex addition. With
the regex widened but the callback left as `split(/[:=]/, 1)[0]`, the match on `"token": "…"`
begins at `token` and the split keeps the trailing quote, emitting `token"=[redacted]` — a
stray quote in the redaction label.

**Why a capture group rather than re-splitting the match.** Recovering the key by splitting the
match on `["']?\s*[:=]` also yields the intended `token=[redacted]`, but it restates the
separator pattern a second time, so the regex and the callback have to be kept in sync by hand
— widening one without the other reintroduces exactly the stray-quote bug above. Promoting the
existing key alternation from `(?:…)` to a capture group and reading `key` from the callback's
second argument makes the separator appear once, so there is nothing left to desynchronise. It
also drops a `String.split` (and the fresh `RegExp` its literal allocates) per match. The two
forms were differential-tested over 221,520 inputs — the full corpus of both suites, an
exhaustive sweep of key × quote × whitespace × separator × tail × prefix, and 200k randomised
strings — with **zero** divergence. The keys in the alternation contain no `:` or `=`, which is
why the split could never have cut anywhere but the real separator.

**Accepted consequence — the rule stays greedy to end of line.** `[^\r\n]*` is unchanged, so
on a *single-line* JSON the rest of the line after a sensitive key is also redacted. This is
the pre-existing semantics of this rule (`cookie=a; tracking=b` already collapses to
`cookie=[redacted]` today), it errs toward redaction, and it does not affect the case this
ticket is about: TypeORM builds its criteria with `JSON.stringify(criteria, null, 4)`, so each
key sits on its own line and the redaction is surgical. Making the rule non-greedy is a
separate behavioral change and is not in scope.

**Defence in depth, not the load-bearing fix.** Decision 1 is what closes this leak. Decision 2
closes the general "no JSON-serialized secret key is redacted by the key rule" gap, which
matters for keys whose values are too short for the id rule to catch.

## Decision 3 — assert the seam at `TelemetryLogger`, not through an HTTP boot

**Decision.** Satisfy the ticket's filter-seam acceptance criterion with a test in
`telemetry-logger.test.ts` that pushes a **real TypeORM `EntityNotFoundError`** — constructed
with a hyphen-edged token so it exercises the actual defect — through `TelemetryLogger.debug()`
with a mocked `otelLogger`, and asserts the emitted `body` does not contain the token.

**Why.** The exported body is produced by `sanitizeLog` inside `TelemetryLogger.emit`, so that
is the last point where the token can still leak and the first point where the assertion is
meaningful. `TypeOrmExceptionFilter` itself lives in `@lyrolab/nest-shared`, which is out of
scope, and its only contribution to the chain is the message string — which the test
reproduces exactly by constructing the real error class. This keeps the proof dependency-free
(no Postgres, no Nest HTTP boot) and consistent with the existing harness in that file, which
already mocks `otelLogger` as `{ emit: jest.fn(), enabled: jest.fn(() => true) }`.

The ticket's wording — "at the `TypeOrmExceptionFilter` seam (**or an equivalent
integration-level assertion**)" — permits this.

## Decision 4 — pin the survival cases to what is true today, do not "improve" them

**Decision.** The no-over-redaction tests assert **current, measured** behavior. Measured
against the real module on `main`:

| input | today | after |
|---|---|---|
| `{ span_id: "00f067aa0ba902b7" }` | survives verbatim | survives verbatim |
| `{ trace_id: "4bf92f3577b34da6a3ce929d0e0e4736" }` | **`[id:redacted]`** | `[id:redacted]` |
| `{ school, queue, action, "service.name", "service.instance.id" }` | survive verbatim | survive verbatim |
| `user 12345 order ab12cd34` | survives verbatim | survives verbatim |
| `at 2026-08-30T02:32:21.429Z ok` | survives verbatim | survives verbatim |

**Why this is called out.** The acceptance criterion says "trace/span ids must still survive",
which reads as though both are exported verbatim. They are not: a 32-hex `trace_id` **value**
is already redacted by the id rule today, because allow-listed structured *values* are still
run through `sanitizeText`; it is the **key** that survives the allowlist. Trace correlation
does not depend on this — it rides on the log record's `spanContext`, asserted separately in
`telemetry-logger.test.ts:73`.

So the test must pin `trace_id` as redacted. Writing it as "survives verbatim" would fail, and
the natural repair — exempting trace ids from the id rule — would widen the diff into an
unrelated behavior change on the sensitive surface. Do not do that. If verbatim `trace_id`
values are wanted in log attributes, that is its own ticket.

## Edge cases

- **Lookbehind support.** Variable-free lookbehind is ES2018; the server targets Node 20+ and
  the existing chain already uses lookahead. No transpile concern.
- **Rule ordering.** Unchanged. The key rule redacts a prefix-to-EOL span before the id rule
  runs, so widening the key rule can only reduce what the id rule sees.
- **`MAX_SCALAR_LENGTH` / `MAX_LOG_BODY_LENGTH`.** Untouched. Redaction shortens bodies, so
  the existing bounds test is unaffected.
- **Existing suite.** All 59 tests under `server/src/config/observability/` pass against the
  candidate implementation, unmodified.
