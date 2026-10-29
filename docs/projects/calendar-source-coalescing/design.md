---
kind: design
status: draft
---

# Proposed target design

This is an exploration proposal, conditional on product and D01–D03 approval.

## Current context and constraints

See [evidence](research/evidence.md). Per-calendar claims, parse/event transforms, content
and log transactions, subject updates, failure accounting and response hydration remain
owned by the existing calendar flow. Only download work is shared (P01).

## Target architecture

Resolve strategy and transform the URL exactly as today, then derive an immutable request
identity before entering a download coordinator. The coordinator returns immutable bytes
and fetch metadata, never mutable parsed events or calendar entities. Every consumer parses
its own bytes, runs its own strategy pipes and cancellation filter, and persists independently.
No HTTP or Redis wait belongs inside a database content/log transaction.

D01 identity is an unambiguous, versioned encoding of strategy ID, explicit strategy version,
exact transformed URL, and fully resolved fetcher options (retry policy, proxy enabled and
proxy configuration revision, and any future response-affecting headers/options). Include
an identity-schema version and environment namespace. Hash the complete encoding for bounded
opaque keys. Never strip userinfo, query credentials, reorder queries or discard parameters
as a coalescing optimization. Equivalent stored URLs can resolve differently; different
stored URLs can share only after exact effective identity matches.

An explicit version changes when selection/renaming behavior, downloader/validation contract,
retry policy, relevant configuration or parsing eligibility changes. Generic fallback must
also include the version of its complete renamer chain. Unknown version/configuration or
unsupported fetcher means bypass. Mixed deployments use separate keys; old keys expire.

Until TIM-573 is verified on the delivery baseline, non-null customData is ineligible for
sharing. Do not infer safety from a production count. If non-URL authentication is introduced
later, bypass until an explicit credential partition and rotation policy is approved.

## Success eligibility and failure classification

The current retry loop includes parsing. Splitting download from parse must not make HTTP
200 HTML, empty feeds or malformed iCalendar reusable successes. Proposed rule: the leader
validates the downloaded bytes with the current parser/empty-event rules before admission;
only bytes are published. Each consumer still independently parses and transforms them.
The extra leader validation has CPU cost but preserves successful-data semantics. Do not
share parser objects. School-specific post-parse filtering remains a per-calendar outcome.

Keep current terminal/transient classifications, Retry-After and total attempt budget.
Network failures, invalid/empty bodies and cancellations create no cached result. A local
follower can observe a failed flight, but handles it in its own calendar failure path;
distributed followers see no result and may retry only within their original deadline and
attempt budget. Do not add a negative cache or stale-on-error behavior.

## Redis coordination and lifetime

D02 proposes one namespaced result key and one expiring lock per exact identity. Look up a
fresh result, acquire an owner-token lease on miss, and recheck the result after acquiring.
The leader downloads and validates. Publish bytes plus schema/version, retrieval timestamp,
size and absolute expiry only while atomically verifying the lock's owner token; release
with the same ownership check. A late owner must never overwrite a newer result. Failed
publication still lets that caller use its own valid bytes without caching them.

Followers wait using bounded, jittered result checks and their existing deadlines. A lost
notification cannot hang a waiter; any notification would only be an optimization. Redis
latency has a small bounded budget inside the existing fetch deadline. Lock lifetime must
cover the 9-second fetch budget plus bounded validation/publication; timeouts and payload
limits bound that extra work. Lease loss causes bypass or failure within remaining budget,
never an unfenced publish. Crashes and Redis failover can cause duplicate HTTP requests;
this is a performance optimization, not an exactly-once guarantee.

A caller cancellation detaches that waiter and preserves its existing claim-restoration
semantics. It must not abort transport still needed by other callers. Use a coordinator-owned
bounded transport lifetime rather than the first caller's signal. Across pods, it is acceptable
to finish that bounded download after the initiating caller disconnects. Cancellation still
prevents that caller entering a new database transaction; an entered transaction settles.

Use an absolute, non-sliding freshness limit measured conservatively from request start.
Cache hits, follower reads and republishing cannot refresh it. Start around 120 seconds,
strictly below the strategy's minSyncIntervalMinutes; if the configured cap is invalid,
bypass. Account for time spent downloading and validating before publication. Treat malformed,
unknown-version, expired or oversized entries as misses. Rollback disables lookups and
publication; old keys expire without a broad Redis flush.

## Data and contracts

No new source table, source membership relation, migration, public DTO, endpoint or generated
client change. Calendar names, tokens, events, change logs, subjects, timestamps and errors
remain calendar-owned. One calendar's failed commit cannot invalidate another's successful
commit or turn a valid download into a failed source. Database write savings are not claimed.

