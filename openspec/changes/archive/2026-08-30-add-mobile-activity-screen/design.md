## Context

Ticket 5 of the Activity revival epic ([TIM-398](/TIM/issues/TIM-398), epic
[TIM-389](/TIM/issues/TIM-389)). Authoritative spec:
`docs/react-native-migration/05-tech-specs/activity-revival.md` — **Product behavior** in full,
architecture decisions 6, 8 and 9, and **Verification strategy → React Native UI tests**.

Everything below the UI already exists on `main`:

| Landed | Commit | What this change consumes |
| --- | --- | --- |
| TIM-396 | `b378adb8` | `activity_logs` / `activity_state`, `listActivityLogs`, `readActivityState`, `markActivityRead`, `markActivityReadFromCache` |
| TIM-397 | `ed4fbf22` | `refreshNewestPage({ force })`, `loadOlderPage()`, the outcome unions, single-flight, cursor recovery |

The repository API and the two outcome unions are **fixed inputs**. This change adds reads and a
presentation layer over them; it changes no policy in `data/coordinator.ts`.

## Decisions

### D1 — This ticket wires the **user-initiated** operations only. Screen-open and foreground stay with Ticket 6.

The specification's trigger table (decision 7) lists six triggers. Its delivery plan splits them:
Ticket 5 gets "pull-to-refresh, infinite scrolling"; **Ticket 6 gets "the five-minute screen-open
and app-foreground runtime policy"** (activity-revival.md:706). The two tickets run in parallel, so
the split is also what keeps them off the same lines of the same file.

So this change wires exactly two calls:

- `RefreshControl.onRefresh` → `refreshNewestPage({ force: true })`
- end-of-list and the footer retry → `loadOlderPage()`

and **no** `useEffect` that refreshes on mount. Ticket 6 adds its policy as one hook call in
`ActivityScreen`; the controller hook this change builds is the seam it inserts into.

