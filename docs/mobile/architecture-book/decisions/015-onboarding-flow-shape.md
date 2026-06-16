# 015 — Onboarding flow shape: a presentation-only `onboarding/` feature folder, welcome-first Stack, reachable but not a startup gate

> Origin: the `add-mobile-onboarding-flow` change (Phase-3 ship 1 of 5), design
> D1/D3/D4. Records the load-bearing onboarding-flow decisions the later source
> steps (QR / iCal, ships 3–5) copy. **Generalizes** the presentation-only
> feature-folder shape blessed by splash (ADR [014](./014-layered-feature-module-pattern.md)'s
> open sublayer set already names `ui/`); it does NOT change any boundary rule.
> The full wiring lives in the Architecture Book "Features → School selection /
> onboarding" + "Navigation & route structure"; this is the decision record.

## Status

Accepted.

## Context

Phase 3 ("Onboarding & calendar sources") opens by growing the Phase-2 onboarding
surface into a real first-run experience. Phase 2's School-selection feature
(Feature C) already built the **server-read half**: a nested `src/app/onboarding/`
Stack (`_layout` + `index` = school picker + `groups` = group picker) over
`src/features/school-selection/`. But a first-run user landed **directly on a bare
school list** — nothing said "this is TimeCalendar and here is what it does." The
Flutter app opened onboarding with a brand intro carousel
(`app/lib/modules/onboarding/screens/onboarding_screen.dart`).

Three decisions in growing this surface are load-bearing — copied by the later
source steps (QR / iCal) that also live under onboarding, and costly to reverse —
and so earn an ADR (R-4):

1. **Where the onboarding flow's framing/brand surface lives** — fold it into
   `school-selection/ui/`, or give onboarding its own feature folder.
2. **The entry route order** — what `timecalendar-dev://onboarding` and the Profile
   `<Link href="/onboarding">` resolve to.
3. **Whether first-run forces onboarding** — a startup-routing call (gate first
   paint on `isOnboardingComplete()`, or stay reachable-only).

Design assets are **HUMAN-blocked** (we have no RN illustration artifacts; R-3 says
the platform is the design reference, not the Flutter app), so the surface ships
**native-default** (typography + the brand `primary` accent on `@/theme` tokens, no
Material port, no copied illustrations); the designer polish is inboxed.

## Decision

1. **Onboarding is its own presentation-only feature folder** —
   `src/features/onboarding/ui/` (`welcome-screen.tsx` + its colocated test + the
   `ui/` sub-barrel + the feature barrel), exactly the **splash** shape (`ui/`-only,
   no `data/`/`store/`/`form/`). *Rejected:* growing `school-selection/ui/` — the
   welcome surface has no school data, query, or selection store; it is a brand/intro
   surface that *navigates into* school-selection. Folding it in conflates two axes
   (a brand intro vs. a server-read picker) and makes the onboarding **flow** span a
   feature whose name ("school-selection") no longer describes its entry. The
   migration's onboarding *flow* is broader than school-selection (ships 3–5 add QR +
   iCal source steps), so `onboarding` is the natural home for the flow's framing UI;
   school-selection stays the *school read* feature it already is. `ui/`-only is an
   established, blessed shape (splash; ADR 014's open sublayer set names `ui/`), so
   **no new sublayer type and no boundary-rule change** is needed — B-1/B-2 govern
   `src/features/*/*` and cover `onboarding/ui/` automatically.

2. **The onboarding Stack is welcome-first.** `index` = welcome (new), the school
   picker **moves** to `/onboarding/school` (a one-line route re-export relocation;
   the screen in `school-selection/ui/` is untouched), `groups` unchanged. The
   `onboarding` group stays a `Stack` sibling of `(tabs)`; `_layout.tsx` and the root
   layout are unchanged. *Why `index` = welcome:* the group's entry route is what
   `timecalendar-dev://onboarding` and the Profile link resolve to, so making `index`
   the welcome surface lands the existing entry points on the first-run surface with
   **no Profile/root-layout change**; the school step gets an explicit, clearer
   `/onboarding/school` path. *Rejected:* keeping `index` = school with a separate
   `welcome.tsx` (the entry deep link / Profile link would still land on the bare
   list).

3. **Onboarding is reachable but NOT a hard startup gate.** Reachable via the welcome
   surface (Profile link + deep link); the app does **not** auto-route a first-run
   user into onboarding by gating first paint. *Why:* a first-launch gate's natural
   consumer is the **calendar/home** that reads the selected school, and that consumer
   does not exist yet (Phase 3 ship 2+ grows the picker; the calendar is Phase 4). The
   School-selection section already records this exact deferral. Adding it now would
   gate on `isOnboardingComplete()` with no screen that needs the result, or entangle
   the splash/`_layout` startup path with a routing branch that has no downstream
   reader. *Considered and rejected:* a lightweight `Redirect` in `(tabs)/index.tsx`
   keyed on `!isOnboardingComplete()` — technically safe today (Home renders the
   personal-events list, no calendar dep), but it makes onboarding a hard first-run
   wall before the source steps (QR/iCal) the user may prefer, and bakes in a routing
   posture better decided once all source steps exist. The school-selection store's
   `isOnboardingComplete()` is **unchanged and ready** for the step that owns the gate.

The welcome surface is native-default (R-3): a single clean centered brand surface
(app name as a `ThemedText type="title"` heading, a tagline, three value-prop lines,
a primary CTA) — **static** (no carousel/paging/required motion → reduced-motion
trivially met). The CTA uses the brand `primary` as an **accent** (a brand-tinted
border + the token `text` label on the `backgroundElement` surface), **not** white
text on the bright `#E91E63` fill (4.35:1, below the body floor) — avoiding a new
`primaryStrong` `#C2185B` token from a sample of one (R-2; the white-on-brand-CTA
decision is the inboxed designer-polish follow-up).

## Consequences

- The QR + iCal source steps (ships 3–5) inherit the `onboarding` feature folder as
  the home for source-step framing UI; the welcome-first order is the entry posture.
- `src/features/onboarding/` is the **second** presentation-only (`ui/`-only) feature
  folder beside splash — the golden-path's presentation-only example set grows.
- The first-launch gate is a **recorded, ready-to-add follow-on** —
  `isOnboardingComplete()` stands; the gate lands with the calendar/home step.
- **Deep-link shift (expected):** `timecalendar-dev://onboarding` now hits **welcome**;
  the school step moves to `…/onboarding/school`. The Maestro flow reaches the live
  `GET /schools` assertion via the CTA tap; the Phase-2 live-read proof is preserved.
- No new dependency, no `app.config.ts`/native change, no new lint rule — the existing
  feature-boundary / i18n / a11y / coverage gates cover the new code.

## Revisit if

- The calendar/home step lands and wants the first-launch gate — add the redirect
  then, keyed on `isOnboardingComplete()` (the deferred half of decision 3).
- The source steps (QR/iCal) need onboarding to own more than presentation — extend
  the feature's sublayer set with their evidence (ADR 014's open set).
- A designer-driven multi-step intro replaces the single welcome surface — re-weigh
  the native-default surface (the inboxed designer polish).
