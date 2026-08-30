## Context

Ticket 4 of the Activity revival epic ([TIM-397](/TIM/issues/TIM-397), epic
[TIM-389](/TIM/issues/TIM-389)). Authoritative spec:
`docs/react-native-migration/05-tech-specs/activity-revival.md` (architecture decisions 6, 7, 8, 10
and **Mobile state behavior**).

This change **extends** `mobile/src/features/activity/data/` — the module
[TIM-396](/TIM/issues/TIM-396) landed on `main` in `b378adb8` — with the one bounded, offline-safe
fetch and pagination seam every Activity trigger shares. It does not create the module or its
barrel; it adds to both.

## Why these decisions are recorded in a committed file

Three agents each spent a full round re-deriving the same v1 contract facts from each other's
comments, and several of those readings had already inverted by the time they were posted. Contract
facts belong in a committed file, not in a thread. Every claim below cites the source file and line
on `main`, so the next reader verifies rather than re-derives.

D1–D5 are frozen by the **v1 contract merged in `5f14a146`**. D6–D11 are frozen by **Ticket 3's
repository**, merged in `b378adb8`.

## Decisions

### D1 — Do NOT regenerate the Orval client; **verify** it and consume what is already committed

`5f14a146 feat(server): calendar naming, token rename contract and RN client generation (#313)`
already generated and committed the v1 client. On `main` today:

- `openapi/openapi.json` — `POST /v1/calendar-logs/search` is present.
- `mobile/src/api/generated/calendar-logs/calendar-logs.ts:131` —
  `calendarLogV1ControllerSearchCalendarLogs` plus the URL builder and hook wrappers.
- `mobile/src/api/generated/timeCalendar.schemas.ts:190` — `SearchCalendarLogsV1Dto`;
  `:217` — `CalendarLogSearchV1Response`.

Every input the coordinator needs exists. The ticket's scope bullet 1 ("regenerate and commit the
generated output") is therefore already satisfied. It is replaced by: **run the generator, assert an
empty diff, and consume the existing operation.** Proposing a regeneration on a committed-contract
surface that CI gates invites either a hand-edit or a spurious diff, for zero gain.

### D2 — `asOf` is a **window bound**, not a dead-chain signal. It cannot detect a stale cursor.

Raised for a ruling on the TIM-397 thread. **Rejected**, on the server source rather than on the
shape of the response.

On a following page the server does not compute `asOf` — it **echoes the client's own cursor field
straight back out**:

```ts
// server/src/modules/calendar-log/services/calendar-log.service.ts:65-67
const asOfText = cursor
  ? cursor.asOfText
  : (await this.repository.getSnapshotTime()).asOfText
```

(`emptyPage` does the same at `:111-113`.) So comparing a paged response's `asOf` against the cursor
it was fetched with is a tautology — always equal, for a cursor one second old or one year old. The
server never validates a cursor's `asOf` against anything: `decodeCursor`
(`server/src/modules/calendar-log/models/calendar-log-cursor.ts:100-120`) checks the version and the
field *formats*, and nothing else.

What `asOf` actually is: the snapshot bound `createdAt <= asOf` in the page SQL
(`repositories/activity-search.queries.ts`), carried through the chain so a log arriving mid-scroll
cannot shift the keyset window under the reader. That is its whole job.

### D3 — There is no "stale chain" failure mode. A rejected cursor is exactly one thing: **HTTP 400**.

Following from D2. An old cursor is not degraded — it is bound to an old watermark, so it serves
rows strictly older than that watermark, which is precisely what "load older" wants. A cursor
persisted across an app restart, or across a week, still pages correctly.

So the spec's "if the server later rejects a stored cursor" narrows to a single, testable trigger:
`BadRequestException("Invalid cursor")` → **400**, raised only for a non-base64url value,
unparseable JSON, `v !== CALENDAR_LOG_CURSOR_VERSION`, or an anchor field failing its format check.
The realistic production trigger is a **cursor-version bump**, which invalidates every persisted
cursor on every device at once.

Coordinator rule: **on 400 from the older-page path — and only on 400 — clear `olderPageCursor` and
restart the chain from the newest page.** Never infer chain death from `asOf`, from an empty page,
or from a `null` `nextCursor` (that one means "final page", not "dead chain"). The 400 body message
is a constant that never echoes the submitted cursor (`calendar-log-cursor.ts:14`), so it is safe to
classify on status alone — and it must be, since nothing else distinguishes it.