The visible consequence in isolation: on a device whose cache is empty and whose owner never pulls
to refresh, the screen shows the empty state without ever having fetched. That is Ticket 6's gap to
close (a cold launch's startup calendar sync triggers the post-sync refresh), and both tickets are
required before the epic's release gate ([TIM-401](/TIM/issues/TIM-401)). Flagged on TIM-399 rather
than absorbed here.

### D2 — Opening Activity clears unread **from the cache**, reactively, for as long as the screen is mounted

Specification decision 8 asks for three things: opening Activity zeroes the local count (8.3); a
successful newest page **while Activity is visible** leaves the count at zero (8.4); an offline open
advances the watermark only to the newest cached server time (8.5).

One mechanism satisfies all three: **while `ActivityScreen` is mounted, any non-zero stored unread
count is driven back to zero through `markActivityReadFromCache()`**, and the effect also runs once
on mount so the watermark advances even when the count is already zero (a `lastReadAt` of `null`
with an empty count would otherwise make the next passive refresh send no `unreadSince` and count
the entire history as unread).

The alternative — extending `ActivityRefreshOutcome`'s `updated` case with the response's `asOf` and
calling `markActivityRead(asOf)` — was **rejected**:

1. It cannot be the only path. A push- or sync-triggered refresh can land while the screen is
   visible (Ticket 6), and the screen never sees that outcome, so the reactive rule is needed
   regardless. The `asOf` path would be a *second* watermark writer, not a replacement.
2. It edits `data/coordinator.ts`, the file Ticket 6 is concurrently building on, for no behavior
   the reactive rule does not already produce.
3. The cache watermark is strictly the more conservative of the two. `markActivityReadFromCache`
   advances only to a server timestamp the device can prove it holds, so no server row can ever be
   silently marked read; `asOf` is a snapshot bound that sits at or after the newest cached row.

Consequence to state plainly: **`markActivityRead(asOf)` ends this change with no caller.** It is a
specified repository operation (`mobile-activity-cache`, "The Activity read watermark is
server-issued time") and must not be deleted as dead code — Ticket 6, which owns the triggers that
produce an `asOf` while the screen is visible, is its natural first caller. Flagged on TIM-399.

### D3 — One `calendar_log` row is one **section**; its children are flattened into the virtualized list

TIM-394 measured production: a single log holds **12.11 changed events at the mean, 214 at p99 and
3,656 at the maximum** (`activity-capacity-gate.md` §1). A group rendered as one composite view
containing its children mounts all 3,656 rows at once the moment the group scrolls into range.

So the screen is a `SectionList` (the agenda's pattern — `features/calendar/ui/agenda-list.tsx`,
zero new dependency, no FlashList):

- **one section per `ActivityLog`**, ordered newest first, preserving "one server row is one visual
  group";
- `renderSectionHeader` = change time + calendar name;
- `section.data` = the log's changes flattened and ordered **new → changed → cancelled**, so each
  change is an independent list item the virtualizer can window.

No per-group cap and no "show more" affordance: capping is product behavior nobody asked for, and
virtualization removes the reason to want one.

A log whose `calendarChange` carries no items in any of the three arrays renders **no section** — an
empty section would draw a header announcing a change with nothing under it.

`stickySectionHeadersEnabled` is **off**: a sticky header is orientation for a scroll through time
(the agenda's days), and here it would pin a single sync event over unrelated rows.

### D4 — The local read is the whole cache; pagination is a **network** backfill

`listActivityLogs()` returns every cached row. The screen renders all of them and treats
`onEndReached` as "fetch older history from the server", not "reveal more local rows". There is no
local windowing.

TIM-394 bounds this: a whole retention year of one calendar is **p99 = 164 logs** (max 911), so the
cache the student can actually reach is one to four server pages deep for a typical device. Adding a
local pagination layer over a network pagination layer would double the state for a list that ends
after a handful of pages.

The reactive read is one `useLiveQuery` over `activity_logs`, mapped through the existing
`rowToActivityLog`, mirroring `useUserCalendars`.

### D5 — Activity builds the event-details URL itself and imports nothing from the calendar feature for navigation

A new item opens `/event-details/<newItem.uid>`; a changed item opens
`/event-details/<changedItem.newItem.uid>`; a cancelled item is not pressable.

`eventRoute(uid)` exists in `@/features/calendar/data` and is **not** used. The specification's
dependency graph (decision 6) draws Activity's navigation edge at the *route string*, not at the
calendar feature, and Ticket 6 adds the edge `calendar sync → activity data`. Consuming a calendar
helper here would put a feature-level edge back the other way for a two-token template literal.

A disappeared event landing on the existing not-found state is the correct outcome (decision 9).
Activity never builds a second event model from the historical payload.

### D6 — Display formatting **is** reused from `@/features/calendar/data`

The asymmetry with D5 is deliberate. `i18n.md` designates `calendar/data/format.ts` as the app-wide
display-only date/time seam ("covers every date/time across calendar/agenda/details/home"), and
`hidden-events/ui/hidden-events-screen.tsx:10-14` already imports `resolveLocale` +
`formatTimeRange` from it across the same boundary. Re-deriving a `date-fns` locale map inside
Activity would fork the seam the Book names.

Activity uses `resolveLocale`, `formatFullDateTime` (group header) and `formatEventDateRange` (an
event's time, same-day aware), each with the display zone from `useDisplayZone()`
(`@/features/settings/prefs`), so Activity times match every other screen.

These are pure functions over `Date`s. They carry no calendar state and no event model, which is the
coupling D5 refuses.

### D7 — Two new semantic status tokens, defined for both schemes, with color never the sole signal

`theming.md` already reserves this space ("Status colors keep their meaning. Success, warning,
error, and destructive states use dedicated semantic colors") and the palette holds only
`destructive`. Cancelled reuses `destructive`; new and changed need tokens.

Computed with the WCAG 2.x relative-luminance formula (re-verify before committing; report the
computed numbers in the `tokens.ts` block in the existing style):

| Token | Scheme | Value | on `background` | on `backgroundElement` |
| --- | --- | --- | --- | --- |
| `positive` | light | `#146C43` | 6.45:1 | 5.67:1 |
| `positive` | dark | `#7EE2A8` | 13.33:1 | 10.10:1 |
| `informational` | light | `#0B57D0` | 6.39:1 | 5.61:1 |
| `informational` | dark | `#A8C7FA` | 12.21:1 | 9.25:1 |

Every pair clears the 4.5:1 body threshold in both schemes, so the tone may carry the kind label as
text, not only an icon tint. Light and dark are defined together (`theming.md`: a light-only token
is incomplete).

No `*Soft` background variants are added. R-2 — earned, not speculative: nothing in this screen
fills a surface with a status color.

**Color is never the only signal.** Each item carries a translated kind label ("New" / "Changed" /
"Cancelled") in the tone, so the distinction survives greyscale, color-blindness and a screen
reader.

Do **not** amend the existing documented ratios for `destructive` while adding these rows; if a
fresh computation disagrees with the committed number, note it and leave it — reconciling the
existing block is not this change's scope.

### D8 — The badge rule lives in `activity/data`, not `activity/ui`

`formatUnreadBadge(count: number): string | null` — `null` below 1, the decimal count through 99,
`"99+"` from 100.

It sits in `data/` for two reasons: Settings must import it without pulling the Activity screen
module into its import graph, and `data/` is under the **90% logic coverage gate** while `ui/` is
under the 70% floor, so the rule is proved by a test that cannot be skipped.

`"99+"` is not a catalog key — it is a numeral and a plus sign, identical in FR and EN. The badge's
*accessible name* is translated and pluralized, and lives on the row (D9).

### D9 — The badge is part of the Settings row's single accessible name

`SettingsRow` gains an optional `badge?: string`, rendered between the label block and the chevron
and marked `importantForAccessibility="no-hide-descendants"` like the existing icon and chevron. The
row stays **one** `Pressable` with **one** accessible name, so a screen reader announces "Activity,
5 unread changes" and the whole row remains the touch target (44pt iOS / 48dp Android, already
enforced by `minimumHeight`).

The Activity destination is declared in the existing `destinations` array with an
`unreadBadge: true` marker, so the section, ordering and testID stay declarative and only the badge
value is resolved reactively.

The count comes from `useActivityState().unreadCount` — one live query over the singleton
`activity_state` row. Settings never reads `activity_logs`.

### D10 — Visible errors come only from user-initiated operations

The coordinator classifies *what* failed, never *who sees it* (ADR 048). The screen owns visibility,
and this is its whole table:

| Source | Outcome | Screen |
| --- | --- | --- |
| pull-to-refresh | `updated` / `fresh` | clear the refresh error |
| pull-to-refresh | `no-calendars` | clear the refresh error (D11) |
| pull-to-refresh | `failed` / `too-many-calendars` | set the refresh error |
| end-of-list or footer retry | `loaded` / `complete` / `unavailable` / `cursor-reset` | clear the older-page error |
| end-of-list or footer retry | `failed` / `no-calendars` / `too-many-calendars` | set the older-page error |
| any passive trigger (Ticket 6) | anything | **nothing** — the screen never observes it |

Passive failures are structurally invisible here because the screen holds no subscription to them:
it renders SQLite, and a failed refresh writes nothing. That is the specification's "passive
background and foreground failures do not interrupt the screen", achieved by construction rather
than by a flag.

`cursor-reset` is **not** an error: the chain restarts from the newest page and every cached row is
intact (ADR 048 / D3 of TIM-397). The footer simply stops offering more.

Screen states, from `loaded` (has the live query settled), `logs.length` and the two error flags:

| Condition | State |
| --- | --- |
| `!loaded` | loading |
| `logs.length === 0`, no refresh error | empty — the specification's exact sentence |
| `logs.length === 0`, refresh error | **empty failure** — message + retry, full state |
| `logs.length > 0`, refresh error | **cached failure** — rows kept, compact retryable banner above them |
| `logs.length > 0`, no refresh error | populated |
| older-page error | inline footer with retry, below the rows, independent of the above |

The cached-failure banner reuses the shape of
`features/calendar/ui/calendar-screen/calendar-screen-status.tsx` (message + 44pt retry, polite live
region, `alert` role on the text) rather than inventing a second error idiom.

### D11 — Zero calendars is the empty state, not an error

The row stays visible with no calendars and "opens the normal empty state" (Product behavior). The
coordinator answers `no-calendars` **without a request** (ADR 048), so a pull-to-refresh on such a
device must read as "nothing to show", never as "we could not check". `too-many-calendars` (>100)
*is* a failure the student should see, because the app genuinely cannot fetch.

### D12 — A cancelled item is an inert `View`, not a disabled `Pressable`

The current event no longer exists, so there is nothing to open (decision 9). Rendering a disabled
touchable would still expose a `button` role and a focus stop that does nothing. A cancelled item is
plain content: no role, no `onPress`, no hit target — and therefore no `no-nested-touchables` or
`has-accessibility-props` obligation.

The screen test asserts the negative: pressing a cancelled item's testID performs no navigation, and
the node carries no button role.

## Risks / Trade-offs

- **Shipped in isolation, the screen never fetches on open (D1).** Mitigated by Ticket 6 running in
  parallel and by TIM-401 gating the release; flagged on TIM-399 rather than silently absorbed.
- **`markActivityRead(asOf)` has no caller after this change (D2).** A simplification pass could
  read it as dead code and delete a specified operation. Stated in `design.md`, in the code comment
  at the call site of `markActivityReadFromCache`, and in the tasks.
- **A 3,656-child group is only survivable because children are list items (D3).** A later
  refactor that nests children inside one group component silently reintroduces the failure at the
  99.99th percentile, where no test data lives. The long-content test uses a deliberately large
  group to keep the shape honest.
- **Two new palette tokens are a design-system commitment.** Their contrast is documented in
  `tokens.ts` with the rest; the DoD's manual review is what checks them on a rendered screen, as
  for every other pair (no runtime checker — `theming.md`).

## Migration Plan

None. Additive UI over existing tables; no schema, no contract, no stored-format change. Reverting
is deleting the route registration and the feature's `ui/` directory.

## Open Questions

None blocking. The one product boundary this change declines to decide — whether the screen-open
refresh belongs here or in Ticket 6 — is settled by the specification's own delivery plan (D1).
