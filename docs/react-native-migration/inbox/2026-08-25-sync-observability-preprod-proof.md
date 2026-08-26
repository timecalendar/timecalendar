# Sync observability preproduction proof

`(HUMAN: preprod/prod access)`

This is a deploy-time verification record, not a code-review blocker. Follow
[the server observability runbook](../../server/observability.md) after deploying the
candidate application image to preproduction. Production rollout remains a separate,
human-owned act.

## Synthetic procedure

1. Record the candidate SHA, environment, start time, and at least two running pod
   names. Confirm neither pod resolves to `service.instance.id=unknown`.
2. Submit one successful calendar sync against an approved reviewed provider fixture,
   one valid custom-host fixture, and one deliberately invalid/local-host fixture.
3. Submit one failing sync whose application error includes these exact synthetic
   canaries: URL `https://ade.ensea.fr/feed?token=synthetic-calendar-token-never-export`,
   email `student-observability@example.test`, and UUID
   `57d4181b-52dc-4c74-a8dd-2d3128f22471`.
4. Repeat a success on both pods, then restart one pod and repeat once. Do not use a
   real calendar token, credential, email, identifier, or event body.

## Expected evidence

- VictoriaMetrics: distinct non-`unknown` instance series; rate first, then aggregate;
  reviewed/custom/invalid domain buckets; only the restarted pod shows a reset.
- VictoriaLogs: one ERROR/FATAL application record found by service, preproduction
  environment, `CalendarSyncService`, bounded error type, and trace ID.
- Tempo: the same trace contains the HTTP server → `calendar.sync` → awaited outgoing
  HTTP/database hierarchy; no descendant ends after the HTTP server span and no
  Express middleware layer span appears.
- Negative searches across VictoriaLogs and Tempo return zero matches for the exact
  URL, token, email, UUID, raw host/path, credentials, cookies, bodies, and raw stack.
- The unexpected-domain VictoriaMetrics query returns no series.

Record screenshots/query exports, trace IDs, instance IDs, and timestamps on the
human-owned rollout issue. Stop production rollout on any mismatch. If the collector
does not promote `service.instance.id` or accept logs at the existing OTLP endpoint,
return to the Founding Engineer; do not modify global collector policy here.
