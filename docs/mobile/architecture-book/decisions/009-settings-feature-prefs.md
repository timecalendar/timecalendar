# 009 — Settings owns app preferences

## Status

Superseded by the feature-layer pattern in [ADR 014](./014-layered-feature-module-pattern.md).

Settings owns typed theme and language preferences in `@/storage`. Theme and i18n startup
may read that store directly; the dependency remains acyclic and is lint-encoded.
