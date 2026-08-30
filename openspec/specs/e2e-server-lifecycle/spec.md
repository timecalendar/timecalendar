# e2e-server-lifecycle Specification

## Purpose
TBD - created by archiving change add-mobile-test-harness. Update Purpose after archive.
## Requirements
### Requirement: Compose-owned server lifecycle

The repository SHALL provide one shared script (`ci/e2e-server.sh`) that manages the e2e server stack — NestJS + Postgres + Redis — with Docker Compose as the lifecycle owner: a compose overlay defines the server as a service with a `/health` healthcheck and healthy-dependency ordering, so boot is `up --wait`, teardown is `down`, and logs are `compose logs`. No hand-rolled process-group management, readiness polling, or log-file juggling.

#### Scenario: up boots a healthy, seeded stack

- **WHEN** `ci/e2e-server.sh up` is run on a host with Docker
- **THEN** it ensures a Firebase dummy key exists, brings up Postgres, Redis, and the server with `docker compose up --wait` (the server reported healthy via `/health`), seeds `timecalendar_test` via a one-shot `compose run` of `db:init`, and exits 0 with the API serving on host port 3005

#### Scenario: down removes everything it started

- **WHEN** `ci/e2e-server.sh down` is run
- **THEN** the compose stack is stopped and removed, with no orphan server process possible by construction

#### Scenario: server logs are retrievable after a failure

- **WHEN** a test run fails and `ci/e2e-server.sh logs` is run (or the stack is still up via a keep-up flag)
- **THEN** the server's logs are printed from the compose service — no log temp-files to locate

### Requirement: Image-or-build seam for the server

The lifecycle SHALL build the server image from source by default (layer-cached) and SHALL accept a prebuilt image override (`E2E_SERVER_IMAGE`), so CI reuses the `build-server` artifact instead of rebuilding.

#### Scenario: Local runs build from source

- **WHEN** `up` runs with no `E2E_SERVER_IMAGE` set
- **THEN** compose builds the server image from `server/` (cached layers making repeat runs fast) and uses it

#### Scenario: CI injects the already-built image

- **WHEN** `up` runs with `E2E_SERVER_IMAGE` pointing at the loaded `build-server` artifact image
- **THEN** compose uses that image without building

### Requirement: Native mode for Docker-less hosts

The lifecycle SHALL support a `--native` mode for hosts without Docker (GitHub macOS runners): service provisioning (Postgres/Redis) is the caller's responsibility, while seeding, dummy-key generation, server boot from source, and `/health` readiness remain single-sourced in the script. Only provisioning may differ between modes.

#### Scenario: Native mode boots the same seeded server

- **WHEN** `ci/e2e-server.sh up --native` runs with Postgres and Redis already reachable on the standard ports
- **THEN** the script seeds `timecalendar_test`, ensures the dummy key, starts the server from source as a background process recorded in a pid file, waits on `/health`, and serves on the same port 3005 with the same env as compose mode

#### Scenario: Native down kills the recorded process

- **WHEN** `ci/e2e-server.sh down --native` runs after a native `up`
- **THEN** the pid-file process is terminated; on ephemeral CI runners teardown is best-effort by design

### Requirement: Deterministic seeded state, isolated test database

Every `up` SHALL start from a known state: the `timecalendar_test` database is dropped,
migrated, and seeded with the fixture set, never touching a developer's development database.

The seed SHALL include a token-addressable calendar under the constant
`E2E_CALENDAR_TOKEN = "e2e-smoke-calendar"` / `E2E_CALENDAR_ID` (returned verbatim by
`POST /calendars/sync` with a `syncPlannedAt` a day in the future, so no external iCal fetch
occurs), and that calendar's events SHALL include BOTH the existing week-anchored events AND a
**today-anchored** cluster on `now`'s UTC day with **at least two overlapping** timed events (for
column-packing on the calendar grid and the home mini-timeline), with **deterministic, ASCII-safe,
uniquely-titled** events the E2E flows assert and tap: at least one stable today-anchored event whose
details+checklist are reachable, and at least one stable today-anchored event that can be hidden then
un-hidden. The token/id SHALL remain constant so the mobile import deep link resolves the same
calendar.

The seed SHALL ALSO include a **second, dedicated** token-addressable calendar under the constants
`E2E_RENAME_CALENDAR_TOKEN = "e2e-rename-calendar"` / `E2E_RENAME_CALENDAR_ID`, carrying a
deterministic ASCII-safe baseline **name** that no other seeded calendar uses. It exists so the
rename round-trip flow can perform a durable server rename without mutating `e2e-smoke-calendar`,
whose name and events the other flows depend on within the same device session.

