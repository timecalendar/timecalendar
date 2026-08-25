# 034 — Settings is the third-tab identity

Status: Accepted. Supersedes ADR 025 only for the identity of the third tab.

## Context

TimeCalendar has no account, avatar, or user identity, but its third tab was named
Profile. The route mixed calendar management, event utilities, and preferences in
one unstructured screen.

## Decision

The stable tab hierarchy is **Home · Calendar · Settings**, with localized
Settings/Réglages copy and the platform gear symbol. `/settings` is canonical and owns a nested
native Stack whose screen is exported from `features/settings`. `/profile` redirects
to `/settings` for one released React Native version; internal callers use only the
canonical route.

Settings is a grouped destination hub. It contains only working destinations and uses
the held-calendar summary as the sole calendar-management entry.

Profile is rejected because it promises identity. Settings is accepted as the
idiomatic place to manage configured calendars, event visibility, appearance,
language, and notifications.

## Consequences

New Settings rows require a working route and an explicit section owner. The legacy
redirect can be removed after one released version once released deep links and
automation no longer require it.

Revisit the name if the product gains a real user identity surface or the
destination inventory becomes predominantly preference-only.
