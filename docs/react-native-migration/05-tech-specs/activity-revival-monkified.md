# Activity revival, bedtime edition 🐵🌙

- **Paperclip research:** [TIM-275](https://paperclip.lyrolab.fr/TIM/issues/TIM-275)
- **Serious spec:** [activity-revival.md](./activity-revival.md)
- **Status:** Decisions made. Tickets not created yet.

## 🎯 The whole story

Students get an **Activity** screen.

It says:

- This class is new.
- This class changed.
- This class was cancelled.

It lives in **Settings → Events → Activity**.

It works offline.

It shows an unread number.

It does not download one giant year-long blob and melt the server. 🔥

```text
Server notices timetable changes
              |
              v
Server saves Activity history for one year
              |
              v
Phone asks for one small page
              |
              v
Phone saves it in SQLite
        |                 |
        v                 v
Settings badge       Activity screen
```

## 🕰️ Why Flutter hid it

Flutter already has Activity code.

But Activity has always been switched off.

TIM-275 found the reason.

It was a **server capacity problem**.

More students arrived. Old update jobs could not keep up.

It was **not** hidden because the Activity data was known to be wrong, unsafe, or ugly.

The server still creates Activity rows today.

A local test proved that new, changed, and cancelled events come back correctly.

The bad part is the old read API.

It can return the whole year in one huge answer. No page size. No bookmark. No mercy. 🫠

It also:

- accepts a broken `tokens` shape too quietly;
- sends secret calendar tokens back unnecessarily; and
- has no safe way to ask for older history a little at a time.

So we keep the useful history and replace the dangerous reading method.

## ✅ What we build

- Activity row in Settings
- Exact unread number, then `99+`
- Newest changes first
- Pull to refresh
- Scroll to load older pages
- One year of fetched history kept on the phone
- Offline history
- French and English
- Accessible iOS and Android UI
- New/changed items open current event details
- Cancelled items stay still
- Safe, paginated server API
- Tests, real-device checks, and capacity proof

## ❌ What we do not build

- No Flutter changes
- No change-detection rewrite
- No notification-pipeline redesign
- No change to the one-year server limit
- No automatic download of the whole year
- No old-event snapshot details screen
- No Flutter Activity-cache migration
- No accounts or calendar ownership
- No Activity preference
- No dependency on notification preferences
- No mobile feature-flag system
- No kill switch for this first release
- No Paperclip tickets yet

## 👀 What the student sees

Activity is always in the Settings **Events** section.

The badge shows:

- nothing for zero;
- `1` through `99`; and
- `99+` after that.

The screen is newest first.

One server change becomes one group:

- time of the change;
- calendar name;
- new classes;
- changed classes; and
- cancelled classes.

Changed classes show useful differences such as:

- old time → new time;
- old room → new room.

The colors come from the real app theme. We do not copy Flutter colors blindly.

## 💤 Empty is normal

A new calendar may have no changes yet.

That is good. It is not an error.

English:

> **No recent changes. Timetable updates will appear here.**

French:

> **Aucune modification récente. Les changements d'emploi du temps apparaîtront ici.**

If the internet fails but the phone has old Activity data, we keep showing it.

We add a small retry message.

If the phone has no cache at all, we show a full retry screen.

Background failures stay quiet.

## 👉 What happens when you tap

**New class:** open the current event details.

**Changed class:** open the current event details.

**Cancelled class:** do nothing. The event is gone.

Sometimes an old “new” or “changed” item later disappears too.

Then the normal **event not found** screen appears.

We accept that.

We do not build a second museum full of frozen old event pages. 🏛️

## 🚪 The new server door

We add:

```http
POST /v1/calendar-logs/search
Content-Type: application/json
```

We keep the old route for old clients:

```http
POST /calendar-logs/search
```

Only this new route gets the path-level `/v1` prefix.

We do not turn on global NestJS versioning.

We also do not use GET with tokens in the URL.

Why?

The token is the key to a private calendar.

URLs often appear in server logs, proxy logs, monitoring tools, and history.

Secret keys belong in the HTTPS body, not in the URL. 🔑

POST also avoids giant URLs when a student has many calendars.

## 📦 Small pages

The phone asks like this:

```ts
type CalendarLogSearchV1Request = {
  tokens: string[];
  limit?: number;
  cursor?: string;
  unreadSince?: string;
};
```

Tiny rules:

- `tokens` must really be an array.
- Tokens must be non-empty strings.
- Duplicate tokens count once.
- Maximum 100 different tokens.
- Empty token list returns an empty page cheaply.
- Normal page size is 50.
- Maximum page size is 100.
- Bad limits, dates, or bookmarks return 400.
- Unknown tokens simply return no rows.

The server answers like this:

```ts
type CalendarLogSearchV1Response = {
  items: CalendarLogV1[];
  nextCursor: string | null;
  asOf: string;
  unreadCount?: number;
};
```

The new answer does **not** send `calendarToken` back.

The phone already knows which `calendarId` it holds.

## 🔖 The cursor is a bookmark

Imagine reading a book while someone keeps adding pages at the front.

Normal page numbers become chaos.

So the server gives the phone a bookmark.

The first request freezes a tiny view of time called `asOf`.

Rows sort by:

```text
createdAt newest first
then id newest first
```

The bookmark remembers:

- that frozen server time; and
- the last row we saw.

New Activity can arrive while the student scrolls.

It will not push old rows around, duplicate them, or make them disappear.

The bookmark contains no calendar token or event text.

A bad or unknown bookmark version returns 400.

## 🔴 Exact unread count

The phone remembers `lastReadAt`.

That time comes from the **server**, not the phone clock.

This matters because phone clocks can be wrong.

When Activity is closed:

1. The phone sends `lastReadAt` as `unreadSince`.
2. The server counts newer rows.
3. Settings shows that exact number.

When Activity opens:

1. The phone clears the known badge immediately.
2. A successful refresh gives a new server `asOf`.
3. That becomes the new `lastReadAt`.
4. Anything created later becomes unread.

If Activity opens offline, the phone can only mark its newest cached server time as read.

Other unseen server rows still count later.

Read state belongs to one phone.

Another phone with the same calendar has its own unread state.

## 🗄️ The phone keeps two SQLite boxes

Box one holds Activity rows:

```text
activity_logs
```

Each row keeps:

- server log ID;
- calendar ID and name;
- change data as JSON text;
- created and updated times.

Box two holds tiny control state:

```text
activity_state
```

It remembers:

- last server time read;
- unread number;
- last good refresh;
- bookmark for older pages; and
- whether older history is finished.

Pages are added or updated by server log ID.

We do **not** throw away the whole table after every refresh.

The phone also:

- deletes cached rows older than one year;
- deletes history when its calendar is removed;
- saves a new bookmark only after the page saves correctly; and
- keeps old data when the network fails.

Broken cached JSON does not crash the whole list. The bad row is skipped and recorded.

Changing backend environment clears both Activity tables.

Flutter's old Activity cache is not copied. The server can rebuild it.

## 🔄 One refresh brain

Many things can shout “refresh!” at once:

- pull-to-refresh;
- push notification;
- calendar sync;
- opening Activity;
- returning to the app; and
- cold launch.

We give them one Activity refresh coordinator.

It is the bouncer at the door. 🕶️

If five triggers arrive together, only one newest-page request goes through.

Rules:

- Pull-to-refresh: always fetch.
- Relevant push: always fetch.
- Successful calendar sync: always fetch afterward.
- Open Activity: fetch if the last success is over five minutes old.
- Return to foreground: same five-minute rule.
- Cold launch: startup calendar sync causes the fetch.

Older-page loading uses a separate lane.

It cannot block a fresh newest-page request.

If Activity refresh fails after calendar sync, calendar sync still counts as successful.

Push asks for calendar sync and Activity refresh separately. The bouncer merges duplicates.

## 🧱 Keep the code graph tidy

Activity owns:

```text
mobile/src/features/activity/data
mobile/src/features/activity/ui
```

Only Activity data talks to:

- the generated Activity API; and
- Activity SQLite tables through `@/db`.

SQLite is the real offline source.

TanStack Query may help stop duplicate requests, but its cache is not the Activity database.

The dependency arrows stay one-way:

```text
calendar sync -------> activity data -------> calendar sources
notifications -------> activity data
activity UI ----------> activity data
root runtime ---------> activity data
```

Activity opens the public event-details URL directly.

It does not reach into calendar internals.

## 📴 No kill switch tonight

The endpoint is:

- read-only;
- indexed;
- page-limited; and
- token-count-limited.

So we launch with measurements and staged rollout instead of building a feature-flag system.

If we need an emergency switch later, it must return:

```http
503 Service Unavailable
```

It must **not** return a fake empty page.

Empty means “this student has no changes.”

An outage is not the same thing.

With 503, the phone keeps its SQLite history and says it could not refresh.

## 🔐 Privacy rules

- Tokens travel only in HTTPS request bodies.
- V1 does not send tokens back.
- No tokens in logs, metrics, traces, analytics, or crash data.
- No event names, rooms, IDs, request bodies, or cursors in telemetry.
- SQL uses safe parameters.
- Bad cursor data is rejected before querying.
- Removing a calendar removes its cached Activity.
- Local SQLite is not newly encrypted. This matches the existing calendar store.

We are not adding accounts, ownership, token rotation, or special rate limits here.

## 📏 Prove it is cheap

Before release, we measure real aggregate sizes safely.

No student-level snooping. No tokens. No event text.

We check:

- logs per active calendar;
- page sizes in rows and bytes;
- first-page and older-page speed;
- unread-count speed;
- PostgreSQL query plans;
- rows scanned and buffers used;
- memory and event-loop health; and
- release error rate.

Starting budgets:

- Normal 50-log page: p95 under 250 ms.
- Maximum 100-log page: p95 under 500 ms.
- No full-table scan for one bounded student request.
- No private data in telemetry.
- One request after duplicate triggers merge.
- Smooth cached scrolling on supported phones and iPad portrait.

One log may contain many changed classes.

So 50 rows does not promise a tiny number of bytes.

We measure real payloads.

If needed, we lower the normal default below 50 without changing the API shape.

We do not split one change group in half.

## ⚠️ Risks we knowingly handle

- **A whole year is huge:** RN uses small v1 pages.
- **One log may still be huge:** measure it and lower the default if needed.
- **Tokens can leak in URLs:** use POST body and privacy tests.
- **New rows arrive while scrolling:** use the frozen bookmark.
- **Five refresh triggers shout together:** one coordinator merges them.
- **Unread counting may be slow:** count after `lastReadAt` and inspect the database plan.
- **Phone clock may lie:** use server time.
- **Removed calendar leaves private history:** delete its cached rows.
- **Old event disappears:** show normal not-found.
- **Old bookmark breaks:** restart pagination without deleting cache.
- **SQLite write fails:** keep last-good rows and allow retry.
- **Fake empty outage lies to users:** future emergency switch returns 503.
- **Mobile ships before server:** deploy server first.

## 🧪 What proves it works

### Server

Tests cover:

- input limits and bad shapes;
- old API compatibility;
- stable order across calendars;
- equal timestamps;
- new rows arriving between pages;
- unknown tokens;
- exact unread count;
- no token in the v1 answer or cursor;
- safe error logs;
- OpenAPI; and
- real PostgreSQL query plans.

### React Native data

Tests cover:

- SQLite migration;
- safe JSON reading;
- page insert/update with no duplicates;
- one-year cleanup;
- calendar removal;
- environment reset;
- exact unread rules;
- offline open;
- saved bookmarks;
- broken bookmark recovery;
- five-minute freshness;
- duplicate-trigger merging; and
- keeping old data after failures.

### React Native screen

Tests cover:

- Settings row and route;
- badge numbers and `99+`;
- loading, empty, cached-error, and full-error screens;
- new/changed/cancelled order;
- pull-to-refresh and older retry;
- event navigation;
- French and English;
- large text and screen readers;
- contrast and touch sizes; and
- very long names and big groups.

### Real app

The local server gets predictable test history:

- new;
- changed;
- cancelled;
- same timestamp;
- unread; and
- enough rows for several pages.

The app test checks:

- badge appears;
- opening Activity clears it;
- new/changed items open;
- cancelled item does nothing;
- refresh works;
- scrolling loads more;
- offline restart shows cache;
- removing calendar removes history; and
- push/foreground works on real iOS and Android devices.

## 🚀 Release order

1. Build the server v1 endpoint.
2. Measure real aggregate volume and preproduction capacity.
3. Generate the RN client and build SQLite/data behavior.
4. Test Activity in preview against preproduction.
5. Deploy the server to production first.
6. Release RN 4.0.
7. Watch speed, errors, database health, memory, and event-loop health.

Rollback uses the normal server image and mobile release/OTA paths.

The old endpoint stays alive.

No destructive database rollback is needed.

## 🎟️ Eight tickets later, not tonight

TIM-275 stays the finished research ticket.

Implementation gets a new parent epic:

> **Ship paginated Activity history in React Native 4.0**

### 1. Measure real Activity volume

Safe aggregate production counts.

Freeze speed, payload, query-plan, memory, and concurrency limits.

No production writes. No student-level data.

### 2. Build the v1 server API

Pagination, bookmarks, server time, exact unread count, validation, privacy, tests, OpenAPI.

Keep the old API.

No GET tokens. No global versioning. No kill switch.

### 3. Build the RN SQLite boxes

Tables, migration, safe JSON, page upsert, one-year cleanup, removed-calendar cleanup, unread state,
bookmark state, and reset behavior.

This can start beside the server work.

### 4. Build the Activity refresh brain

Generate the v1 RN client.

Add newest refresh, older loading, exact unread, five-minute freshness, forced refresh, bookmark
recovery, and duplicate-request merging.

Needs tickets 2 and 3.

### 5. Build the screen and Settings badge

Route, grouped list, badge, colors, refresh, scrolling, empty/error states, navigation, FR/EN,
accessibility, and UI tests.

Needs tickets 3 and 4.

### 6. Connect every refresh trigger

Calendar sync, push, screen open, foreground, and cold launch.

Keep errors independent and merge duplicate requests.

Needs ticket 4. Can run beside ticket 5.

### 7. Add real-server app tests

Seed all change types and several pages.

Test unread, navigation, refresh, scrolling, offline restart, removal, push, and foreground.

Needs tickets 2, 5, and 6.

### 8. Final capacity and release gate

Run the real budgets, privacy checks, automated tests, device checks, server-first release proof,
and rollback review.

Close only when the evidence is green.

## 🗺️ Ticket order

```text
Ticket 1 ───────────────┐
   |                    |
   v                    v
Ticket 2             Ticket 3
   |                    |
   +─────────┬──────────+
             v
          Ticket 4
          /      \
         v        v
    Ticket 5    Ticket 6
         \        /
          v      v
          Ticket 7
             |
             v
          Ticket 8
```

Ticket 1 and Ticket 3 can start immediately.

Ticket 2 can start too, but cannot finish until Ticket 1 freezes the budgets.

Tickets 5 and 6 can work side by side after Ticket 4.

No Paperclip ticket has been created yet.

👉 Next action: read this on your phone, sleep, then approve or edit the eight ticket bodies.
