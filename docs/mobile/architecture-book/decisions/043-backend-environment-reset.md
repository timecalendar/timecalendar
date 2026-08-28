# 043 — Backend environment capability and reset protocol

## Status

Accepted.

## Context

Store preview and production share the production app identity, Firebase project and signing
configuration. OTA channel, application identity and development mode therefore cannot safely
authorize backend switching. SQLite, MMKV, TanStack Query, notification registration and calendar
sync also cannot participate in one storage transaction, so changing only the URL could run state
from one backend against another.

## Decision

Resolve one explicit `development | preview | production` backend capability in app config,
independent from identity and OTA configuration. Missing or malformed capability is production.
Development allows local, preproduction and production; preview allows preproduction and
production; production allows only production. URLs are fixed constants, except the compiled
development-only `EXPO_PUBLIC_API_URL`; no runtime URL setter exists.

Switching is a destructive roll-forward protocol. It writes a versioned current/target journal,
quiesces requests, runs the registered session participants, wipes all four SQLite tables, clears
backend-bound and unknown MMKV values plus Query state, commits the target, removes the journal,
records enum-only diagnostics and reloads. Startup mounts no Query, route, sync or notification
consumer while a journal exists. Failure keeps the prior committed target and journal so an
idempotent retry finishes the wipe.

MMKV values are classified centrally. Theme, language, display timezone and Changelog
acknowledgement are global; selected environment and the temporary journal are reset controls;
everything else, including future unknown keys, is backend-bound. React Native currently has no
auth/session store, so its participant registry is explicitly empty and tested. Any future auth or
session feature must register an idempotent clear participant before shipping.

## Consequences

Preview defaults to preproduction and exposes an ordinary Settings control. Development also
offers local. Production renders no control and cannot resolve persisted non-production state.
The reset intentionally deletes local personal events and checklists as part of the
coherent-empty-state promise.

Superseded 2026-08-28 (TIM-269): the original consequence "Local and preproduction show a
persistent accessible marker" no longer holds. The Settings environment entry is the sole
non-production indicator and must expose the effective environment in its accessible name on both
platforms. No environment chrome may consume layout insets or otherwise change screen composition
relative to a production build. Only this consequence is superseded; Context and Decision stand.

The embedded capability changes SDK 56 fingerprints in all preview/production lanes; fresh native
builds are required before this JavaScript can be distributed there. This decision does not itself
authorize a build, submission, OTA publish, promotion or rollout.

## Revisit if

Revisit when storage volume makes a full wipe impractical, or when a real authenticated session
feature needs to join the participant registry. Do not replace the journal with best-effort
parallel clearing unless every owned store participates in one atomic transaction.