A 400 on the **newest-page** path is a different animal and must not be routed into cursor
recovery: that request carries no cursor, so a 400 there means a contract violation (a token count
above 100, a malformed `unreadSince`). It is recorded as unexpected and changes no stored state.

### D4 — A missing `unreadCount` means *leave the stored count alone*, never *zero*

`unreadCount?: number` is optional. `countUnread` returns `undefined` whenever `unreadSince` is
absent **or** a cursor is present (`calendar-log.service.ts:131-147`), so every older page omits it.
Coalescing absent → `0` would silently clear the badge on **every** older-page load. The store must
branch on presence, not coalesce. Ticket 3's `writePageIn` already does exactly this
(`repository.ts:210` — `write.unreadCount ?? current.unreadCount`); this decision is what stops the
coordinator from handing it a `0` it should never have computed.

One trap the generated doc comment does not capture: on a **zero-token** device the first page
returns `unreadCount: 0` even when `unreadSince` was **not** sent (`emptyPage`, `:121` —
`cursor ? undefined : 0`). The value is arithmetically correct, but presence of the field is not
proof the client asked for it. **The coordinator sets `unreadCount` on the write only when the
request it just sent actually carried `unreadSince` — it branches on the request, never on the
response.** D6 makes the zero-token page unreachable, so this rule is defence in depth for that
case; it is load-bearing on its own for every older page.

### D5 — `lastReadAt` is the server's `asOf` (confirming the spec, and D2 does not weaken it)

The spec already rules this (activity-revival.md:350): `lastReadAt` is a server-issued `asOf`, never
a device clock reading, so a misconfigured phone clock cannot permanently hide or inflate unread
changes. D2 removes one *use* of `asOf` (chain-death detection, which never existed); it leaves the
three real ones intact:

1. the read watermark sent back as `unreadSince` — server-clocked, so it is monotone against the
   same clock `countUnread` compares to (`createdAt > unreadSince AND createdAt <= asOf`);
2. the one-year retention bound (activity-revival.md:282);
3. the intra-chain page bound (D2).

Take `asOf` from the **newest-page** response only. A following page's `asOf` is the echoed cursor
value (D2) and is therefore older than the chain's own first page — using it as a watermark would
walk the read marker backwards. This coordinator never writes the watermark at all (D11); the rule
binds Ticket 5, which does.

### D6 — **No Activity request is issued with zero calendar tokens, on either path**

Raised by the Applier (badge wipe) and extended by the Reviewer (older-page chain death). Both are
accepted, and they are one guard.

`searchV1` short-circuits on an empty token array **before** it distinguishes a first page from a
following page:

```ts
// calendar-log.service.ts:58-60 — after decodeCursor, before everything else
if (payload.tokens.length === 0) {
  return this.emptyPage(cursor)
}
```

`tokens` carries `@IsArray` / `@ArrayMaxSize(100)` / `@IsString({each})` / `@IsNotEmpty({each})` and
**no `@ArrayNotEmpty()`**; `openapi.json` publishes no `minItems`; the generated type is
`tokens: string[]`. So `tokens: []` is a deliberate `200`, and nothing in the contract or the
generated client will stop the client sending it. The guard has to be ours.

Two distinct, unrecoverable-in-different-ways consequences:

- **Newest page — the badge wipe.** `emptyPage` returns `unreadCount: 0` (`:121`) without ever
  reaching `countUnread`; the server has a test naming this exactly
  (`calendar-log-v1.controller.test.ts:165-177`, asserting `countSpy` is never called). A passive
  refresh sends `unreadSince`, so D4's request-branching rule evaluates to *I asked for it,
  therefore accept it* → stores `0` → the badge is cleared on a device that has unread activity.
  D4 alone does not catch this; it licenses it.
- **Older page — permanent chain death.** The response is a `200` with `nextCursor: null`. In
  Ticket 3's `writePageIn`, `storeOlderPage` passes `mode: "older"`, so
  `keepPosition = mode === "newest" && …` is **unconditionally false** (`repository.ts:200-203`) and
  the write sets `olderPageComplete: true` (`:206-208`). Nothing ever clears it: the newest-page
  path deliberately keeps a completed chain complete, and the only writer of
  `olderPageComplete: false` is `clearOlderPageCursor()`, which fires only on a **400** (D3). A
  zero-token page is a 200. The student can never load older history again — not after tokens
  return, not after a re-sync, not on a later launch, not short of clearing the database.

