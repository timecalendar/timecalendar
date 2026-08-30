# (HUMAN: Activity real-device verification)

This is the non-blocking physical-device check for Activity foreground and push
behavior. Automated evidence remains authoritative for the PR; this note can be
completed later and never blocks merge.

## Prerequisites and seed

- One supported iPhone, one supported Android phone, and an iPad in portrait for
  layout coverage; install a development-variant release build on each.
- Docker, Maestro 2.8.0, and a host address the phones can reach on port 3005.
- Notifications granted and a development Firebase registration token captured
  through normal debug tooling. Never paste that token into this repository.

From the repository root, start the supported isolated lifecycle (and later use
the same command with `logs` / `down` for diagnosis and teardown):

```bash
./ci/e2e-server.sh up
```

Build with `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3005`. On each phone, clear app
data, open `timecalendar-dev://dev-import?token=e2e-activity-baseline`, wait for
Calendar, then open Settings → Activity and confirm `E2E Activity Baseline Read`
renders. Return to Settings and confirm there is no unread badge. Open
`timecalendar-dev://dev-import?token=e2e-activity-calendar` without clearing app
data and wait for synchronization.

Expected: Settings announces “Activity, 52 unread changes”; opening Activity
shows the new/changed/cancelled fixture and clears the badge. Pull to refresh,
then scroll until `E2E Activity Tie Lower` and `E2E Activity Older Page` render;
the populated timeline must remain visible.

## Foreground checks

1. Leave Settings visible with no unread badge and background the app for at
   least six minutes. From the repository root, copy the seeded new-event change
   into one deterministic newer row in the isolated database:

   ```bash
   docker compose -f server/docker-compose.yml -f server/docker-compose.e2e.yml \
     exec -T postgres psql -U postgres -d timecalendar_test -c \
     'INSERT INTO "calendar_log" ("id", "calendarId", "calendarChange", "createdAt", "updatedAt") SELECT '\''40000000-0000-4000-8000-000000000999'\''::uuid, "calendarId", "calendarChange", now(), now() FROM "calendar_log" WHERE "id" = '\''40000000-0000-4000-8000-000000000101'\''::uuid ON CONFLICT ("id") DO UPDATE SET "createdAt" = now(), "updatedAt" = now();'
   ```

2. Foreground without tapping a notification. Confirm one refresh, the expected
   unread badge, the new row, and badge clearing after Activity opens.
3. Repeat with airplane mode enabled. Cached history must remain visible with a
   recoverable cached-error message; no history may be blanked.

## Push checks

Send through the development Firebase project only, targeted to the device's
registration token. Exercise the production-supported calendar-sync and
calendar-log notification shapes. FCM v2 data values are strings: a detail
message carries a lowercase change type and event inside the JSON-string
`payload`, while a digest carries a string count. For example:

```json
{
  "notification": {
    "title": "New class",
    "body": "E2E Activity New Lecture"
  },
  "data": {
    "action": "calendar_changed",
    "payload": "{\"type\":\"new\",\"event\":{\"uid\":\"e2e-activity-new\",\"title\":\"E2E Activity New Lecture\",\"location\":\"Room Activity New\",\"startsAt\":\"2026-08-29T10:00:00.000Z\",\"endsAt\":\"2026-08-29T11:00:00.000Z\"}}"
  }
}
```

```json
{
  "notification": {
    "title": "Schedule updated",
    "body": "3 changes in your schedule"
  },
  "data": {
    "action": "calendar_digest",
    "count": "3"
  }
}
```

On iOS and Android, check foreground, background, and cold-start delivery. A
calendar-related push refreshes Activity without duplicates. Tapping follows the
existing notification routing contract; after refresh, Settings shows unread
activity and opening Activity clears it. Store provider IDs and sanitized logs
outside the repository; never record registration tokens or personal schedules.

## Layout and accessibility

- iPhone portrait, iPad portrait, and narrow/low-end Android: scroll from newest
  through the following-page anchor; no clipped title, group header, spinner, or
  retry control.
- Enable the largest practical text size and repeat the badge and all row kinds.
  Text wraps, actions remain visible, and touch targets remain usable.
- With VoiceOver/TalkBack, Settings reads the exact unread count; new/changed rows
  are meaningful buttons; cancelled is not actionable; focus follows visual
  order; cached errors are announced.

## Results

| Platform/device/build | Foreground | Push foreground/background/cold | Pagination/layout | Screen reader/large text | Evidence |
| --------------------- | ---------- | ------------------------------- | ----------------- | ------------------------ | -------- |
| iOS                   | Not run    | Not run                         | Not run           | Not run                  |          |
| Android               | Not run    | Not run                         | Not run           | Not run                  |          |

Record date, OS/build, pass/fail, and sanitized evidence when complete. This
physical-device evidence never blocks the PR.
