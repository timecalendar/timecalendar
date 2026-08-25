# (HUMAN: apply and witness the isolated TimeCalendar alert route)

This is the human-only production step for the rentrée alert-delivery investigation.
The analysis and exact route/test/rollback procedure live in
`docs/investigations/2026-08-25-rentree-prod-health/07-alert-delivery.md`.

## Why human action is required

- The change owns Grafana's shared root notification-policy tree through Terraform.
- A mistake can email the wrong tenant's alerts or mute every tenant.
- The TimeCalendar issue explicitly requires human review and a human-applied Terraform
  change.
- The controlled test sends a real message to the configured contact mailbox and needs a
  human recipient to acknowledge it.

## Required sequence

1. Confirm who actively owns the configured `email-oncall` mailbox and can acknowledge
   the test and future pages.
2. Review a platform PR that adds only the ordered, TimeCalendar-folder child route
   documented in the investigation. Keep the existing catch-all mute after it.
3. Require a Terraform plan with one in-place notification-policy update and no other
   resource changes.
4. Apply that saved/reviewed plan manually.
5. Verify the live policy has the unmuted TimeCalendar route first and the unchanged
   catch-all muted route second.
6. Send the bounded synthetic `ticket` alert from the investigation runbook. Record
   Grafana receipt, mailbox receipt, human acknowledgement, and resolved timestamps.
7. Re-query Chaster and BoardBot routing. Both must still carry
   `all-time-temporary-cha180`.
8. Decide and file the platform work that creates the first real TimeCalendar rules.

Do not close the alert-delivery issue based only on the synthetic test: the live audit on
2026-08-25 found zero TimeCalendar alert rules, so ongoing detection is still absent.
