# Phase 07 — Auxiliary features

> **Goal:** the remaining smaller modules needed for **full parity**. Individually light, collectively real work.
>
> **Depends on:** the established template (Phase 02). **Modules:** `add_grade`/grades, `activity`, `suggestion`, `profile`, `about`, `changelog`, `debug`.

## Rough steps

1. **Grades** (`add_grade`) — grade entry/display (check current server vs. local-only nature when reached).
2. **Activity** — sync/calendar activity log view.
3. **Suggestions** — user suggestion/feedback flow.
4. **Profile / About / Changelog** — mostly static screens.
5. **Debug** — internal debug menu (dev-only surface).
6. **User calendars** (`user_calendars_screen`, "Mes calendriers") — ✅ **shipped** (#221 + a11y/native refine #222): the management list over the Phase-03 durable store — per-calendar visibility checkbox (a render-only filter at the events-source seam, ADR 031), confirm-gated delete (button + iOS swipe + accessibility action, no undo), an add affordance → school selection, empty state, and the Settings calendar-summary entry. All machine-DoD axes green; `/iterate-screen` expert panel converged. **Pending human device pass** (`inbox/2026-07-05-user-calendars-device-pass-refine.md`) and a destructive-color token follow-up (`inbox/2026-07-05-destructive-token-contrast.md`).

## Exit criteria

- Each module at parity with Flutter behavior and passing full DoD (`debug` held to a lighter, internal bar).

## Risks & decisions

- Low individual risk; the risk is **volume** — many small screens, each still DoD-gated. Lean hard on the golden-path scaffolding to keep them cheap.
- Confirm per-module whether data is server-backed or device-local when reached (affects storage + migration relevance).
</content>
