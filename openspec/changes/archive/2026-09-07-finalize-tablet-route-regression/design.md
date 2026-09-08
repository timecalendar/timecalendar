## Context

The tablet foundation and route-polish changes already own responsive composition. This final change reconciles their route inventory and addresses only concrete regressions found while exercising the integrated application.

The forms place a scrolling body and a sibling action region inside `KeyboardAvoidingView`. Padding behavior can leave that sibling behind the iOS keyboard, while a fixed header above the layout means the native keyboard offset cannot safely be assumed to be zero. The shared layout can measure its window position without changing feature ownership.

The native suite now intentionally contains three business journeys. The personal-event journey opens a platform alert whose confirmation and underlying editor action share the same label. Android exposes its alert actions side-by-side; iOS exposes the confirmation above the editor action.

## Goals / Non-Goals

**Goals:**

- Make every matrix row describe shipped portrait behavior or an explicit no-change disposition.
- Keep form actions reachable under the software keyboard without introducing feature-specific layout forks.
- Keep the personal-event delete proof deterministic within the three-journey native budget.
- Tie every correction to focused static or component regression coverage.

**Non-goals:**

- No new responsive primitive, route, persistence behavior, API contract, native configuration, dependency, generated client, or migration.
- No landscape, multitasking, sidebar, optional-column, or legacy Flutter work.
- No claim of local simulator or physical-device execution where the host cannot provide it.

## Decisions

### D1 — Reconcile the existing route matrix in place

The tablet quick-wins matrix remains the single route inventory. Rows describe the actual measured-lane or full-bleed implementation and name focused evidence rather than duplicating the inventory in another report.

### D2 — Apply the measured keyboard-safe offset per platform

The shared layout wraps its keyboard-avoiding region in a measured owner. `measureInWindow` supplies the top offset after layout, and only finite non-negative measurements update state. Both platforms use height behavior so the sibling action region participates in the unobscured height.

iOS receives the measured top offset. Android receives zero because React Native's Android keyboard frame is already window-relative; adding the owner's top position back to that frame extends the avoided region below the keyboard edge.

### D3 — Keep content and actions independently owned

The scroll body retains `flex: 1`; the action region remains a sibling with the same adaptive lane. Feature screens continue to own their fields and actions, and existing test IDs gain only a derived window-owner anchor.

### D4 — Follow each native alert hierarchy

After positively observing the delete alert, Android selects the confirmation to the right of Cancel. iOS selects the confirmation above the editor's sticky delete action. The branches rejoin at the positive Agenda anchor and exact event-absence assertion.

### D5 — Preserve the three-journey native budget

The integrated-base smoke-pack change removes the earlier route-by-route YAML suite. Rebase resolution keeps those deletions and ports only the still-reproducible personal-event alert defect into `02-personal-event.yaml`; no retired flow is restored.

## Verification

- Focused keyboard-safe layout, feature-form, and Maestro selector suites.
- Full mobile TypeScript, lint, and coverage bar.
- Native harness contract and strict OpenSpec validation.
- Exact-head Android/iOS manual workflow dispatch; infrastructure failures are reported as such and product assertions are repaired before review.
- Retained native hierarchy geometry confirms the submit action stays above the Android keyboard boundary.