**Rule.** A newest-page or older-page request is issued only when the device's unique token count is
**between 1 and 100 inclusive**. Outside that range no request is issued, no page is written, no
prune runs, `lastSuccessfulRefreshAt` does **not** move, and the operation resolves with a
`"no-calendars"` (or `"too-many-calendars"`) outcome. Because the freshness timestamp does not move,
the next trigger retries as soon as tokens exist rather than being suppressed for five minutes.

The upper bound is the same guard, not a second one: above 100 unique tokens the server answers
`400` unconditionally, so issuing is a guaranteed failure that a trigger loop would repeat. One
precondition covers both ends of the contract's stated range.

This is also free capacity: every zero-calendar device stops issuing a round trip per trigger, which
is the risk this epic exists to contain.

**Do not implement it by ignoring `nextCursor: null` on older pages.** That is the legitimate
final-page signal, and suppressing it re-opens exactly the infinite-restart bug D3 closes. The guard
belongs on the request precondition and nowhere else.

**The watermark channel needs no third guard.** `writePageIn` stores
`unreadCount: write.unreadCount ?? current.unreadCount` and never touches `lastReadAt`
(`repository.ts:210-212`). Only `markActivityRead` / `markActivityReadFromCache` advance the
watermark, and those are Ticket 5's screen. A refresh cannot walk the read marker forward.

### D7 — An empty token list is authoritative only when a **removal supplied it**

D6 has a cost that must be paid explicitly, not left implicit. The ownership prune — "removing a
held calendar removes its cached Activity history on that device" (spec, Security and privacy;
Mobile state behavior) — lives inside `writePageIn` and therefore only runs on a page write. D6
suppresses the page write when the device holds no calendars, so a student who removes their **last**
calendar keeps that calendar's Activity rows cached, and Ticket 5's screen would render history for
a calendar they no longer hold.

The tempting repair — "when tokens resolve empty, run the prune locally instead of the request" — is
wrong, and it is wrong for D6's own reason. The coordinator **cannot distinguish** a genuinely empty
device from a `findAll()` that raced the sources table: `findAll` has no loaded/unloaded distinction
(only the `useUserCalendarsLoaded` hook carries one, and a non-component coordinator cannot call a
hook). Pruning on a spurious-empty read destroys the whole cache — strictly worse than the badge
wipe, and unrecoverable in the same way as chain death.

So the distinction is **who supplied the list and why**:

- A coordinator's speculative `findAll()` before a refresh is **not** authoritative. Empty → skip
  everything (D6).
- A **calendar-removal event** supplies the authoritative post-removal set. Empty there genuinely
  means "no calendar is held", and clearing is correct.

This change therefore adds one repository operation — `pruneToHeldCalendars(heldCalendarIds)`: the
ownership prune alone, in one transaction, writing no state, requiring no server `asOf` — and
exposes it as a coordinator operation. It is not called from inside this ticket. Wiring calendar
removal to it is trigger integration, which is [TIM-399](/TIM/issues/TIM-399) (Ticket 6), matching
this ticket's own out-of-scope line: *"this ticket exposes the public operations those triggers will
call, and nothing more."* Ticket 6's brief names sync, push, open and foreground but not removal;
that gap is flagged on TIM-399 rather than silently absorbed here.

### D8 — Single-flight and freshness are a module-level promise, **not** TanStack Query

Architecture decision 6 *permits* TanStack Query for in-flight dedup ("may"). This change declines
it, for four reasons that are properties of the callers, not preferences:

1. **The callers are not components.** Calendar sync, the push handler and the app-lifecycle
   listener call the coordinator from plain modules. `useMutation` is a hook and is uncallable
   there; reaching the dedup without a hook means threading a `QueryClient` singleton into
   non-React code.
2. **`fetchQuery` dedup writes to the query cache**, and the ticket forbids adding Activity to the
   persisted school-selection cache. Not using the cache at all is a stronger guarantee than
   configuring it not to persist, and it is testable as an import-level fact.
3. **The freshness clock must survive process death.** `lastSuccessfulRefreshAt` is a SQLite column
   (Ticket 3); TanStack's `dataUpdatedAt` is in-memory and resets on every cold launch, which would
   make "refresh when last success is older than five minutes" fire on every launch.
