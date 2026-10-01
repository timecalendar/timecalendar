---
kind: decision
id: D07
status: approved
traces-to: [P05, P03]
supersedes: []
---

# D07 — A thin renderer boundary, pure paging math in data/, and a renderer CI-checked to compile

## Context and evidence

**Compiler bail-out.** The production React Compiler (`babel-plugin-react-compiler@1.0.0`) bails out
on `OwnedCalendarShell` with "Cannot access refs during render", because of
`useRef(new Map()).current` at `renderer/owned-calendar-shell.tsx:194-195`. Lint (react-hooks 7.1.1)
uses a newer compiler and stays green (R06 §1).

**Defensive machinery.** The coordinator and zoom hold about 22 shared values plus 17 refs and 4
shared values of epochs, sequences and revisions. They exist only because the pager remounts
(R06 §2).

**Coverage.** The 90% branch gate excludes `renderer/` (`jest.config.js:124`).

**Renderer boundary.** ADR 033 allows the API to change ("without promising a public API"). Seven
transition props can collapse into `onDateCommitted(anchor)` (R01 §3).

## Options considered

- **Port the machinery** onto the new owner. That keeps races that no longer exist.
- **Delete any guard that cannot name the race it prevents** on a single scroll owner that never
  remounts (proposed).

## Proposed choice

**Boundary.** The shell API is context + viewport + `onDateCommitted(anchor)` + focus props, plus a
`requestZoom` handle. `ref` is passed as a prop, not through `forwardRef`.

**Data layer.** Paging math lives in `calendar/data`: index↔anchor, the window, settlement
reduction and chunk planning, all under the 90% gate.

**Renderer components** stay thin and use `useEffectEvent` instead of latest-ref patterns.

**CI checks:**
- A check runs the production compiler over `renderer/` and fails on any bail-out.
- The contract test is rewritten. It pins the new paging owner and keeps its existing bans
  (timers, `runOnJS`, `useMemo`/`useCallback`).
- The Reanimated jest mock is extended to pass through every scroll-handler key.

## Tradeoffs and consequences

- Behaviour tests are ported with new selectors (about 35). Mechanism tests are deleted (about 18).
  Two §6.1 "one swipe settles one page" tests are rewritten.
- The compiler check adds a CI step. The owner must accept it (R06 Q2).

## Approval

Owner (Samuel Prak) approved explicitly in the Claude Code planning session, 2026-10-01 (round-1 answers).
