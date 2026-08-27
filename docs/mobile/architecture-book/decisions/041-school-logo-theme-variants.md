# 041 — School logo theme variants

## Status

Accepted.

## Context

The school directory has one required logo URL per school. Many of those assets use dark ink
and lose contrast on the mobile dark-theme logo surface. Replacing the required URL with a
theme-specific structure would break the legacy Flutter client and existing web consumers.

## Decision

Keep `imageUrl` as the required light/default logo and add a required-but-nullable
`imageUrlDark` API field backed by a nullable relative object key in Postgres. The server
prefixes either key with the public bucket URL and emits `null`, never the bare bucket prefix,
when no dark asset exists.

The school-selection feature carries both URLs. Its logo component reads the active scheme
through `@/hooks/use-color-scheme`, selects `imageUrlDark` only in dark mode, and falls back to
`imageUrl` when the dark URL is null.

## Consequences

The API change is additive, so Flutter and web continue using the unchanged `imageUrl` string.
Server schema changes require OpenAPI and Orval regeneration. A dark object must be uploaded
before its database key is populated; removing one requires clearing the key before deleting
the object.

## Revisit if

Revisit when school branding needs more than light/dark variants, or when another client needs
server-driven art direction rather than the current nullable pair.
