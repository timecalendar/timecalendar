# 005 — Calendar spike: first task of Phase 2, time-boxed 3 working days

> Origin: migration-approach §8, knob **K-5** (proto-ADR → real ADR at scaffold).

## Status

Accepted. Not yet started (Phase 2 opens after Phase 1 + 1.5).

## Context

The calendar timeline is the highest-uncertainty item in the whole migration
(custom dense-week rendering, overlaps, performance). Committing to custom-vs-library
blind would be the riskiest possible bet, so it must be de-risked with a bounded
experiment before any commitment.

## Decision

Open Phase 2 with a **3-working-day**, time-boxed read-only spike: render a real
dense university week on `@howljs/calendar-kit` v2 with our brand styling, real
overlaps, targeting 120fps. **Decision gate at the end: adopt / fork / build
custom.** Optional lightweight pre-read during Phase 1.5 if there is slack.

## Consequences

- Phase 2 starts with a concrete data point (a running spike), not a guess, before
  the calendar is committed.
- Whatever the gate decides (adopt / fork / build) becomes its own ADR, superseding
  the open question this one parks.
- Built on a foundation already validated by Phases 0–1 — the spike tests the
  calendar surface, not the surrounding architecture.

## Revisit if

The spike clearly succeeds or fails early — end it early either way (the 3-day box
is a ceiling, not a quota).
