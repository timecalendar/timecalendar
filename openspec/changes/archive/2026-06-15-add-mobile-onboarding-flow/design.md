# Design — Onboarding flow (welcome/brand surface over the existing school-selection Stack)

This change is Phase 3 ship 1 of 5. It **grows** the onboarding surface Phase 2 built rather
than starting fresh: the existing `src/app/onboarding/` nested Stack + the
`src/features/school-selection/` feature stay, and a thin presentational **welcome surface**
is added in front of the school step. The decisions below are the load-bearing ones; the
implementer follows the golden-path exemplar for everything routine.

## Context read before designing (the existing seams this grows)

- `mobile/src/app/onboarding/{_layout,index,groups}.tsx` — Phase 2's nested Stack: a
  `headerShown:false` `<Stack>` layout; `index.tsx` re-exports `SchoolPickerScreen`,
  `groups.tsx` re-exports `SchoolGroupPickerScreen` (both from `@/features/school-selection/ui`).
- `mobile/src/features/school-selection/` — `data/` (the only generated-hook import site),
  `store/` (identity-only selection, `isOnboardingComplete()` derived from selection
  existence), `ui/` (the two picker screens). The feature barrel re-exports both halves.
- `mobile/src/features/splash/` — the precedent for a **presentation-only** feature folder:
  just `ui/` (`splash-screen.tsx` + test + sub-barrel), no data/store/form; `useAppReady`
  lives in `src/hooks/` (shared infra). This is the shape the onboarding welcome surface
  copies.
- `mobile/src/theme/tokens.ts` — brand `primary` (`#E91E63` light / `#FF4081` dark) and the
  load-bearing contrast rule: **white text on a brand fill must ride `#C2185B`** (the bright
  identity pink is accent/tint only, 4.35:1 — below the body floor). The welcome CTA design
  obeys this (D2).
