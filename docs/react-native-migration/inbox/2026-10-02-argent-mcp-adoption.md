# Argent MCP server: adopt for Simulator work? Plus the iOS spike findings

**For:** the human owner (registering an MCP server changes the Claude Code setup, which agents
must not do on their own).

**Decision (owner, 2026-10-02):** adopt. Argent is registered in `.mcp.json` (pinned 0.26.0, telemetry off) and enabled in `.claude/settings.json`.

## What I need

1. Decide whether to add Argent as a project-scoped MCP server. The proposed `.mcp.json` (pinned
   0.26.0, telemetry off, no auto-approval) and the reasons are in `docs/perf/argent-mcp-assessment.md`.
   Do not run `argent init`: by default it installs globally, writes `~/.claude.json` and
   auto-approves every Argent tool.
2. Read the iOS Simulator evidence for E02 (`docs/perf/E02-ios-simulator-evidence.md`). Nothing
   trips a kill criterion on iOS. Two bugs and two gaps are carried into E04 and E05:
   - Grab-and-release mid-fling lands on the next page but never reports the settle (one-line fix:
     clear `dragging` in `onMomentumBegin`). E04 (T08).
   - The Android first-finger-lift pinch revert costs iOS a 1–2% zoom step at release. E05 (T11).
   - The calendar body is blank during the 350 ms push on iOS, because the first render waits for
     `onLayout`.
   - Header and gutter text is clipped at the largest Dynamic Type.

## Why

Agents may propose configuration but not change the owner's Claude Code setup. iOS hitch numbers
and VoiceOver need a physical iPhone. The Simulator cannot record Animation Hitches.

## How to verify

- Argent: after adding `.mcp.json`, `/mcp` in Claude Code lists `argent` with 77 tools, and
  `argent telemetry status` run with the same environment reports "disabled".
- iOS device pass: a Release build of the spike on a ProMotion iPhone, recorded with
  `xcrun xctrace record --template 'Animation Hitches'` during the swipe, fling and pinch scenarios
  (P02: ≤5 ms/s), plus VoiceOver checks R02 7 and R05 1, 4 and 6.

## Blocks

Nothing. E04 and E05 can take the findings now; the device pass gates the release, not the merges.
