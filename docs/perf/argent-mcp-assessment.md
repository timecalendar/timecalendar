# Argent MCP server: assessment for the calendar work

[Argent](https://docs.swmansion.com/argent/docs/fundamentals/mcp-server/) (Software Mansion,
`@swmansion/argent`) is an MCP server and CLI that lets an agent drive and inspect iOS Simulators,
Android emulators and devices, and the React Native app running in them. This assessment comes from
the E02 iOS Simulator run ([`E02-ios-simulator-evidence.md`](E02-ios-simulator-evidence.md)), which
drove every gesture with Argent 0.26.0 through its CLI. The CLI uses the same tool server as the MCP
server.

**Recommendation: adopt it, project-scoped and pinned, with telemetry off, for agent-driven
Simulator work on the calendar. Do not use it as a performance-measurement tool.** Registering it
changes the Claude Code setup, so the owner decides (see the inbox note
`docs/react-native-migration/inbox/2026-10-02-argent-mcp-adoption.md`).

## What it does

77 tools in 0.26.0, grouped:

- **Devices and apps:** `list-devices`, `boot-device`, `launch-app`, `restart-app`,
  `reinstall-app`, `open-url`, `rotate`, `button`, `shake`, `settings-permissions`.
- **Input:** `gesture-tap`, `gesture-swipe`, `gesture-pinch`, `gesture-rotate`, `gesture-custom`
  (timed one- and two-finger touch streams with interpolation), `keyboard`, `paste`, and
  `run-sequence` (several steps in one call).
- **Screen:** `screenshot`, `screenshot-diff`, `describe` (accessibility tree), `await-ui-element`,
  `await-screen-idle`, `screen-recording-start` / `-stop`.
- **React Native:** `debugger-connect`, `debugger-evaluate` (CDP into Hermes),
  `debugger-component-tree`, `debugger-inspect-element`, `debugger-log-registry`,
  `debugger-reload-metro`, network logs, and the React profiler (`react-profiler-*`, commits,
  renders, Hermes CPU).
- **Native:** `native-full-hierarchy`, `native-view-at-point`, `native-find-views`, and
  `native-profiler-*` (Instruments CPU, hangs and leaks on iOS; Perfetto on Android).
- **Flows:** recorded YAML replays (`flow-*`).

It needs no package inside the app. On the iOS Simulator it injects its own dylibs into the app
process.

## What it was worth in this repo

| Need                                                    | Before                                                                                 | With Argent                                                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Two-finger pinch on the iOS Simulator                   | Only by hand (option-drag) or an XCUITest target; Maestro and `idb` have no multitouch | `gesture-custom` with `x2`/`y2`, including holding the fingers and lifting one finger first    |
| Timed swipe chains (Android harness timing)             | `idb ui swipe` per stroke, a new process and hundreds of ms between strokes            | One `gesture-custom` call: a planned 6.0 s chain of 20 strokes ran in 6.5 s                    |
| Rotation during a fling                                 | Not scriptable                                                                         | `run-sequence` of `gesture-swipe` then `rotate`                                                |
| Read on-screen state                                    | Screenshots                                                                            | `describe` returns the accessibility labels (the spike's status line)                          |
| Native CPU and hang profile of the app on the Simulator | Instruments by hand                                                                    | `native-profiler-start/stop/analyze` produced a hotspot report (no hangs) for two swipe chains |
| MCP handshake                                           | –                                                                                      | `argent mcp` answered `initialize` (`argent 0.26.0`) and `tools/list` (77 tools)               |

Limits found in use:

- **`describe` stalls the app.** One call blocked the app's UI thread for about 500 ms (worst frame
  gap 291 ms). Never read state with it inside a timing window.
- **It cannot measure hitches.** Argent has no frame-timing tool. Its native profiler covers CPU,
  hangs and leaks, not Animation Hitches, and Instruments does not support Animation Hitches on the
  Simulator anyway. iOS hitch numbers still need a physical iPhone and `xctrace`.
- **Coordinates after a rotation.** After rotating the iPad Simulator to landscape, a
  `gesture-swipe` meant as horizontal scrolled the calendar vertically. Normalized coordinates
  appear to stay in the portrait device frame. Check the frame before scripting landscape gestures.
- **Each CLI call takes about 2 s** (a tap took 1.9 s). Batch steps with `gesture-custom` or
  `run-sequence`. Through MCP the server stays up, but the per-tool latency is similar.
- **The injected dylibs** run inside the app under test. That is fine for correctness checks, but
  keep it in mind for profiling.
- **Pre-1.0** (0.26.0, 2026-09-25, with near-daily prereleases): pin the version.

## Safety

- **Local.** Everything runs on the Mac, with no account and no cloud device. Only telemetry leaves
  the machine.
- **Telemetry is on by default.** It sends a hashed device ID, tool names, success rates, durations
  and OS and Node versions to `argent-otel.swmansion.com`; no code, paths or tool inputs. Turn it
  off with `DO_NOT_TRACK=1` or `ARGENT_TELEMETRY=0` (`argent telemetry status` confirms
  "disabled, source: environment").
- **License is mixed.** The JS source is Apache-2.0. The `simulator-server`, `ax-service` and the
  iOS dylibs are proprietary binaries.
- **Footprint.** About 240 MB of `node_modules` (native builds of `tree-sitter` and a QUIC
  transport). A `~/.argent/` state directory and a background tool-server process
  (`argent server stop` ends it).
- **`argent init` edits global config by default.** It installs globally, may write
  `~/.claude.json`, adds `mcp__argent` to `permissions.allow` (auto-approving every Argent tool,
  including `debugger-evaluate` and `reinstall-app`), and copies 18 skills plus rules and agents into
  `.claude/`. **Do not run `init`.** Register the server by hand instead.

This run installed Argent into a scratch directory only, with telemetry disabled through the
environment. It ran no `init` and did not touch `~/.claude.json`, `~/.claude/settings.json` or the
repo's `.claude/`.

## Proposed setup for Claude Code

A project-scoped `.mcp.json` at the repo root, pinned, with telemetry off and no auto-approval:

```json
{
  "mcpServers": {
    "argent": {
      "command": "npx",
      "args": ["-y", "@swmansion/argent@0.26.0", "mcp"],
      "env": { "DO_NOT_TRACK": "1", "ARGENT_TELEMETRY": "0" }
    }
  }
}
```

- `npx -y @swmansion/argent@0.26.0 --version` resolves and runs without a global install. The
  first start downloads into the npm cache, which takes a few seconds.
- Claude Code asks once to trust a project `.mcp.json` server. Leave the tools on per-call approval,
  or allow only read-only ones (`describe`, `screenshot`, `list-devices`) in `.claude/settings.json`.
- Without registering anything, the same tools work from a shell:
  `DO_NOT_TRACK=1 npx -y @swmansion/argent@0.26.0 run <tool> --<flag> <value>`
  (`argent tools describe <tool>` lists the flags).
- To remove it: delete the `.mcp.json` entry, run `argent server stop`, and delete `~/.argent/`.

## Use for the calendar work

- **Yes:** E04/E05 regression passes on the Simulator (chained swipes, diagonals, pinch with a held
  frame and staggered finger lifts, rotation during a fling), screenshots at exact gesture moments,
  the React component tree and Hermes logs without a Metro terminal, and quick CPU and hang
  profiles.
- **No:** hitch ratios and frame timing (physical iPhone with `xctrace`, and the Android
  `mobile/perf/` harness on the OnePlus 6), VoiceOver checks, and physical-iPhone runs that need
  multitouch (on a physical iPhone, Argent supports only a subset of gestures).
