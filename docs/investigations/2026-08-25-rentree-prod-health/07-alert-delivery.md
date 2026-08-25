# Alert delivery is globally muted, and TimeCalendar has no alert rules

## Symptom

No owner was notified while the TimeCalendar production failures described in this
investigation were occurring.

The shared Grafana instance evaluates alert rules, but its only managed notification
policy sends every Grafana-managed alert through an always-on mute timing. In addition,
the TimeCalendar Grafana folder contains dashboards but no alert rules. Removing the mute
globally would therefore page for Chaster and BoardBot while still providing no ongoing
TimeCalendar detection.

## Evidence

Read-only checks were run on 2026-08-25 at 18:20 UTC against Grafana 11.6.1 in the
`do-fra1-cluster01` `observability` namespace and against platform `origin/main` at
`edbcbc0a7315b5e38393572483ab1770e3b82742`.

- `terraform/envs/observability/contacts.tf` defines one `email-oncall` contact point,
  an `all-time-temporary-cha180` mute timing from `00:00` to `24:00`, and a catch-all
  child policy matching `alertname =~ ".+"` with that mute attached.
- Grafana's provisioning APIs report the same contact point, mute timing, root policy,
  and catch-all child route. This proves the mute is live rather than merely present in
  source control.
- Grafana reports 22 provisioned alert rules: 18 in the Chaster folder and 4 in the
  BoardBot folder. It reports **0** in the TimeCalendar folder.
- The TimeCalendar Terraform declares four dashboards (service overview, calendar sync,
  notifications, and infrastructure) but no `grafana_rule_group`.
- Active Chaster and BoardBot alerts currently resolve to `email-oncall`; the catch-all
  route then suppresses delivery. This is why deleting the catch-all mute would change
  other tenants immediately.

No contact address, SMTP credential, or alert payload containing user data was copied
into this report.

## Root cause

The mute was introduced on 2026-06-03 by platform commits `6891cf3` and `e1b09c6` under
CHA-180 after reset-corrupted HTTP duration metrics produced alert spam. PR 17 later fixed
the corrupt metric path but explicitly retained the 24/7 mute while clean baselines
settled and burn-rate thresholds were validated.

The decision and repository changes are owned by Samuel Prak (`samuelprak`), who authored
the mute commits and PR 17. The configured destination is a single shared contact mailbox;
the repository does not define a rotation, secondary recipient, or automated
acknowledgement mechanism.

The second root cause is a configuration gap: TimeCalendar's June observability work added
dashboards only. There are no alert rules to generate a real TimeCalendar notification.
The rentrée investigation therefore exposed both a delivery failure and a detection
failure.

## Impact

- TimeCalendar production failures can only be discovered by someone opening Grafana or
  investigating independently.
- The same mute suppresses Chaster and BoardBot notifications. A global unmute risks a
  burst of existing active/no-data alerts from those tenants.
- Unmuting only TimeCalendar is safe for co-tenants, but it does not create detection;
  only a synthetic alert can traverse that route until TimeCalendar rules are added.
- Email delivery has no native acknowledgement. An operator can receive a message without
  Grafana knowing that someone owns the incident.

## Potential solutions

### 1. Add an isolated TimeCalendar child route and test it (recommended immediate step)

In `platform/terraform/envs/observability/contacts.tf`, insert a child policy **before**
the existing catch-all mute:

```hcl
policy {
  matcher {
    label = "grafana_folder"
    match = "="
    value = "TimeCalendar"
  }

  contact_point = grafana_contact_point.email_oncall.name
  group_by      = ["grafana_folder", "alertname"]
}
```

Keep `grafana_mute_timing.all_time` and the existing `alertname =~ ".+"` muted policy
unchanged after it. Grafana routes are ordered and stop after the first matching child by
default, so TimeCalendar bypasses the mute while every other folder continues to match
the catch-all muted route.

The human-reviewed Terraform plan must show exactly one in-place update to
`grafana_notification_policy.default`, with no changes to contact points, mute timings,
rule groups, dashboards, or any other tenant's resources. Terraform must be applied by a
human under the issue's merge gate.

After apply, post one synthetic alert to Grafana's embedded Alertmanager API with these
non-sensitive labels:

```json
[
  {
    "labels": {
      "alertname": "TIM-193 controlled route test",
      "grafana_folder": "TimeCalendar",
      "severity": "ticket",
      "component": "alert-delivery-test"
    },
    "annotations": {
      "summary": "Controlled TimeCalendar alert-delivery test",
      "description": "Synthetic test only; acknowledge using the TIM-193 runbook."
    },
    "startsAt": "<current UTC timestamp>",
    "endsAt": "<current UTC timestamp plus 10 minutes>",
    "generatorURL": "https://grafana-do-fra1-cluster01.lyrolab.fr/alerting/list"
  }
]
```

Use `POST /api/alertmanager/grafana/api/v2/alerts` from inside the Grafana pod with its
existing admin environment. Do not paste credentials into the command, shell history, or
evidence. Record the Grafana alert-group timestamp, the received-email timestamp, the
recipient's acknowledgement timestamp, and the automatic resolved notification. Do not
use the contact-point test endpoint: it bypasses the notification policy and therefore
does not prove this route.

Before and after the test, query the provisioning APIs and record this invariant:

| Folder | Expected route after change |
| --- | --- |
| TimeCalendar | `email-oncall`, no mute timing |
| Chaster | `email-oncall`, `all-time-temporary-cha180` |
| BoardBot | `email-oncall`, `all-time-temporary-cha180` |

Rollback is one Terraform apply that removes only the new TimeCalendar child policy. The
existing catch-all then mutes TimeCalendar again. Do not delete the shared contact point
or the CHA-180 mute timing during rollback.

### 2. Add the first TimeCalendar alert rules (required for actual restoration)

Create a separately reviewed platform change with TimeCalendar-scoped rules. At minimum,
cover production pod restart rate and HTTP 5xx/no-data behavior, and decide whether the
known-broken `calendar_sync_total` series is safe enough for a rule before using it. Every
rule must carry `severity = "page"` or `severity = "ticket"` and live in the
`TimeCalendar` folder so the isolated policy matches it.

This is required before saying TimeCalendar monitoring is restored. It is a scope
correction, not an application-instrumentation fix.

### 3. Remove the global mute (not recommended for this incident)

Deleting the catch-all child policy and mute timing is the old CHA-180 unblock note. It
would immediately alter all tenants and expose existing active/no-data alerts. It is
larger and less safe than an isolated TimeCalendar route.

## Severity, acknowledgement, and rollback runbook

- `page`: immediate human attention; acknowledge within 15 minutes. The mailbox owner
  records ownership in the incident thread before silencing anything. Repeat until
  resolved or explicitly silenced with an owner, reason, and expiry.
- `ticket`: acknowledge during the same operating day by opening/linking an issue and
  recording the owner. It may be grouped at the current policy interval and repeated
  every 4 hours while firing.
- Current limitation: both severities use the same email contact point. Grafana email has
  no acknowledgement callback, so the incident/issue timestamp is the evidence of ack.
- A silence is not an acknowledgement. Use a bounded silence only after ownership is
  recorded; never recreate a 24/7 catch-all silence for a single noisy rule.
- Route rollback: remove only the first, TimeCalendar-specific child policy and apply.
  Rule rollback: pause or revert only the faulty TimeCalendar rule; do not change the
  shared root route, contact point, or another tenant's policy.
