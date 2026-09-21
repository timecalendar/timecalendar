---
kind: epic
id: E02
status: planned
traces-to: [P02, P04, D01, D02, D05]
depends-on: [E01]
---

# E02 — Find and keep a worldwide time zone

## Outcome

Choose device time or search offline by common city, country, or zone identifier while
preserving existing values and event-time interpretation.

## Demonstration

Disable device mode, search Lyon, and select Europe/Paris. Toggle automatic on/off to restore
the manual choice. Search a French name, an unaccented spelling, UTC, and a fractional-offset
zone. Cancel without changing selection; inspect dynamic offsets and unchanged all-day dates.

## Definition of done

T03 covers catalog/migration/search/selection. Libraries own zone data and conversion.
Stored identifiers are not silently rewritten by display grouping. Event and push formatting
share the effective zone; daily notification processing stays at 19:00 Paris time.

## In scope

Standard catalog/CLDR labels, validated named zones, manual memory, native search, dynamic offsets.

## Out of scope

Every settlement, online geocoding, location access, manual zone rules, and per-user scheduling.

## Risks and boundaries

Aliases and old OS databases need compatibility tests. T03 needs T01's native presentation
contract; catalog work is an internal step. iPad/older iOS adapt natively rather than reproducing iPhone glass.

## Tickets

- [T03: Worldwide native time-zone search](T03-native-timezone-search.md)
