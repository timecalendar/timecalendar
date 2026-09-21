# 035 — Display timezone is worldwide intent resolved at one seam

## Status

Accepted. Revised 2026-09-21 under approved native-settings decisions D01 and D02.

## Context

Event instants are UTC ISO text and all-day values are floating UTC day keys. The original
preference fixed device-zone travel shifts but limited manual selection to ten French zones.
Students also need exact worldwide identifiers and compatibility aliases, while operating-system
time-zone databases can lag the packaged catalog.

## Decision

- `settings.timezonePreference` remains the compatibility key. `"system"` selects the device
  zone; any exact identifier in the generated catalog is manual intent. Selection preserves an
  alias byte-for-byte and never substitutes a display-group representative.
- `settings.lastManualTimezone` independently remembers manual intent. Both keys are
  environment-independent. Automatic/manual transitions restore an available remembered value,
  seed first use from the device zone, and retain runtime-unavailable memory for later recovery.
- Catalog membership, runtime availability, stored intent, and the effective zone are distinct.
  Reads classify them without rewriting storage. Selection requires both catalog membership and
  current `Intl` support. Unavailable or corrupt intent falls back to a supported device zone and
  then `Europe/Paris` without erasing the stored value.
- One resolver remains load-bearing: `resolveTimezone` and `useDisplayZone`. Calendar display,
  personal-event input, and notification registration do not interpret preference storage.
- The catalog is deterministically generated from exact `@vvo/tzdb` and bounded English/French
  CLDR inputs. Search uses supplied identifiers, aliases, cities, countries, and localized
  exemplars offline. Runtime code imports only the generated feature artifact.
- `/timezone-settings` owns automatic/manual mode through the native settings host. A thin root
  chooser route uses Router's iOS form sheet and native toolbar/header search adaptation or an
  Android full-screen modal. One inset-aware `FlatList` owns chooser scrolling.
- Time conversion stays on `date-fns-tz`/`Intl`. Chooser offsets use a refreshed current instant;
  event offsets use each event instant. All-day events remain on the floating UTC-day path.
- The push side continues through `getEffectiveTimezone()`. Registration sends the same effective
  exact identifier while fixed scheduling policy remains independent.

## Consequences

- Package updates regenerate and check the bounded catalog and rerun representative search,
  runtime, and server-validator proofs.
- A catalog identifier may be disabled on an older runtime without being lost. An older build
  safely falls back when it reads a newer identifier and leaves the raw value recoverable.
- Every future event-time call site still accepts the effective zone explicitly. Device-local
  field math on an event instant remains a defect.
- Device inspection remains required for native sheet/search fidelity under D05; it is release
  evidence, not a repository merge gate.

## Revisit if

- Per-calendar time zones become a requirement.
- Packaged tzdb identifiers materially exceed supported runtime databases and need a versioned
  compatibility policy beyond visible disabling and fallback.
- Router's supported native search/presentation contract changes.
