# Onboarding flow: a native-default brand/welcome surface that opens the existing school-selection flow

## Why

Phase 3 ("Onboarding & calendar sources") opens with **ship 1 of 5 — the onboarding flow**
(roadmap `docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md`, step 1): the
real first-run experience that introduces the app and leads the user into picking a calendar
source.

Phase 2's School-selection feature (Feature C) already built the **server-read half** of
onboarding: a nested `src/app/onboarding/` Stack (`_layout.tsx`, `index.tsx` = the school
picker, `groups.tsx` = the group picker) over `src/features/school-selection/` (data/ store/
ui/). But the user lands **directly on a bare school list** — there is no welcome/brand
surface, nothing that says "this is TimeCalendar and here is what it does." The Flutter app
opened onboarding with a **brand intro** (`app/lib/modules/onboarding/screens/onboarding_screen.dart`
— a 3-page carousel: "view your calendar" / "get notifications" / "welcome", then "C'est parti !"
→ school selection). This ship **grows** the existing onboarding Stack to add that first-run
brand surface in front of the school step — it does **not** start fresh and does **not**
rebuild the school picker (ship 2 grows that).

**This is a GROW, not a greenfield.** It reuses the existing onboarding Stack, the
school-selection feature, the splash feature's presentation-only `ui/`-only shape, and the
`@/theme` brand `primary` token. The new surface is a thin presentational welcome screen.

**Design assets are HUMAN-BLOCKED.** The Flutter intro used hand-drawn illustrations
(`assets/images/{home,notifications,schools}.png`). We do **not** have RN design artifacts,
and the migration philosophy (R-3) says the platform is the design reference, **not** the
Flutter app — so this ship builds a **tasteful native-default brand surface** (typography +
the brand `primary` accent on `@/theme` tokens, platform-idiomatic spacing, no Material port,
no copied illustrations). A "designer onboarding polish" follow-up (real illustrations /
motion / final copy) is **inboxed** and tagged `(HUMAN: …)` — the ship does not stall on
missing artifacts.

## What Changes

- **A new presentation-only onboarding feature folder — `src/features/onboarding/ui/`** (the
  golden-path layered shape; mirrors `src/features/splash/` which is also `ui/`-only — no
  `data/`/`store/`/`form/`, because this surface owns no data logic; design D1). It holds
  `welcome-screen.tsx` (the brand/welcome surface + a "Get started" CTA that navigates to the
  school step) and its colocated `*.test.tsx`, plus the `ui/` sub-barrel and the feature
  barrel.
- **The onboarding Stack is re-ordered so the welcome surface is the entry.** The nested
  `src/app/onboarding/` Stack today is `index` (school) → `groups`. It becomes
  `index` (**welcome**) → `school` (the existing school picker, **moved** from `index`) →
  `groups` (unchanged). All three remain thin route entrypoints re-exporting feature `ui/`
  sub-barrels (route-structure rule); the `onboarding` group stays a `Stack` sibling of
  `(tabs)` (non-tab route rule). Deep links shift accordingly:
  `timecalendar-dev://onboarding` → welcome, `…/onboarding/school` → school step,
  `…/onboarding/groups?schoolId=<id>` → group step (design D3).
- **The welcome CTA navigates to the school step.** "Get started" pushes `/onboarding/school`
  (the existing school picker), wiring the brand surface into Phase 2's read flow.
- **Onboarding stays reachable, NOT a hard startup gate (deliberate, recorded — design D4).**
  The Profile entry link is repointed at the welcome surface (`/onboarding`). A first-launch
  auto-redirect (gating first paint on `isOnboardingComplete`) is **deliberately deferred**:
  it belongs with the calendar/home step that consumes the selection (the Phase-2 deferral the
  School-selection section already records), and adding it here would be a startup-routing
  decision with no consumer yet. Recorded with rationale in `design.md` (D4); the school-
  selection store's `isOnboardingComplete()` is unchanged and ready for that later step.
- **i18n (FR + EN, `tsc`-typed parity).** New flat `onboarding.welcome.*` keys for the title,
  tagline, the value-proposition lines (calendar / notifications / welcome — the Flutter
  intro's three messages, re-authored as native copy), the CTA, and its accessibility label.
  The existing `profile.onboarding.link` label is repointed in copy if needed.
- **Accessibility.** The welcome title is a `ThemedText type="title"` (heading role via the
  encoded contract); the CTA is an accessible touchable (role + translated label + ≥44pt/48dp
  hit area). Reduced-motion: if any entrance motion is added it honors
  `AccessibilityInfo.isReduceMotionEnabled` (the splash's encoded contract) — the default
  surface ships **static** (no motion) so the obligation is trivially met (design D5).
- **A Maestro happy-path flow.** `mobile/.maestro/onboarding.yaml` is **extended** (not
  replaced): it now deep-links to the welcome surface, asserts the brand title renders, taps
  "Get started", and asserts the school step's seeded school renders from the live
  `GET /schools` round-trip (preserving the Phase-2 live-read proof). The deep-link target
  becomes the welcome entry; the school-step assertion is reached via the CTA tap (design D6).
- **A new ADR (next free number — 015)** records the load-bearing decisions: onboarding as its
  own presentation-only feature folder (vs. growing school-selection), the welcome-first Stack
  re-order, and the "reachable but not a startup gate" posture. Plus the Architecture Book
  "Features → School selection / onboarding" update, the new ADR README row, the Rule
  changelog entry, and the roadmap step-1 tick.
- **Full Definition of Done** walked axis-by-axis (automatable axes done; on-device axes
  inboxed + HUMAN-tagged), and the **designer-polish** follow-up inboxed + HUMAN-tagged.

## Non-Goals

- **No change to the school / school-group picker logic.** Ship 2 grows the picker
  (add_school / school / school_group parity). This ship only moves the school route under the
  welcome surface and re-exports the unchanged `SchoolPickerScreen` / `SchoolGroupPickerScreen`.
- **No first-launch startup gate / auto-redirect.** Reachability via the welcome surface only;
  the gate is deferred to the calendar/home step that consumes the selection (design D4).
- **No QR scan, no iCal import, no calendar-source persistence.** Those are Phase 3 ships 3–5.
  This ship ends at "the welcome surface leads into the existing school step."
- **No designer illustrations / motion / final brand copy.** Native-default surface now; the
  polished design artifacts are HUMAN-blocked and inboxed (R-3 — platform is the reference).
- **No new dependency, no `app.config.ts` / native-config change, no OpenAPI/server/`app/`
  change.** The welcome surface is pure RN-core + `@/theme` + i18n; nothing native is added.
- **No new lint rule / type / CI gate is introduced** (R-1): this ship adds runtime UI behind
  the *existing* encoded boundaries (feature-module boundaries, no-hardcoded-strings, a11y
  touchable rules, route-structure, coverage gate). No rule is created, so none needs
  enforcement beyond what already exists; the new code must pass the existing gates.
- **No new feature sublayer type.** `ui/`-only is the existing splash shape (ADR 014's open
  sublayer set already includes `ui/`); no boundary-rule change is needed.