4. The generated **plain function** `calendarLogV1ControllerSearchCalendarLogs` already routes
   through `customFetch`, the single mutator seam (`data.md`). Consuming it keeps the one-mutator
   rule intact with no query layer in between.

Shape — two independent slots, so older-page loading can never block a forced newest-page request
(architecture decision 7):

```ts
let inFlightNewest: Promise<ActivityRefreshOutcome> | null = null
let inFlightOlder: Promise<ActivityOlderPageOutcome> | null = null
```

Ordering inside `refreshNewestPage({ force })`, and the ordering is the correctness argument:

1. If **not** forced, read state and return `"fresh"` when `lastSuccessfulRefreshAt` is within five
   minutes. This happens **before** the slot is consulted, so a passive trigger that is satisfied by
   freshness never publishes a resolved promise that a later forced trigger could join and mistake
   for a completed request.
2. Then `if (inFlightNewest) return inFlightNewest`.
3. Otherwise assign `inFlightNewest = run()` **in the statement immediately following the check**,
   with no `await` between them, and clear the slot in `finally` (only if it is still the promise
   this call assigned).

Step 3's adjacency is what makes single-flight hold: JavaScript is single-threaded, so no second
trigger can interleave between the check and the assignment. Two concurrent passive triggers each
await their own state read, then resume one at a time — the first assigns, the second joins. Exactly
one request. A forced trigger arriving during a passive request joins it rather than issuing a
second, which is what architecture decision 7 requires.

A joined caller receives the same outcome as the caller that issued the request, including its
failure classification. Forced-ness is not re-evaluated on join: the request that is already in
flight is the request everyone gets.

### D9 — Read tokens through `findAll()`, take every calendar, hidden ones included

The coordinator reads `findAll()` from `@/features/calendar-sources/data` — the sibling feature's
**data sub-barrel**, which is what the ticket means by "the calendar-sources public data seam".

Note the exact import path, because the obvious one is wrong: `findAll` is deliberately **not**
re-exported by the feature-level barrel `@/features/calendar-sources/index.ts` (that barrel carries
the hooks and `addCalendarFromToken`, not the repository reads). Importing a sibling's sub-barrel
directly is also precisely what B-2 sanctions — *"a feature sublayer must not import its own
feature-level barrel (cycle); it imports a sibling's sub-barrel directly"*
(`mobile/eslint.config.js`). So the correct edge is sublayer → sibling sublayer, not
sublayer → sibling feature barrel.

`findAll()` returns `UserCalendar[]`, carrying both fields the coordinator needs (`token`, `id`), so
this is one read, not two.

`findAll` has no loaded/unloaded distinction — only the `useUserCalendarsLoaded` **hook** carries
one, and a non-component coordinator cannot call a hook. That is the fact D6 and D7 are built on:
an empty result is indistinguishable from an unloaded one, so it can only ever mean *skip*.

- `tokens` = the **unique** `token` values. The server deduplicates anyway, but deduplicating
  client-side is what makes D6's 1–100 precondition count the same things the server's
  `@ArrayMaxSize(100)` counts.
- `heldCalendarIds` = every `id`, passed to the repository as `ActivityPageWrite.heldCalendarIds`.

**`visible` is not a filter.** A hidden calendar is still held. Filtering on `visible` would drop its
id from `heldCalendarIds`, and the ownership prune would then delete that calendar's entire Activity
history the first time the student hid it. Hiding is a display preference; the ownership prune is
about what the device owns. The two must not be conflated, and a test pins it.

This is the only cross-feature read in the module, and it points **outward** —
`activity/data → calendar-sources/data` — keeping the graph in architecture decision 6 acyclic.

### D10 — Error classification distinguishes *what failed*; the caller decides *who sees it*

The spec names five classes: passive, visible, network, malformed-response, SQLite. **Passive and
visible are properties of the trigger, not of the error** (see the trigger table: the same network
failure is silent after a sync and visible on pull-to-refresh). So the coordinator classifies the
*fault* and returns it; visibility is Ticket 5's and Ticket 6's decision at the call site. Encoding
visibility here would force the coordinator to know which surface is mounted, which is exactly the
dependency the seam exists to prevent.

Faults, and how each is recognised from the mutator's own error contract (`mobile/src/api/mutator.ts`):