- `mobile/src/app/(tabs)/profile.tsx` — the current onboarding entry: `<Link href="/onboarding">`
  → today lands on the school list. After this change it lands on the welcome surface
  (no Profile-screen structural change beyond the label, which already reads "Choose your
  school"; D3 decides whether to relabel).
- `mobile/src/app/_layout.tsx` — root `Stack`; `<Stack.Screen name="onboarding" />` already
  registered as a sibling of `(tabs)`. No root-layout change is needed (the welcome surface is
  inside the existing `onboarding` group).
- `app/lib/modules/onboarding/screens/onboarding_screen.dart` — the Flutter intro carousel for
  **message parity** (three value props: view calendar / get notifications / welcome), NOT for
  a visual port (R-3).

## D1 — Onboarding is its own presentation-only feature folder (`src/features/onboarding/ui/`), not a sublayer of school-selection

**Decision.** The welcome surface lives in a **new** `src/features/onboarding/` feature folder
with a single `ui/` sublayer (`welcome-screen.tsx` + `welcome-screen.test.tsx` +
`ui/index.ts` + the feature barrel `index.ts`) — exactly the splash shape.

**Why.** Two candidate homes:

1. **Grow `school-selection/ui/`** — add `welcome-screen.tsx` beside the pickers. Rejected:
   the welcome surface is **not** school-selection's concern — it has no school data, no query,
   no selection store; it is a brand/intro surface that *navigates into* school-selection.
   Folding it in would conflate two axes (a brand intro vs. a server-read picker) in one
   feature and mislead ship 2 (which grows the *picker*, not the intro). It would also make the
   onboarding **flow** (welcome → school → group) span a feature whose name ("school-selection")
   no longer describes its entry.
2. **A new `src/features/onboarding/` feature, `ui/`-only** — chosen. The migration's onboarding
   *flow* is broader than school-selection (Phase 3 adds QR + iCal *source* steps, ships 3–5);
   `onboarding` is the natural home for the flow's framing/brand surface, and school-selection
   stays the *school read* feature it already is. `ui/`-only is an established, blessed shape
   (splash; ADR 014's open sublayer set names `ui/`), so **no new sublayer type, no boundary-
   rule change** is needed — B-1/B-2 govern `src/features/*/*` and cover `onboarding/ui/`
   automatically.

The welcome screen consumes only `@/components/*` (ThemedText/ThemedView), `@/theme`, `expo-router`,
and i18n — it does **not** import school-selection's seams (B-1) or its own feature barrel (B-2);
it navigates by route path (`router.push("/onboarding/school")`), the loosest possible coupling.

**Load-bearing → recorded as ADR 015** (the feature-shape + flow-ownership decision is copied by
the QR/iCal source steps that also live under onboarding).

## D2 — Native-default brand surface, brand `primary` used correctly for contrast (R-3)

**Decision.** The welcome surface is a centered, single-screen brand surface on the `@/theme`
`background` token: the app name (`ThemedText type="title"` — heading role + the large brand
typography), a short tagline, the three value-proposition lines (calendar / notifications /
welcome — the Flutter intro's messages re-authored as concise native copy, **text only**, no
illustrations), and a primary "Get started" CTA. It is **static** — no carousel, no paging,
no required entrance animation.

**Contrast (the load-bearing token rule, `tokens.ts`):** the CTA is the first surface in the
app tempted to put **white text on a brand fill**. Per the documented rule, a white-text-on-
brand fill must ride the darker **`#C2185B`** (5.87:1, AA body) — the bright `primary`
`#E91E63` is accent/tint only (4.35:1, below the body floor). To avoid introducing a new
`primaryStrong`/button token from a sample of one (R-2, exactly what `tokens.ts` defers), the
default CTA uses the **brand `primary` as an accent on a token surface** — e.g. brand-tinted
text/border on the `backgroundElement` surface, or the brand fill with **non-white** (token
`text`) label where the pair is verified — rather than white-on-bright-pink. The implementer
picks the verified pairing and records the chosen pair inline; if a white-on-brand button is
genuinely wanted, that earns the `primaryStrong` token (`#C2185B`) **then**, with the contrast
note — but the default ship avoids it (R-2). Either way: **no raw color literal** outside the
documented brand tones; no Material widget port (R-3 — no AppBar/FAB/elevation/Poppins).

**Why native-default, not the Flutter carousel.** R-3: the platform is the design reference. A
3-page paged carousel with hand-drawn illustrations is a Flutter-era artifact; a single clean
brand surface is platform-idiomatic and ships without the (HUMAN-blocked) illustration assets.
The polished design (illustrations / motion / final copy / possible multi-page) is the inboxed
follow-up (D7).

## D3 — The Stack is re-ordered: welcome is the entry, the school picker moves to `/onboarding/school`

**Decision.** The nested `onboarding` Stack becomes a three-step flow:

| Route file | Re-exports | Deep link |
| --- | --- | --- |
| `src/app/onboarding/index.tsx` | `WelcomeScreen` (`@/features/onboarding/ui`) — **new** | `timecalendar-dev://onboarding` |
| `src/app/onboarding/school.tsx` | `SchoolPickerScreen` (`@/features/school-selection/ui`) — **moved** from `index.tsx` | `timecalendar-dev://onboarding/school` |
| `src/app/onboarding/groups.tsx` | `SchoolGroupPickerScreen` — **unchanged** | `timecalendar-dev://onboarding/groups?schoolId=<id>` |

`src/app/onboarding/_layout.tsx` (the nested `<Stack headerShown:false>`) is unchanged. The
`onboarding` group stays a `Stack` sibling of `(tabs)` in the root layout (unchanged). The
welcome CTA does `router.push("/onboarding/school")`; the school row's existing
`router.push("/onboarding/groups?schoolId=…")` is **unchanged** (the school screen's internal
nav is untouched — ship 2's concern).

**Why `index` = welcome (not a separate `welcome.tsx` with `index` still = school).** The
group's entry route (`index`) is what `timecalendar-dev://onboarding` and the Profile
`<Link href="/onboarding">` resolve to — making `index` the welcome surface means the existing
entry points naturally land on the first-run surface with **no Profile/root-layout change**.
The school step gets an explicit `/onboarding/school` path (clearer than an `index` that is
secretly the second step). The school picker file itself moves only its *route* (a one-line
re-export relocation); the screen in `school-selection/ui/` is untouched.

**Deep-link migration note (recorded so the implementer and reviewer expect it):** the Phase-2
Maestro flow and the school-selection DoD inbox note used `timecalendar-dev://onboarding` to
hit the **school** step. That link now hits **welcome**; the school step moves to
`…/onboarding/school`. The Maestro flow is updated to reach the school assertion via the CTA
tap (D6); any doc reference to the old deep-link target is updated.

## D4 — Reachable, NOT a hard startup gate (deliberate deferral, recorded)

**Decision.** Onboarding is reachable via the welcome surface (Profile link + deep link); the
app does **not** auto-route a first-run user into onboarding by gating first paint.

**Why.** A first-launch gate ("no selection → force onboarding") is a startup-routing decision
whose natural consumer is the **calendar/home** that reads the selected school — and that
consumer does not exist yet (Phase 3 ship 2+ grows the picker; the calendar is Phase 4). The
School-selection section already records this exact deferral ("Not a startup gate — gating
first paint on 'no school selected' pulls in the calendar/home dependency — deferred to that
step"). Adding the gate now would either (a) gate on `isOnboardingComplete()` with no screen
that needs the result, or (b) entangle the splash/`_layout` startup path with a routing branch
that has no downstream reader — premature, and reversible-cost is low to add later. The
school-selection store's `isOnboardingComplete()` is **unchanged and ready** for the step that
owns the gate.

*Considered and rejected:* a lightweight `Redirect` in `(tabs)/index.tsx` (Home) keyed on
`!isOnboardingComplete()`. Rejected for this ship: Home currently renders the personal-events
list (no calendar dep), so the redirect is *technically* safe — but it makes onboarding a hard
first-run wall before the source steps (QR/iCal, ships 3–5) that the user may prefer over the
school pick, and it bakes in a routing posture better decided once all source steps exist. The
posture is **recorded in ADR 015** with this revisit trigger, so the gate is a deliberate
follow-on, not an oversight.

## D5 — Accessibility: heading role + accessible CTA + trivially-met reduced-motion

**Decision.** The welcome title uses `ThemedText type="title"` (the encoded heading-role
contract → exposed as a heading to VoiceOver/TalkBack). The CTA is a `Pressable` with
`accessibilityRole="button"`, a translated `accessibilityLabel`, and a ≥44pt/48dp hit area
(min-height + `hitSlop`, mirroring the Profile links). The value-prop lines are plain
`ThemedText` (informational). Because the default surface is **static** (D2), the reduced-
motion obligation (Architecture Book a11y, discharged-by-pattern by splash) is **trivially
met** — there is no animation to gate. If the implementer adds a subtle entrance fade, it
reads `AccessibilityInfo.isReduceMotionEnabled()` and cuts under reduced motion (the splash's
encoded pattern), keeping the final frame identical. Manual VoiceOver/TalkBack, touch-by-
finger, and contrast-eyeball passes are on-device → inboxed (D7).

## D6 — Maestro: extend the existing onboarding flow (welcome → CTA → live school read)

**Decision.** `mobile/.maestro/onboarding.yaml` is **extended**, not replaced, preserving the
Phase-2 live `GET /schools` round-trip proof:

1. cold-launch → `stopApp` → `openLink: timecalendar-dev://onboarding` (now the **welcome**
   surface) → iOS-only optional `tapOn "Open"`,
2. `extendedWaitUntil visible: <welcome title>` — the brand surface renders,
3. `tapOn` the "Get started" CTA (by its stable text/testID),
4. `extendedWaitUntil visible: <school step title>` then
   `extendedWaitUntil visible: "My Gaming Academia"` — the seeded ASCII fixture from the live
   `GET /schools` round-trip (unchanged from Phase 2; the app → generated client →
   `customFetch` → NestJS → Postgres proof is preserved, just reached via the CTA).

It still does NOT drive the nested group step (group selectors vary by fixture — the Phase-2
rationale stands). Shared across iOS + Android (stable localized text / testIDs, no
per-platform selectors).

**Why extend, not add a second file.** There is one onboarding flow; the welcome → school
path is the happy path, and asserting both the brand surface and the live school read in one
flow keeps the e2e count honest (one flow per user journey, the established posture).

## D7 — Human-blocked items (inboxed, never blocking)

Two inbox notes, each `(HUMAN: see inbox/…)`-tagged in `tasks.md`:

1. **`docs/react-native-migration/inbox/2026-06-15-onboarding-design-polish.md`** — the
   designer onboarding polish: real illustrations/iconography, final brand copy, optional
   motion or a multi-page intro, and the decision on a white-on-brand CTA (which would earn the
   `primaryStrong` `#C2185B` token). *Why blocked:* we have no RN design artifacts and the
   final brand surface is a design decision, not an engineering one (R-3 — the native-default
   surface ships now; the polish is additive). *How to verify:* the polished surface renders on
   both platforms, copy is final FR + EN, contrast re-verified. *Blocks:* nothing — the ship is
   complete and shippable without it; this is the quality-polish follow-up.
2. **`docs/react-native-migration/inbox/2026-06-15-onboarding-flow-dod-manual.md`** — the
   on-device DoD axes (manual VoiceOver + TalkBack on the welcome surface + the CTA; native-
   correctness feel of the welcome → school push, both platforms light/dark; touch-target by
   finger; contrast eyeball against the documented brand/token pairs; and running the extended
   `onboarding.yaml` on iOS + Android). Mirrors the Phase-2 school-selection DoD inbox note.

## Migration plan (order)

1. The onboarding feature folder (`src/features/onboarding/ui/welcome-screen.tsx` + barrel) +
   its colocated test.
2. The Stack re-order: new `src/app/onboarding/index.tsx` (welcome), move the school re-export
   to `src/app/onboarding/school.tsx`, leave `groups.tsx` / `_layout.tsx` untouched.
3. The welcome CTA → `router.push("/onboarding/school")`.
4. i18n FR + EN keys (`onboarding.welcome.*`).
5. Repoint the Profile entry (label review) — no structural change.
6. Extend `mobile/.maestro/onboarding.yaml` (welcome → CTA → live school read).
7. Docs: ADR 015 + README row; Architecture Book "Features → School selection / onboarding"
   (record the welcome surface + the new `onboarding` feature folder + the deep-link shift);
   the Rule changelog entry; the golden-path "closest references" + axis-table note (a new
   presentation-only feature beside splash); the roadmap step-1 tick.
8. The two inbox notes.
9. Gates: `npx tsc --noEmit`, `npm run lint`, `npm test` (coverage gate green — the welcome
   screen is `ui/`, under the 70% floor; no 90%-logic glob added).

## Decision: ADR 015 (onboarding feature shape + welcome-first flow + reachable-not-gated)

**Status:** Accepted (recorded in `.claude/rules/mobile/decisions/015-onboarding-flow-shape.md`).

**Context.** Phase 3 grows the Phase-2 onboarding surface into a real first-run experience. The
flow's framing/brand surface needs a home, the entry route order must be decided, and whether
first-run forces onboarding is a startup-routing call — all three are copied by the later source
steps (QR/iCal) that also live under onboarding, so they earn an ADR (R-4).

**Decision.** (1) Onboarding is its **own presentation-only feature folder**
(`src/features/onboarding/ui/`, splash-shaped), not a sublayer of school-selection (D1).
(2) The onboarding Stack is **welcome-first**: `index` = welcome, school moves to
`/onboarding/school`, groups unchanged (D3). (3) Onboarding is **reachable but not a hard
startup gate** — the first-run auto-redirect is deferred to the step whose calendar/home
consumes the selection (D4).

**Alternatives rejected.** Growing `school-selection/ui/` (conflates a brand intro with a
server-read picker — D1); keeping `index` = school with a separate `welcome.tsx` (the entry
deep link / Profile link would still land on the bare list — D3); adding a first-launch gate now
(no downstream consumer; entangles startup routing prematurely — D4).

**Consequences.** The QR + iCal source steps (ships 3–5) inherit the `onboarding` feature folder
as the home for source-step framing UI; the welcome-first order is the entry posture; the gate
is a recorded, ready-to-add follow-on (`isOnboardingComplete()` stands). No new dependency, no
native change, no new lint rule (the existing boundaries/i18n/a11y/coverage gates cover it).

**Revisit if.** The calendar/home step lands and wants the first-launch gate (add the redirect
then, keyed on `isOnboardingComplete()` — the deferred half of D4); or the source steps (QR/iCal)
need onboarding to own more than presentation (extend the feature's sublayer set with their
evidence, per ADR 014's open set); or a designer-driven multi-step intro replaces the single
welcome surface (re-weigh D2's native-default surface).
