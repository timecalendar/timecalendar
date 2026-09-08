# 047 — Hold calendar-import legality in an ephemeral, Stack-scoped journey

## Status

Accepted.

## Context

The import journey carries an institution, optional programme name, one validated export-guide
snapshot, page progress, completion, and the manual selector's QR/iCal handoff. Persisting any of
that journey identity can attribute a later import to an obsolete selection or revive completion
for a different guide. The persisted export-guide catalogue is rebuildable content cache, not
proof that a student completed the current journey.

Manual import, QR, and iCal are route siblings and may appear in restored navigation or direct
links. In production-capable builds those routes must fail closed without redirect loops. A test
bypass is useful, but compile-time development globals and route parameters are not trustworthy
build identity.

## Decision

One reducer-managed discriminated state is mounted once around the onboarding Stack in
`src/app/onboarding/_layout.tsx`.

- The empty and draft branches carry no guide data. Resolving, provider-selection, blocked,
  active-guide, and completed branches carry only the values legal for that phase.
- Active and completed branches pin the validated provider pages, locale, catalogue version,
  provider identity, draft revision, and contiguous visited-page bound. Only completed carries
  completion and the QR/iCal handoff marker.
- Institution, programme, provider, locale, or newly resolved catalogue-version changes return to
  an incomplete branch. Backgrounding retains the mounted React state; Stack exit or process death
  constructs the empty state. No journey field is written to MMKV, SQLite, route parameters, or a
  global store.
- `toCreateFields` remains the single pure derivation from the current draft to the existing create
  seam. The no-draft value remains total for non-creating recovery renders, but cannot authorize a
  create action.
- Manual import requires the completed branch. QR and iCal additionally require the matching
  handoff written by the guarded manual selector. Illegal routes recover to provider selection for
  a complete unlisted draft, guide page 0 for a complete listed draft, or School otherwise. When
  that target equals the current route, the screen renders closed recovery and ordinary Back
  instead of replacing itself.
- The only completion seed is an explicit context API that checks the runtime-verified development
  variant. Production rejects it; route parameters, persisted values, and `__DEV__` are not inputs.

Rejected: the school-selection store (wrong lifetime), another global store, navigation-parameter
state, independent nullable draft/snapshot/completion fields, and screen-local route guards.

## Consequences

- Invalid snapshot/completion combinations are removed structurally, and stale asynchronous
  results carry a draft revision, locale, selector, and attempt identity before they may reduce.
- Native Back can revisit already visited guide entries without changing completion. Next is the
  only action that extends contiguous progress; final Next records completion before pushing the
  manual selector.
- A restored manual/QR/iCal route after process death cannot create and returns to School. A live
  process may background and foreground without losing progress.
- Catalogue LKG persistence does not weaken route legality because it contains no draft, selected
  provider, visited bound, completion, or handoff.
- A resumable multi-process journey requires a new decision and a privacy review; it cannot be
  introduced by adding a storage write to this context.

## Revisit if

- Product explicitly requires a guide journey to survive process death.
- Import creation moves outside the onboarding Stack.
- The server guide schema adds interactive state beyond validated plain-text pages and static
  images.