## Security and integrity

Full calendar URLs remain allowed. Exact URL identity retains embedded credentials; the
proposal is not a URL-cleanup project. Opaque keys do not make cached response bodies public
or anonymous: existing Redis access controls apply, retention is short, and no body or URL
is placed in metric labels. Preserve existing request validation/proxy/redirect behavior;
no cache hit should bypass the same eligibility and strategy resolution checks.

## Failure handling and operations

Use a dedicated prefix or logical DB, plus explicit admission limits on entry bytes, total
cache bytes, live keys and waiters. A prefix/DB is a naming boundary, not an independent
memory or eviction pool. Do not change shared Redis global eviction policy to support this
cache. Bound metadata as well as payloads; expired-entry accounting must be reconciled so
stale reservations cannot permanently exhaust admission. If trustworthy headroom/admission
cannot be established, remain in shadow or bypass mode rather than risking BullMQ.

Size candidate budgets from measured payload distribution and distinct active keys:
resident cost is payload bytes plus key/envelope/allocator overhead, locks, shadow metadata
and transient serialization copies. Cap single entries; report bypass for large feeds.
Redis outage, cache admission rejection or corruption falls back to bounded independent
fetching, subject to existing concurrency/attempt limits. A short circuit-breaker bounds
repeated Redis failures. Cold-cache and fail-open traffic may approach today's upstream
load; monitor burst rate and errors rather than assuming coalescing remains available.

## Observability and evidence

D03 requires TIM-574 validated across at least two replicas before trusting shadow metrics.
At each eligible download demand, atomically observe and update the previous-fetch timestamp
for the exact key in bounded Redis metadata. Record age buckets at 30, 60, 120, 300, 600,
1800 and 3600 seconds plus overflow; record first-seen/missing/evicted samples separately.
Tag school and trigger (user/cron/create), with bounded strategy/outcome labels. Propagate
trigger explicitly through creation, user sync and queue entrypoints. Record download byte
size with documented encoded/decoded semantics and estimated Redis serialized size.

Previous-demand gaps alone overestimate a non-sliding cache: frequent hits would keep the
gap small without refreshing its true expiry. Supplement the required histogram with
per-key simulated last-success/publication expiry for candidate windows, and count concurrent
in-flight opportunities separately. Failed fetches must not advance simulated successful
cache lifetime. Shadow never serves bytes or suppresses requests. Bound metadata retention
past the 60-minute bucket horizon and report missing history rather than treating it as zero.

Count eligible demands D, actual network attempts A (including retries and fallback), successful
cache hits H, successful flight joins J, bypass reasons, lease losses, errors, reuse age,
wait time, Redis latency/admission/bytes and existing calendar outcomes. Count transport
attempts only at the actual network owner; do not replay onAttempt for followers. Preserve
calendar outcome counters separately from transport counters and active-network gauges.

Report H/D and J/D as attribution, not the sole saving claim. Compare A/D with a comparable
bypass cohort by school/trigger and retry mix; estimated reduction is
1 - (A_live/D_live)/(A_bypass/D_bypass), with sample sizes and uncertainty. Assign cohorts
consistently by effective key so duplicate calendars cannot contaminate control and treatment.
Also report absolute attempts/bytes, exclusions and overall coverage. A lower attempt rate
caused by new failures is not success. Re-run measurement when cron becomes enabled.

## Rollout and rollback

See [staged plan](roadmap.md). Separate off, shadow and allowlisted live modes. Operational
activation requires its own authorization. A kill switch bypasses every sharing layer,
drains bounded flights and leaves independent calendar handling intact; TTL cleans entries.
No restore/backfill or database rollback is needed. The owner retains the decision to expand.

## Verification strategy

CI should test exact credential distinction, transformed windows, strategy/config versions,
two-pod contention, stale owner publication, TTL non-extension, Redis outage/eviction,
oversized bodies, malformed/empty responses, cancellation, retry classifications and isolated
calendar transactions. Reviewer evidence must demonstrate actual HTTP request counts, not
just coordinator mock calls. Reconcile existing sync/fetch test fixtures on current main.

## Decision index

D01: download identity and validation. D02: Redis coordination and limits.
D03: trustworthy measurement and gated rollout. All remain proposed.

## Open risks

Headroom, payload cap, school allowlist and numeric rollout tolerances require shadow data.
TTL below the sync interval still increases possible content age; owner review must accept
that bounded tradeoff. No API/client change is expected, but verify contract drift in delivery.
