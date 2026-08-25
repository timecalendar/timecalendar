# Rentrée 2026 production health investigation

Snapshot assembled on 2026-08-25 at approximately 18:15 UTC. It combines a fresh,
read-only Kubernetes, VictoriaMetrics, Tempo, VictoriaLogs and PostgreSQL snapshot with
the targeted live-feed checks from the originating investigation session. Counts are
point-in-time operational evidence, not permanent product analytics.

No calendar URL, query string, token, resource id or credential is included in this
report. Hostnames are retained where they are necessary to identify an affected school.

## Executive summary

Production is in a high-risk rentrée state:

1. The API and web still run commit `8df8e201…` from 2026-06-17, 39 commits behind
   `origin/main`. The build workflow publishes images but does not update the ArgoCD tag.
   Production therefore lacks the per-school sync planner and related migration, and its
   old five-minute cron deliberately does no work. Deploying `main` is not a routine tag
   bump: it would enable background sync and must be load-planned around schools such as
   Lyon 1.
2. The three API pods have restarted 15, 31 and 25 times. Eleven restarts occurred in
   the latest 24-hour metrics window. Peak working memory is about 410 MiB against a
   768 MiB limit, while Node event-loop delay reached 157.3 seconds. A retained Tempo
   trace shows `/calendars/sync` controller work lasting 150.3 seconds with repeated
   failed outbound operations at the ten-second timeout.
3. Calendar creation is failing at rentrée scale: 2,456 creations versus 2,112 failure
   rows over seven days, affecting 1,007 distinct submitted URLs. Narrow ADE date windows
   are a confirmed, generic cause; moved/dead hosts, web-UI links, upstream HTTP 500/TLS
   failures and timeout/retry amplification form distinct additional causes.
4. Of 19,573 calendars accessed in seven days, 2,897 (14.8%) have an explicit
   `lastDate` already in the past. Many keep old content after an empty/error sync, so the
   user receives no clear signal that the source is stale.
5. The telemetry cannot reliably page or localize these failures. The app counter claims
   3.18 million syncs/day because three replicas collide into series without a pod label;
   outbound HTTP traces have no peer/domain; no application logs reach VictoriaLogs; and
   the platform's Grafana notification policy is muted continuously.

## Findings and follow-ups

| # | Finding | Severity | Measured user/school impact | Confidence/status | Follow-up |
|---|---|---|---|---|---|
| 1 | [Production is not deploying `main`](01-prod-not-deployed.md) | Critical | All production traffic; background sync absent | Confirmed | [TIM-187](/TIM/issues/TIM-187) |
| 2 | [Pods restart during long sync work](02-pod-restarts-event-loop.md) | Critical | All users intermittently; 71 cumulative API-pod restarts | Retry amplification confirmed; CPU/JSON contribution still to profile | [TIM-188](/TIM/issues/TIM-188); [TIM-194](/TIM/issues/TIM-194) |
| 3 | [Calendar creation failures](03-calendar-creation-failures.md) | High | 1,007 distinct failed URLs in 7d; Tours, AMU and Rouen lead | Multiple causes confirmed | [TIM-189](/TIM/issues/TIM-189); [TIM-190](/TIM/issues/TIM-190) |
| 4 | [Existing calendars are stale](04-stale-calendars-expired-windows.md) | High | 2,897 of 19,573 recently active calendars | Expired windows confirmed; recovery UX absent | [TIM-189](/TIM/issues/TIM-189); [TIM-191](/TIM/issues/TIM-191) |
| 5 | [Observability and paging gaps](05-observability-gaps.md) | High | Operators cannot trust sync rates, group HTTP errors by school, query app logs or receive alerts | Confirmed | [TIM-192](/TIM/issues/TIM-192); [TIM-193](/TIM/issues/TIM-193) |
| 6 | [Per-school status](06-per-school-status.md) | Mixed | 47 school/no-school cohorts summarized | Database signals plus targeted live samples | Links above |

## Recommended order

1. Profile and bound `/calendars/sync` before increasing background traffic.
2. Prepare the release promotion and migration as a controlled rollout, including
   upstream per-school rate budgets and an explicit rollback.
3. Ship bounded, recomputed ADE date-window normalization; it benefits both new and
   existing calendars without rewriting stored private URLs.
4. Add school-specific import recovery and a first-class stale-source state in the
   React Native app.
5. Repair telemetry identity/log transport and restore alert delivery with a controlled
   test.

## Evidence and limitations

- Kubernetes evidence came from namespace `timecalendar-production`; observability data
  came from the `timecalendar` service with
  `deployment_environment_name="production"`.
- Database queries ran in `BEGIN TRANSACTION READ ONLY` through an existing application
  container because this run's Kubernetes service account cannot create the ephemeral
  psql pod from the runbook. Only aggregate counts and hostnames were emitted.
- `calendar_failure` has no school foreign key. Failure counts in the school matrix are
  therefore hostname matches, not authoritative school joins; `—` means “not reliably
  attributable,” not zero.
- `calendar_log` records successful syncs with changes, not every successful fetch. A
  zero can mean a dead/stale source or a legitimately unchanged timetable; it is a
  prioritization signal, not proof by itself.
- Tempo production sampling is 1% except errors. The retained long traces establish that
  the behavior exists, not its complete frequency distribution.
- Live-feed results are deliberately summarized without source URLs. Rechecking every
  school was avoided to limit upstream load during rentrée.

