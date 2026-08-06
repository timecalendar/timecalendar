# 020 — Isolate calendar-kit behind a renderer seam

## Status

Superseded by [ADR 033](./033-calendar-renderer-module-boundary.md).

The former shared-chrome wrapper no longer exists. Direct imports outside the calendar-kit
adapter's exact vendor seam remain lint-forbidden.
