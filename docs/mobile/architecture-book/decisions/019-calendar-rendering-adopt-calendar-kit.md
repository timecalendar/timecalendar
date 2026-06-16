# 019 — Calendar rendering: ADOPT `@howljs/calendar-kit` v2 for the timeline (behind a seam), salvage the overlap/time-grid primitives, build agenda + home on them

> Origin: the **Phase-04 calendar spike** (the K-5 / ADR [005](./005-calendar-spike.md)
> time-boxed read-only spike). This is the **load-bearing decision of Phase 04** — the
> calendar is the #1 risk in the whole migration, and this ADR fixes the foundation every
> later Phase-04 ship (timeline, sync, details, home) is built on. It **resolves the open
> adopt/fork/custom gate ADR 005 parked.** Rigor mirrors ADRs
> [011](./011-personal-event-storage.md)/[013](./013-query-persister-and-policy.md)/[017](./017-qr-scan-camera.md)/[018](./018-user-calendar-storage.md).

## Status

Accepted. (ADR 005's "decide adopt/fork/custom, ends the spike early when the answer is
obvious" clause fired — the answer became obvious once the library booted and rendered a
dense week on the real stack; see Context. ADR 005's open gate is now closed by this ADR.)

## Context

The calendar timeline — a dense university week with many overlapping events, rendered at
the device's frame rate as a **designed brand surface** (not native chrome, R-3) — is the
single highest-uncertainty item in the migration. ADR 005 mandated a time-boxed read-only
spike to **earn** the build-vs-buy decision with evidence rather than the roadmap's
"likely custom" prior. The spike was run on the **real host stack** (Expo SDK 56, RN
0.85.3, Reanimated **4.3.1** + worklets 0.8.3, gesture-handler ~2.31.1, New Architecture +
Hermes, React 19.2) — quarantined throwaway code outside `src/`, booted on the iOS
simulator against a hand-authored worst-case dense week (a Tuesday 5-way overlap cluster +
back-to-back blocks across 7 days). Two candidates were built and rendered side-by-side:

**Candidate A — adopt `@howljs/calendar-kit` v2.5.6.** The headline *risk* feared going in
(per the research): wildcard `peerDependencies: "*"`, **no published evidence of
SDK-56/RN-0.85/Reanimated-4 testing**, a Reanimated-saturated core (`scrollTo`,
`useAnimatedReaction`, `runOnUI` heavily used) running against a runtime with *open upstream
Reanimated-4 crash reports* (software-mansion/react-native-reanimated#9293 — `EXC_BAD_ACCESS`
on RN 0.85.1 + Reanimated 4.3.0 + worklets 0.8.1, New Arch). The spike's first gate was
simply: **does it boot without that crash?**

> **It booted and rendered correctly.** v2.5.6 ran on Reanimated 4.3.1 / RN 0.85.3 / New
> Arch / Hermes / SDK 56 with **no crash**, rendered the dense week with **correct dense-
> overlap column packing** (the Tuesday 5-way cluster packed into narrow columns), the
> **now-indicator** at the live time tinted brand-pink, **custom `renderEvent`** tiles, and
> a themed grid. The "RISKY/might-crash" hypothesis was **disproven by direct evidence** —
> exactly the point of spiking. Capability gap confirmed: **calendar-kit v2 has no
> agenda/planning (list) view** (it is a timeline/grid calendar only), and our Flutter app
> has one. It is **pure-JS** (no native code, autolinks nothing, **does not bump the EAS
> fingerprint** — rides the OTA lane, aligned with `eas.md`/ADR 006). Brand freedom is real
> (full `theme` object + `renderEvent` → it is *not* locked to its own look). Maintenance:
> single maintainer, ~648★, lags ~1 SDK behind (we'd be an early SDK-56 adopter).

**Candidate B — build custom.** The proposed stack (plain Reanimated absolute-positioned
grid + gesture-handler horizontal pager; **not** FlashList for the grid — a day is a bounded
~10–30 overlapping tiles, and FlashList's `useAnimatedScrollHandler` flicker history makes
it the wrong tool for a scroll-synced grid). The genuinely-hard product logic — **unbounded-
column overlap packing** (ported from Flutter `EventForUI.listFromEvents`) — was implemented
as a **pure, unit-validated function** (`spike/overlap-layout.ts`: the 5-way cluster → 5
even columns; the classic A/B/C → exact thirds) and rendered a correct dense week on-device.
This proved we *can* build it — but it also confirmed the custom path **re-implements
exactly what calendar-kit already is** (the same gesture-handler + Reanimated stack), re-
paying the #1 migration risk (week paging, two-axis scroll-sync worklets, now-indicator,
pinch-zoom) for parity the library already delivers, and owning that surface forever.

**What the spike did NOT measure:** sustained frame rate on a real **low-end Android** device
(a CI/simulator is not a low-end device — this is the exit-criterion bar and is **inboxed for
on-hardware verification**, never a loop blocker). Both paths share this residual perf risk;
calendar-kit has *shipped* Android new-arch scroll-perf fixes (v2.2.0/v2.5.0), so if anything
its perf surface is more battle-tested than fresh custom code.

## Decision

**ADOPT `@howljs/calendar-kit` v2 for the day/week timeline, behind our own seam, and
SALVAGE the overlap-layout + time-grid primitives as our own pure modules** — used for the
parts the library does *not* cover (the agenda/planning list, the home "today" mini-grid) and
as the de-risking insurance behind the seam. Concretely, the rendering ship(s) (Phase-04
item 1) will:

- Add `@howljs/calendar-kit` (`npx expo install`, the SDK-pinned version) as the **timeline
  renderer for day/week**, consumed **only** through a feature-owned seam
  (`src/features/calendar/…` — a wrapper component, NOT imported directly by screens), so a
  future swap to a fork or custom is localized to one module. (The chrome-wrapper seam
  pattern, theming.md / ADR 010, is the model — though calendar-kit is a *stable GA-ish* dep,
  not an alpha API, so whether it needs a `no-restricted-imports` lint ban or just a
  feature-`data/`-style boundary is the rendering ship's planner call; at minimum it lives
  behind one wrapper.)
- **Salvage the overlap-layout engine** (pure `layoutOverlaps`, ported + validated in the
  spike) and the **time-grid math** (minute→pixel, event height, hour labels, now-indicator
  position) into our **own pure, 90%-gated `src/features/calendar/data/` (or a shared layout
  module)** — used by the **agenda view** (day-grouped list, the capability calendar-kit
  lacks — a simple FlashList/SectionList, the *easy* half) and the **home "today" mini-grid**,
  and available as the fallback renderer if the library is ever dropped. This honors the
  spike mandate: **salvage primitives REGARDLESS of the adopt/fork/custom outcome.**
- The calendar is a **designed brand surface** (R-3): tiles via `renderEvent`, grid/now-
  indicator/header via `theme` from `@/theme` tokens — held hard on the DoD native-
  correctness axis (human visual review inboxed).

*Rejected — build custom now (the roadmap's "likely" prior):* the spike **disproved** the
premise that drove it (that the library wouldn't survive our Reanimated-4 stack). Building
custom would re-pay the entire #1-risk cost for rendering the library already does correctly
on our stack, and own the highest-risk surface in the app forever, when a pure-JS, forkable,
OTA-lane dependency clears the bar today. Choosing custom against this evidence would be
following the prior, not the evidence (the exact failure mode the spike exists to prevent).

*Rejected — fork now:* premature. A fork inherits the maintainer's hand-rolled Reanimated
virtualization burden with no current need; we adopt upstream, and the salvaged engine + the
seam make a *later* fork-or-custom cheap if the revisit fires.

*Rejected — adopt without salvaging / without a seam:* would leave the hard product logic
(overlap packing, our agenda view) un-owned and make a future swap a rewrite. The seam +
salvaged primitives are what make this decision **reversible**, which is what justifies
adopting a single-maintainer dep on the #1 surface.

## Consequences

- **The Phase-04 worklist is now shaped:** item 1 (timeline) = adopt calendar-kit behind a
  seam for day/week + build the agenda list + salvage the layout/time-grid primitives (the
  planner may split day/week-adopt vs. agenda-build into ≥1 ship); items 2–5 (sync, details,
  home, date/time) build on that foundation and the salvaged primitives (home's today-grid
  reuses the overlap engine). Sync is well-scoped: `POST /calendars/sync` (the generated
  `useCalendarSyncControllerSyncCalendars` hook already exists) → drop+replace into a new
  Drizzle `calendar_events` table mirroring the Flutter `toDbMap()` verbatim (the ADR-011/018
  importer-fidelity posture).
- **A new pure-JS dependency** (`@howljs/calendar-kit`) enters `mobile/package.json` at the
  rendering ship (+ its `luxon`/`rrule`/`lodash.*` transitive deps). It autolinks nothing,
  adds no `app.config.ts` plugin, and **does not bump the EAS fingerprint** — it ships over
  OTA. Its native footprint is inherited entirely from the already-present
  Reanimated/gesture-handler. The app must mount a `GestureHandlerRootView` (calendar-kit
  needs it — confirmed in the spike).
- **The adopt-risk is bounded by the escape hatch:** pure-JS + forkable + salvaged engine +
  the seam ⇒ if calendar-kit breaks on a future SDK and the maintainer lags, the revisit
  fires and we fork or swap to custom **behind the unchanged seam**, with the overlap engine
  already ours. This is the revisit clause doing its job, not a failure.
- **The 120fps-on-low-end-Android bar is the rendering ship's gate, verified on real
  hardware (inboxed), not in CI.** Reassure perf baselines are part of that ship's DoD. If
  the library fails the on-hardware perf bar, the revisit fires (see below) — re-open toward
  custom, with the salvaged primitives already in hand.
- **Visual brand review** of the calendar surface on both platforms is inboxed (DoD native-
  correctness axis — human eyes on a designed surface).

## Revisit if

- `@howljs/calendar-kit` **fails the low-end-Android frame-rate bar** on real hardware (the
  exit criterion) — re-open toward custom (the salvaged overlap/time-grid primitives + the
  plain-Reanimated-grid + gesture-pager architecture the spike prototyped are the ready
  starting point), swapping behind the unchanged seam.
- The library **breaks on a future Expo SDK** and the (single) maintainer lags long enough to
  block our upgrade lane — fork (it is pure-JS, no native pods) or swap to custom behind the
  seam.
- A required calendar capability proves **unreachable through `theme` + `renderEvent`** (the
  brand surface fights the library) — re-weigh custom for that surface.
- The agenda/home views (built on the salvaged primitives) reveal the primitives need to
  *become* the whole renderer (i.e. custom wins on its own merits once built) — generalize
  the salvaged engine into the day/week grid and drop the library (the revisit toward custom,
  evidence-driven rather than prior-driven).
