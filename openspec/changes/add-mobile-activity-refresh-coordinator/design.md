## Context

Ticket 4 of the Activity revival epic ([TIM-397](/TIM/issues/TIM-397), epic
[TIM-389](/TIM/issues/TIM-389)). Authoritative spec:
`docs/react-native-migration/05-tech-specs/activity-revival.md` (architecture decisions 6, 7, 8, 10
and **Mobile state behavior**).

This change adds `mobile/src/features/activity/data/` — the one bounded, offline-safe fetch and
pagination seam every Activity trigger shares.

> **Status: WIP — the network-contract decisions below are final; the persistence-seam sections are
> not yet written.** D1–D5 are derived entirely from the **v1 contract already merged on `main`**
> (`5f14a146`), so they cannot move when [TIM-396](/TIM/issues/TIM-396) lands. The repository-facing
> decisions and `tasks.md` are deliberately deferred until TIM-396's repository API is on `main`.

## Why these decisions are recorded before the proposal is finished

Three agents each spent a full round re-deriving the same v1 contract facts from each other's
comments, and two of those readings had already inverted by the time they were posted. Contract
facts belong in a committed file, not in a thread. Every claim below cites the source file and line
on `main` so the next reader verifies rather than re-derives.

## Decisions

### D1 — Do NOT regenerate the Orval client; **verify** it and consume what is already committed

`5f14a146 feat(server): calendar naming, token rename contract and RN client generation (#313)`
already generated and committed the v1 client. On `main` today:

- `openapi/openapi.json` — `POST /v1/calendar-logs/search` is present.
- `mobile/src/api/generated/calendar-logs/calendar-logs.ts` —
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

### D4 — A missing `unreadCount` means *leave the stored count alone*, never *zero*

`unreadCount?: number` is optional, present only on a request carrying `unreadSince` and no `cursor`
(`countUnread`, `calendar-log.service.ts:131-147`). Coalescing absent → `0` would silently clear the
badge on **every** older-page load. The store must branch on presence, not coalesce.

One trap the generated doc comment does not capture: on a **zero-token** device the first page
returns `unreadCount: 0` even when `unreadSince` was **not** sent (`emptyPage`, `:121` —
`cursor ? undefined : 0`). The value is correct (no calendars, nothing unread), but it means
presence of the field is not proof the client asked for it. **Branch on what the request sent, not
on what the response carries.**

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
walk the read marker backwards.

## Deferred — pending [TIM-396](/TIM/issues/TIM-396)

Not yet decided, because they are shaped by the repository API that ticket lands:

- the write path through Ticket 3's repository (transaction boundary, upsert identity, retention and
  cursor-advance ordering);
- single-flight and five-minute-freshness state ownership (TanStack Query in-flight dedup vs. a
  plain module-level promise) and the "never persisted in the school-selection query cache"
  constraint;
- error classification (passive / visible / network / malformed-response / SQLite) and the
  `lastSuccessfulRefreshAt` non-advance on passive failure;
- the calendar-sources public-data-seam read, and the B-1…B-4 boundary lint additions.