| Fault | Recognised by | Effect on stored state |
| --- | --- | --- |
| `network` | any throw that is not an `ApiError` (RN `fetch` `TypeError`, the 15 s timeout abort, "Backend runtime is resetting") | none |
| `server` | `ApiError` with any status; on the older path a **400** is handled as cursor recovery first (D3) | none |
| `malformed` | a `200` whose `asOf` does not parse, or whose `items` / `nextCursor` are not the contract's types | none |
| `storage` | the repository transaction throws | none — the write is one all-or-nothing transaction |

Two consequences are structural rather than defended by a check:

- **A failure can never move `lastSuccessfulRefreshAt`**, because that column is written only inside
  the successful page-write transaction (Ticket 3). "A passive failure does not move
  `lastSuccessfulRefreshAt`, so a later trigger can retry" needs no separate guard.
- **A failure can never lose cached rows**, for the same reason.

`asOf` is validated before the write rather than trusted, because it is the trusted clock for the
one-year prune. Ticket 3 degrades gracefully on an unorderable value (it skips the prune), but
writing a page whose snapshot time is nonsense and calling it a success would move the freshness
timestamp on a response we could not read. A malformed page is not a success.

**Recording.** `network` and `server` are expected conditions on a phone and are **not** recorded —
routing them to Crashlytics would bury real faults under captive-portal noise. `malformed`,
`storage`, and a newest-page `400` (D3) are recorded once through `@/firebase`'s
`recordUnknownError` with a **static context string** (`"activity/refresh"`, `"activity/older-page"`)
and no payload: no token, calendar name, calendar id, log id, cursor value, request body, or event
content. A negative test pins it.

The dev-only request/response `console.log` in `customFetch` (`mutator.ts`, `__DEV__`-gated, with
payload redaction only for `/contact`) is pre-existing, is stripped from release builds, and is not
changed here. It is named so a reviewer does not read its absence from this change as an oversight.

### D11 — The coordinator never rejects, and never writes the read watermark

**Never rejects.** `refreshNewestPage` and `loadOlderPage` resolve with a discriminated outcome for
every path, including every failure. This is the mechanism behind the acceptance criterion "a
calendar-sync success is never converted into a failure by an Activity refresh failure": a caller
cannot accidentally propagate a rejection it forgot to catch, because there is no rejection to
propagate. A test asserts the promise resolves under a throwing fetch **and** a throwing repository.

**Never writes `lastReadAt`.** The watermark belongs to the read action — `markActivityRead(asOf)`
and `markActivityReadFromCache()` — which Ticket 5 owns from the screen. This coordinator stores
`unreadCount` (D4) and never the watermark, so a background refresh cannot mark unseen changes as
read. Ticket 3 already enforces it at the storage layer; stating it here keeps a later "just advance
it while we're here" from looking reasonable.

`markActivityRead` takes the server `asOf` as a parameter, so D5's rule survives into Ticket 5: an
unparseable value leaves the watermark alone rather than falling back to the device clock.

### D12 — Page size stays at the frozen budget of 50, as an explicit named constant

[TIM-394](/TIM/issues/TIM-394) measured the capacity budget against a 50-log page (p99 ≈ 981 KB
before transport compression), and [TIM-401](/TIM/issues/TIM-401) gates the release against that
same figure. Choosing a different page size here would invalidate the measurement the epic is
budgeted on, so the size does not move in this ticket.

It is nevertheless sent **explicitly** rather than left to the server's default. The default lives
in the server DTO; a named client constant with the measured p99 in its comment is the one number
Ticket 8 changes if the capacity gate says to, and it makes the client's request self-describing in
a capture. Relying on a server-side default would put the client's payload size outside the client's
own source.

## Risks

- **A trigger loop on a device with no calendars.** Closed by D6 at the request precondition, and
  the non-movement of `lastSuccessfulRefreshAt` means the skip is not cached — the retry is
  immediate once tokens exist, with no request spent in between.
- **The removal prune is exposed but not wired** (D7). Until Ticket 6 calls it, a student who removes
  their last calendar keeps stale rows in SQLite. Nothing renders them yet (Ticket 5 ships the
  screen), so this window closes before it is user-visible — provided TIM-399 picks it up, which is
  why it is flagged there rather than only here.
- **The single-flight argument rests on adjacency** (D8, step 3). A later refactor that inserts an
  `await` between the check and the assignment silently reintroduces duplicate requests without
  failing any type or lint check. The concurrency test is the only thing that catches it, so it must
  drive both callers through a controllable deferred fetch rather than relying on timing.
