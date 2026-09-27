# 061 — Separate Calendar conflict pointer and assistive targets

## Status

Accepted for T12. Native assistive-technology verification remains pending final QA.

## Context

T11 groups intersecting minimum-size event targets under one chooser so a pointer tap
cannot select a class by z-order. That chooser was also the single semantic trigger.
T12 requires every event on the committed page to appear once in chronological
assistive traversal and to open by its original identity. A single conflict trigger
cannot satisfy that event-by-event contract.

## Decision

Keep the T11 chooser over the union of intersecting targets for pointer taps. Exclude
its overlay from the accessibility tree; its existing modal remains accessible when
opened. Each underlying visible event tile is the sole semantic button for its own
identity, in committed-page chronological order, with its complete localized label.
Assistive activation opens that identity directly. The semantic target stays tied
to the visible tile and its meaningful activation geometry. Boundary-touching
targets remain direct for pointer and assistive input. Keep one bounded native event
tree and the existing vertical scroll and pager owners.

## Consequences

Pointer users retain explicit disambiguation; assistive users encounter the events
themselves. The renderer must prove one node per committed identity, exact routing,
complete labels, conflict-overlay exclusion, and bounded off-viewport reachability
with automated checks. Native VoiceOver, TalkBack, Voice Control, and Switch Control
operation, including dense conflicts and activation geometry, remains unverified and
belongs to the final QA checklist. Passing host checks cannot establish a native pass.

## Revisit if

Final native QA shows that an event in a conflict component is unreachable, ambiguously
activated, or detached from meaningful visible geometry on a supported platform. Record
the failing device, build, tool, fixture, and identity, then request the scoped D06
design revision before adding another semantic strategy.
