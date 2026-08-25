# 010 — Reach Expo UI through the chrome seam

## Status

Completed implementation record; current rules are in [theming.md](../theming.md).

Native Expo UI controls are wrapped by `src/components/chrome/`. Feature code imports the
wrapper rather than the package so platform fallbacks and API changes stay localized.