Because that flow renames it, this calendar's name is the one piece of seeded state a run mutates:
every `up` SHALL reset it to the baseline name, so repeat runs remain reproducible. Its id and token
SHALL remain constant so the dev-import deep link and the flow's row selector resolve the same
calendar. Its events are not asserted by any flow and SHALL be kept minimal.

The seed SHALL further add two dedicated Activity calendars with fixed IDs, tokens, names, event
content, calendar-log IDs, change payloads, and relative server timestamps:

- an older baseline calendar with one calendar-log row; and
- a newer Activity calendar with exactly 52 rows ordered so a 50-row page ends on the higher-ID
  member of a fixed same-timestamp pair and the next page begins on the lower-ID member.

The newer rows SHALL include stable new, changed, and cancelled items, deterministic filler rows,
the same-timestamp boundary pair, and an older-page anchor. Its new event and the changed item's new
event SHALL exist in current seeded calendar content, while the cancelled event SHALL not. Every
Activity title and location asserted by Maestro SHALL be ASCII-safe and unique.

The baseline row SHALL be older than all 52 newer rows. When its server timestamp is used as
`unreadSince` with both tokens, the real v1 search endpoint SHALL report exactly 52 unread rows.

#### Scenario: Repeat runs restore the Activity fixtures

- **WHEN** the test seed is run more than once
- **THEN** both Activity calendars and their content and log rows have the same fixed identifiers,
  names, payloads, ordering timestamps, and row counts
- **AND** prior E2E mutations do not change the restored baseline

#### Scenario: Repeat runs are reproducible

- **WHEN** `up` is run twice in a row
- **THEN** both runs end with `GET /schools` returning exactly the seeded fixture set, and the
  seeded `e2e-smoke-calendar` calendar returning the same deterministic events, regardless of
  what previous runs wrote

#### Scenario: The seed includes a today-anchored dense-overlap cluster

- **WHEN** the seed runs under `NODE_ENV=test` via `db:init`
- **THEN** the `e2e-smoke-calendar` calendar carries at least two overlapping timed events on
  `now`'s UTC day, plus stable uniquely-titled today events for the details/checklist and the
  hide/un-hide flows, all with ASCII-safe titles/locations

#### Scenario: The rename calendar is reset to its baseline name on every up

- **WHEN** a previous run renamed `e2e-rename-calendar` and `up` is run again
- **THEN** the calendar is seeded back to its baseline name under the same constant id and token

#### Scenario: The seeded first and older pages straddle a timestamp tie

- **WHEN** `POST /v1/calendar-logs/search` searches both Activity tokens with `limit: 50`
- **THEN** the first response contains 50 rows and a non-null cursor
- **AND** the following response contains the remaining two newer rows plus the older baseline row
  and a null cursor
- **AND** the two equal-timestamp rows occur exactly once each in descending-ID order on opposite
  sides of the page boundary

#### Scenario: The real endpoint computes the staged unread count

- **WHEN** the v1 search receives both Activity tokens and the baseline row's timestamp as
  `unreadSince`
- **THEN** it returns `unreadCount: 52`
- **AND** no response contains either calendar token

#### Scenario: Current details exist only for routable Activity items

- **WHEN** the newer Activity calendar is synchronized
- **THEN** current content contains the stable new-event UID and changed-event new UID
- **AND** it does not contain the cancelled-event UID

### Requirement: Boots without a real Firebase credential

The lifecycle SHALL satisfy the server's import-time service-account read with a generated throwaway key (`ci/generate-dummy-firebase-key.sh`), never committed, in both compose and native modes.

#### Scenario: The dummy key is generated when absent

- **WHEN** `up` runs and no `server/config/serviceAccountKey.json` exists
- **THEN** the shared generator creates a throwaway key (an existing developer key is left untouched) and the server boots with it

### Requirement: Base Compose configurability preserves the E2E overlay

The shared `server/docker-compose.yml` base SHALL remain compatible with
`server/docker-compose.e2e.yml` and `ci/e2e-server.sh` after local project isolation and
published-port overrides are added. The E2E lifecycle SHALL continue to address Postgres
and Redis by Compose service name and SHALL retain its existing explicit lifecycle owner.

#### Scenario: E2E resolved model remains valid

- **WHEN** Docker Compose resolves the base and E2E overlay files together
- **THEN** the model contains nginx, Postgres, Redis, and server with the existing health,
  dependency, bind-mount, and service-network contracts intact

#### Scenario: E2E lifecycle retains its own project handling

- **WHEN** `ci/e2e-server.sh` invokes its existing Compose function
- **THEN** it continues to own `up`, `down`, `logs`, and seed operations without being
  redirected through the local development entrypoint

