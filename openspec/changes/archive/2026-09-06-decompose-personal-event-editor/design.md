## Context

`PersonalEventFormScreen` is a 429-line feature screen that currently owns route resolution, edit prefill synchronization, mutable form values and validation errors, save orchestration, native delete-alert lifecycle, every input, and the sticky action footer. The behavior is well covered, especially the generation-token delete guard and display-zone conversion, but those unrelated responsibilities now make changes risky and trigger React Doctor's giant-component finding.

`ColorSwatchPicker` and `DateTimeField` live under the global `components/` directory even though the personal-event editor is their only production consumer. `ColorSwatchPicker` also exports preset data from its component module, producing React Doctor's non-component-export warning. The established layered-feature rule (ADR 014) already assigns forms and feature-specific presentation to `features/personal-events`; this change applies that rule without inventing a new architecture.

## Goals / Non-Goals

**Goals:**

- Give routing/loading, editor orchestration, ordinary fields, sticky actions, and destructive confirmation focused feature-owned boundaries.
- Keep every React component materially below 200 lines, targeting 100–180 lines where cohesion supports it.
- Preserve the exact create/edit/prefill, validation, display-timezone, color, save-failure, delete-cancel/dismiss/duplicate/success/failure/retry, navigation, keyboard, localization, accessibility, and selector contracts.
- Remove React Doctor's giant-component and component-file non-component-export findings through decomposition and module ownership.
- Keep sibling-sublayer imports direct and retain the feature's existing public barrels without introducing a self-barrel cycle.

**Non-Goals:**

- No visual, copy, route, persistence, API, schema, native configuration, dependency, E2E-workflow, or legacy Flutter change.
- No generic form framework, shared confirmation abstraction, or reusable global controls extracted from a single consumer.
- No suppression or threshold change for React Doctor, ESLint, TypeScript, Jest, or coverage.
- No new Architecture Book rule or ADR; only current-state ownership documentation changes if the implementation follows the existing rule.

## Decisions

### Decision 1 — Keep the route screen thin and compose private feature UI modules

`personal-event-form-screen.tsx` remains the default route-facing component and retains the existing public export. It will resolve `uid`, locale, display zone, theme-independent route data, and the event-to-edit hook, then render a private `PersonalEventEditor`. The editor owns mutable values/errors and save orchestration while composing a `PersonalEventFields` section and a sticky `PersonalEventActions` footer. The alert lifecycle moves behind a feature-private hook (for example `usePersonalEventDeleteConfirmation`) that returns the delete trigger and pending state.

These modules live together under `features/personal-events/ui/` and import `../form`/`../data` through sibling sublayer barrels rather than importing `@/features/personal-events` from inside the feature. Only the already-public route screen and list remain in `ui/index.ts`; implementation pieces need no public feature API.

Splitting by arbitrary line ranges was rejected because it would leave state and platform behavior coupled across meaningless files. Moving orchestration into a new global hook was rejected because it has one domain owner.

### Decision 2 — Prefer an initialized, keyed editor boundary over prop-to-state synchronization only after parity proofs

The route screen may replace the current guarded `useEffect` prefill with an editor whose initial values are derived at mount and whose key changes when the route/edit identity changes. The key must distinguish create mode, the current route `uid`, and the loaded event identity so late async resolution remounts the editor with populated values, while unrelated rerenders do not erase in-progress edits. Create mode must ignore any event value retained by the loader during a route transition.

This option is accepted only if focused tests prove all three states: blank create defaults, a `uid` that initially has no loaded event and later resolves, and a `uid` change with a stale earlier request that cannot overwrite the newer editor. If those proofs expose any observable loading, route-param, or prefill regression, the Applier will retain the existing microtask/active-guard synchronization inside the smaller editor rather than forcing a new lifecycle. Changing the loader's public contract or introducing a new visible loading state solely to remove the effect is rejected as unnecessary behavior change.

### Decision 3 — Preserve destructive correctness as one cohesive UI hook

The delete-confirmation extraction will move the existing phase ref, generation token, Android `onDismiss`, iOS presentation-edge microtask, pending render state, repository call, and success navigation together. The hook remains UI-owned because it coordinates `Alert` and route closure; `useDeleteEvent` remains in `form/` and continues to own the repository/recorded-error contract.

The extraction must not replace the synchronous ref with state-only exclusion, split token checks across components, or generalize the native alert. Tests will continue to capture the actual alert callbacks and prove cancel, Android dismissal, iOS reopen/invalidation, duplicate suppression, exactly-once success, failure preservation, and retry.

### Decision 4 — Move single-consumer controls and isolate palette data

`ColorSwatchPicker`, `DateTimeField`, and their tests move into `features/personal-events/ui/`. Palette values move to a non-component module such as `color-swatch-presets.ts`; the picker component file exports only the React component and its component-facing type if needed. The editor imports the preset default directly from the data module, resolving the React Doctor warning without suppression.

`DateTimeField` continues to import the native picker only through `@/components/chrome`, retain the compact Android dialog and inline iOS behavior, and round-trip wall-clock values through the effective display zone. Moving the control does not move or duplicate the chrome seam.

Compatibility re-export shims at the old global paths were rejected because there are no other production consumers and the goal is to leave global components genuinely shared.

### Decision 5 — Preserve selectors at the rendered boundary and verify the refactor in layers

Existing accessibility labels and `personal-event-*` test IDs stay on the same rendered controls. The screen-level suite remains the CI proof across the composed editor and continues to drive real validation/build helpers with mocked persistence hooks. The moved controls keep focused suites beside their new modules. New prefill/route-transition coverage is added if the keyed boundary is used, and delete tests may move beside the confirmation hook only if the screen-level suite still proves the user-visible integration.

React Doctor will run against the changed personal-events files after implementation. The giant-component and non-component-export findings are acceptance failures; any unrelated remaining finding must be listed with its rule, file, and evidence rather than suppressed. TypeScript, lint, focused Jest, and the full mobile Jest suite provide the remaining local gates; the full suite result must say whether Jest exited naturally.

## Risks / Trade-offs

- **[A keyed boundary resets edits on an unrelated rerender]** → Make the key depend only on route/edit identity and prove rerenders preserve typed values.
- **[A route transition initializes from a stale loaded event]** → Include route `uid` and loaded identity in the boundary key, ignore retained loader data in create mode, and retain the existing effect if parity is not demonstrable.
- **[Delete extraction weakens exactly-once behavior]** → Move the phase/token state machine as one unit and keep callback-level platform tests at the rendered boundary.
- **[Component decomposition creates prop plumbing or cycles]** → Keep state in one editor controller, pass typed values/errors/update callbacks downward, and use sibling barrels/direct relative UI imports rather than the feature self-barrel.
- **[Line-count chasing fragments cohesive code]** → Treat the 200-line ceiling as an acceptance bound and the 100–180 target as guidance; split only by the named responsibilities.
- **[Moved tests accidentally reduce coverage]** → Preserve each existing assertion, add lifecycle cases required by the chosen prefill strategy, and run focused plus full Jest.

## Migration Plan

This is an internal module refactor with no data or runtime migration. Move the controls and tests, extract the editor boundaries, repoint imports/barrels, and delete the obsolete global files in one branch so no compatibility window is needed. Rollback is a normal code revert; stored events, routes, selectors, and native configuration are unchanged.

## Open Questions

None. The keyed-prefill choice is deliberately resolved by focused parity tests during implementation, with retaining the current guarded effect as the smallest reversible fallback.
