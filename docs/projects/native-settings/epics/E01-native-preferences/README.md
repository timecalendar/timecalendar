---
kind: epic
id: E01
status: planned
traces-to: [P01, P04, D01, D04, D05]
depends-on: []
---

# E01 — Settings and appearance feel native

## Outcome

The hub, theme, and language follow platform conventions with immediate preference updates.

## Demonstration

Open Settings, change theme, and observe app/native controls agree. Choose French/English
through a checkmarked iOS page or Android radio dialog. Device-language mode responds through
the bounded listener without overriding explicit choices.

## Definition of done

T01 passes behavioral gates. Existing URLs and preferences remain valid. Each page has
one navigation and scrolling owner. About/environment consumers still work. Owner-led visual
acceptance is required before release, with no separate ticket.

## In scope

Native hub/theme/language composition, existing-API locale refresh, and relevant spec updates.

## Out of scope

About/calendar-management redesign, OS app-language integration, and permission management.

## Risks and boundaries

T01's first journey proves native Form/Router integration. If it cannot meet supported-device
requirements, revisit D01; do not substitute a custom replica. The language step may omit optional refresh
if it exceeds D04's boundary.

## Tickets

- [T01: Native hub, theme, and language](T01-native-preferences.md)
