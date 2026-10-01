---
kind: ticket
id: T03
epic: E02
status: done
traces-to: [P02, P06, D08]
depends-on: []
size: M
confidence: medium
---

# T03 — Android performance harness on release APKs

## Outcome

One command on the PC builds a profileable release APK, installs it on the attached device, runs scripted swipe, scroll and pinch scenarios, and prints frame statistics.

## Scope

- `mobile/perf/` scripts: `dumpsys gfxinfo` framestats with p50/p95/p99 and janky %, a Perfetto config, `dumpsys meminfo` view counts.
- A perf build variant: `profileable`, Reanimated profiling via a config plugin.
- A README with the PC build command.

## Non-goals

- iOS automation.
- CI integration.

## Definition of done

- The harness runs against the current `main` build on the OnePlus 6 and its output is committed as a sample.

## Acceptance and verification

- Run end to end from the PC with the phone attached to the PC or the Mac.

## Likely work sites and reading

- research/R03-rendering-and-zoom-performance.md §6
- research/R07-governance-and-verification.md §3
- `mobile/EAS.md`
- `mobile/app.config.ts`

## Size and confidence drivers

Scripted swipe cadence through `adb input` is unverified; Perfetto FrameTimeline is unavailable on Android 11.

## QA and sensitive surfaces

Never ship the perf variant to stores.
