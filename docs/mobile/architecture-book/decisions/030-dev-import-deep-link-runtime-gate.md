# 030 — Runtime-gate the development import route

## Status

Completed implementation record.

The development import deep link checks `extra.appVariant` at runtime and is unavailable
in preview and production builds. Compile-time dead-code elimination is not a security
boundary; production data import must use a separate authenticated product flow.
