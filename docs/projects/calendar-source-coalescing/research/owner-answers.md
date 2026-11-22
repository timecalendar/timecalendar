# Owner question and answer record

Source: TIM-541 owner response, relayed on the owner's request on 2026-09-27. This is a
sanitized substantive record; attribution and the original structured response remain on
the investigation issue. No direct production access was used by this investigation.
Questions below summarize the first round; answers preserve the supplied meaning.

| Question | Answer | Planning consequence |
| --- | --- | --- |
| Should same-URL calendars remain independent? | Retrieval-only sharing. | Keep every calendar's identity, content, change detection and persistence independent. |
| What makes sharing safe? | Wrap upstream download only; split IcalFetcher download from parseIcal. Key by strategy, strategy version, transformed URL and fetcher options including proxy and retries. | D01; no parsed-event cache or stored-URL-only key. |
| Are authenticated sources used? | Owner verification dated 2026-09-27: 0 of 505,445 calendars have non-null customData; no auth key; clients send null. TIM-573 separately removes the server Basic-auth path while clients retain the field. 56 active calendars have credentials embedded in URLs. | Exact effective URL must retain credential distinctions; exclude custom auth until cleanup is verified. These are owner-reported facts. |
| What cache lifetime is acceptable? | Choose from data, not upfront. Background cron is off; on-access duplicate arrivals are spread over the interval. Measure age of previous same-key fetch per school and user/cron/create trigger, with histogram buckets around 30s, 1m, 2m, 5m, 10m, 30m and 60m, plus response sizes. Start live around 2m, cap below each strategy's sync interval and re-measure when cron starts. | D02/D03; do not assume 30s overlap captures the opportunity. |
| What consistency/failure behavior is acceptable? | Share successful bytes only. | Never cache failures or serve stale data after expiry; parsing and calendar writes remain separate. |
| What rollout tolerance is acceptable? | Shadow measurement followed by allowlisted rollout. | No broad enablement before evidence and explicit rollout authorization. |
| Is a persistent source model acceptable initially? | Redis only, expiring keys, no table/migration. Own Redis DB or prefix with bounded memory because BullMQ shares the instance. | D02; a namespace is not a physical memory isolation guarantee. |
| What defines success? | Safe, measurable reduction. | Compare actual network attempts and safety outcomes; no invented fixed reduction target. |

TIM-574 (DELTA temporality for app metrics) is an owner-identified prerequisite for reliable
shadow measurement because current replica series collide. Completion/deployment of either
prerequisite was not established here. Owner answers do not authorize their implementation
inside this exploration.
