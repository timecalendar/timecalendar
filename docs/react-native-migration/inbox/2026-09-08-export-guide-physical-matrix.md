# Export-guide named physical-device matrix

**For:** whoever runs physical-device accessibility passes (HUMAN: signed installation, physical
devices, VoiceOver, and TalkBack are unavailable to the repository agent and hosted simulators).

## What I need

Run every axis below against one implementation head on one supported iPhone with VoiceOver, one
supported iPad in portrait at both compact and readable-width boundaries, and one representative
supported low-end Android phone with TalkBack. Replace `NOT RUN` only with `PASS`, `FAIL`, or
`BLOCKED`, and add a short observation for every non-pass.

## Provenance

| Field                     | iPhone  | iPad    | Low-end Android |
| ------------------------- | ------- | ------- | --------------- |
| Exact commit SHA          | NOT RUN | NOT RUN | NOT RUN         |
| Model                     | NOT RUN | NOT RUN | NOT RUN         |
| OS/runtime                | NOT RUN | NOT RUN | NOT RUN         |
| Build identity/variant    | NOT RUN | NOT RUN | NOT RUN         |
| Fixture/catalogue version | NOT RUN | NOT RUN | NOT RUN         |
| UTC date                  | NOT RUN | NOT RUN | NOT RUN         |
| Tester role               | NOT RUN | NOT RUN | NOT RUN         |

## Required observations

| Stable axis ID                 | iPhone + VoiceOver | iPad portrait | Low-end Android + TalkBack |
| ------------------------------ | ------------------ | ------------- | -------------------------- |
| `theme-light`                  | NOT RUN            | NOT RUN       | NOT RUN                    |
| `theme-dark`                   | NOT RUN            | NOT RUN       | NOT RUN                    |
| `largest-text`                 | NOT RUN            | NOT RUN       | NOT RUN                    |
| `touch-targets`                | NOT RUN            | NOT RUN       | NOT RUN                    |
| `focus-progress-announcements` | NOT RUN            | NOT RUN       | NOT RUN                    |
| `native-back`                  | NOT RUN            | NOT RUN       | NOT RUN                    |
| `offline-first-run`            | NOT RUN            | NOT RUN       | NOT RUN                    |
| `fresh-lkg`                    | NOT RUN            | NOT RUN       | NOT RUN                    |
| `stale-lkg`                    | NOT RUN            | NOT RUN       | NOT RUN                    |
| `retry-after-restoration`      | NOT RUN            | NOT RUN       | NOT RUN                    |
| `safe-connect-url`             | NOT RUN            | NOT RUN       | NOT RUN                    |
| `missing-unsafe-connect-url`   | NOT RUN            | NOT RUN       | NOT RUN                    |
| `broken-image`                 | NOT RUN            | NOT RUN       | NOT RUN                    |
| `background-foreground`        | NOT RUN            | NOT RUN       | NOT RUN                    |
| `process-death`                | NOT RUN            | NOT RUN       | NOT RUN                    |
| `guarded-qr-ical-transition`   | NOT RUN            | NOT RUN       | NOT RUN                    |
| `ipad-compact-boundary`        | N/A                | NOT RUN       | N/A                        |
| `ipad-readable-boundary`       | N/A                | NOT RUN       | N/A                        |

For `native-back`, use the iOS swipe gesture on iPhone/iPad and system Back on Android. Confirm
that Back never exposes manual, QR, or iCal import before guide completion. For lifecycle and cache
axes, record the locale, theme, and font scale in the observation.

## Why

Simulator execution, Jest, and YAML validation cannot establish physical rendering, screen-reader
announcements, gesture behavior, target size, process lifecycle, or low-end interaction quality.

## How to verify

The matrix is complete only when every applicable cell has an explicit outcome and all provenance
fields name the same exact implementation SHA. A newer implementation head starts a new complete
matrix; keep this older record as historical evidence rather than editing its SHA.

## Blocks

Physical-device acceptance only. It is not a repository-merge approval gate and authorizes no
store installation, catalogue activation, live flag change, or environment mutation.
